import java.io.*; 
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel; 
import java.util.*;
import java.lang.String;
import java.lang.Math;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FSDataOutputStream;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;


/// This application uses an HDFS inverted index to rank documents for a set of 
/// queries. 
/// Usage:
/// hadoop jar simir.jar Retrieval InvertedIndexFileName QueryFile [parameter value]
/// -- "InvertedIndexFileName" is the name (including path) of the HDFS inverted file
///     (Make sure that you have all the three files: 
///                 + InvertedIndexFileName.lex: lexicon
///                 + InvertedIndexFileName.pos: posting
///                 + InvertedIndexFileName.dlen: doc length
/// -- "QueryFile" is the name (including path) of the query file
///                  It has the following format (each query at a separate line)
//         QueryID1 queryterm1 queryterm2 ... querytermN
//         QueryID2 querytermN+1 querytermN+2 .... 
/// -- "[parameter value]" this is an optional parameter to be passed to a retrieval model 
///     Its interpretation depends on the implementation. If not provided, the parameter
///      would take whatever default value hard-coded in the program. 
///     For example, if the retrieval model is Dirichlet prior, this may be the smoothing parameter
///      while if it's BM25, this may be parameter "b" for length normalization. 
	

/// This is an auxiliary class for sorting documents based on their scores. 
class ValueComparator implements Comparator { 
 
    Map base; 
    public ValueComparator(Map base) { 
	this.base = base; 
    } 
    
    public int compare(Object a, Object b) { 
	
	if((Double)base.get(a) < (Double)base.get(b)) { 
	    return 1; 
	} else if((Double)base.get(a) == (Double)base.get(b)) { 
	    return 0; 
	} else { 
	    return -1; 
	} 
    } 
}

    

/// This is the main class for retrieval.
public class Retrieval {

    /// This function returns the weight of a matched query term for a document
    /// rawTF: raw count of the matched query term in the document
    /// docFreq: document frequency of the matched term (i.e.., total number of documents in the collection
    ///                 that contain the term
    /// docCountTotal: total number of documents in the collection
    /// termCount: the total count of the term in the whole collection
    /// totalTermCount: the sum of the total count of *all* the terms in the collection
    /// docLength: length of the document (number of words)
    /// avgDocLength: average document length in the collection
    /// param: a retrieval parameter that can be set to any value through the third argument when executing "Retrieval" 
    static double weight(int rawTF, int docFreq, int docCountTotal, int termCount,int totalTermCount, int docLength, double avgDocLength, double param) {
	double idf = Math.log((1.0+docCountTotal)/(0.5+docFreq));
	return (rawTF*idf); 
	// this is the raw TF-IDF weighting, which ignored a lot of information 
	// passed to this weighitng function; you may explore different ways of 
	// exploiting all the information to see if you can improve retrieval accuracy.
	// BM25, Dirichlet prior, and Pivoted length normalization are obvious choices, 
	// but you are encouraged to think about other choices. 
    }
    


    public static void main (String [] args) throws IOException {
	

	/// This class defines the type Entry to pack all the information about a term stored in a lexicon entry. 
	class Entry {
	    public int df; // document frequency
	    public int count; // term count in the collection
	    public long pos; // start position of entries in the posting file
	    public int length; // span of postering entries 
	    Entry(int d, int c, long p, int l) {
		pos=p;
		length = l;
		df =d;
		count=c;
	    }
	}
	
	double retrievalModelParam = 0.5; // default retrieval parameter; this should be set to a meaningful value
	// for the retrieval model actually implemented. 

	// the following is standard HDFS setup 
	Configuration conf = new Configuration();
	conf.addResource(new Path("/hadoop/conf/hadoop-default.xml"));
	conf.addResource(new Path("/hadoop/conf/hadoop-site.xml"));
	FileSystem fs = FileSystem.get(conf);
	FSDataInputStream finlexicon=null;
	FSDataInputStream  finposting=null, findoclen=null, finquery=null; 

	//Hash table for the lexicon:key is a term, value is an object of class Entry
	HashMap<String,Entry> lex= new HashMap<String,Entry>();

	// Hash table for the score accumulators: key is docID, value is score.
	HashMap<String,Double> acc = new HashMap<String,Double>();

	// Hash table for storing document length: key is docID, value is doc length
	HashMap<String,Integer> dlen = new HashMap<String,Integer>(); 


	Entry termEntry = null;
	byte [] buffer = null; 
	String docID =null;
	int termFreq; 
	StringTokenizer st=null;
	String term =null;
	int i; 
	double s; 

	int resultCount=1000; // this is the maximum number of results to return for each query

	if (args.length>=3) {
	    retrievalModelParam = Double.parseDouble(args[2]); // parse the provided parameter value if available.
	}

	String t=null;
	BufferedReader reader = null;
	try { 
	    // open the three files for the index
	    finposting = fs.open(new Path(args[0] + ".pos" ));
	    finlexicon = fs.open(new Path(args[0] + ".lex"));
	    findoclen = fs.open(new Path(args[0] + ".dlen"));


	    // open the query file
	    finquery = fs.open(new Path(args[1])); 
	} catch (IOException ioe) {
	    System.out.println("file operation error: " + "args[0]="+ args[0] + ";args[1]="+args[1]); 
            System.exit(1);
	}

	// load the lexicon 
	int totalTermCount=0;
	while (finlexicon.available()!=0) {
	    term = finlexicon.readUTF(); 
	    int docFreq = finlexicon.readInt();
	    int termCount =finlexicon.readInt();
	    long  startPos = finlexicon.readLong();
	    int postingSpan = finlexicon.readInt();
	    lex.put(term,new Entry(docFreq,termCount,startPos, postingSpan)); 
	    //#########################################################//
	    // add a statement here so that after the loop, totalTermCount would 
	    // have the total count of the term in the whole collection
	    // Hint: how to update "totalTermCount"? 
	    // 
	    //#########################################################//
	    totalTermCount = totalTermCount + termCount;
	}	    
	finlexicon.close();
	
	// load doc length
	double avgDocLen =0;
	int totalDocCount=0;
	reader = new BufferedReader(new InputStreamReader(findoclen));
	while ((t=reader.readLine()) != null) {
	    st = new StringTokenizer(t);	
	    term = st.nextToken();
	    int docLen = Integer.parseInt(st.nextToken().trim());
	    dlen.put(term,docLen);

	    // we'll use this opportunity to compute the average doc length and the total number of documents in the collection
	    // note that it's better to precompute these values in the indexing stage and store them in a file
	    avgDocLen += docLen;  
	    totalDocCount++;
	}
	avgDocLen /= totalDocCount; 
	findoclen.close(); 

	// process queries 
	reader = new BufferedReader(new InputStreamReader(finquery));
	while ((t=reader.readLine()) != null) {
	    // each line has precisely one query: queryID term1 term 2.... 

	    st = new StringTokenizer(t); // A StringTokenizer allows us to decompose a string into space-separated tokens
	    String qid = st.nextToken(); // the first token should be the query ID
	    System.err.println("Processing query:"+qid); 

	    acc.clear(); // clear the score accumulator to prepare for storing new scores for this query

	    int qlen=0; // counter for computing the query length
	    while (st.hasMoreTokens()) {
		// read query terms 
		term = st.nextToken(); // read a query term 
		termEntry = lex.get(term); // fetch the lexicon entry for this query term 

		if (termEntry != null) {
		    qlen++; 
		    int df = termEntry.df; 
		    // df tells us how many pairs (docID termCount) for this term we have in the posting file 

		    finposting.seek(termEntry.pos); // seek to the starting position of the posting entries for this term

		    for (i=1; i<=df; i++) { // read in the df pairs 
			docID = finposting.readUTF().trim(); // read in a document ID
			termFreq = finposting.readInt(); // read in the term Count 
			int doclen = dlen.get(docID).intValue(); // fetch the document length for this doc 
			double tmpWeight = weight(termFreq,df,totalDocCount,termEntry.count,totalTermCount,doclen,avgDocLen, retrievalModelParam);
			// compute the weight of this matched term

			Double s1 = acc.get(docID); // get the current score for this docID in the accumulator if any
			if (s1 != null) { 
			    // this means that the docID already has an entry in the accumulator, i.e., the docID already matched a previous query term

			    //#########################################################//
			    // add one statement here to update the accumulator
			    // Hint: (1) use the function "acc.put(docID, ... )"; (2) use "s1.doubleValue()" 
			    //       to obtain the actual score value in s1. 
			    // 
			    //#########################################################//
			    acc.put(docID, tmpWeight+s1.doubleValue());
			    
			} else {
			    // otherwise, we need to add a score accumulator for this docID and set the score appropriately.
			    //#########################################################//
			    // add one statement here to set the score accumulator to the right value
			    // Hint: (1) use the function "acc.put(docID, ... )"
			    // 
			    //#########################################################//
			    acc.put(docID, tmpWeight);
			}
		    }
		    
		} else{
		    System.err.println("Skipping query term:"+term+ "(not in the collection)");
		}
	    }
	    

	    // At this point, we have iterated over all the query terms and updated the score accumulators appropriately
	    // so the score accumulators should have a sum of weights for all the matched query terms. 
	    // In some retrieval models, we may need to adjust this sum in some way, we can do it here

	    // adjustment of scores for each document if necessary
	    for (Map.Entry<String, Double> entry : acc.entrySet()) { 
		// iterate over all accumulators and use "acc.put()" to update the score
		// for example, the following statement would add |Q| log (mu/(mu+|D|)), which is needed for Dirichlet prior 
		/* 
		acc.put(entry.getKey(), entry.getValue().doubleValue()+
		qlen*Math.log(retrievalModelParam/(retrievalModelParam+dlen.get(docID).intValue()))); */
	    }

	    // now we've finished scoring, and we'll sort the scores and output the top N results 
	    // to the standard output stream (System.out)
	    ValueComparator bvc =  new ValueComparator(acc); 
	    TreeMap<String,Double> sortedAcc = new TreeMap<String,Double>(bvc); 
 	    sortedAcc.putAll(acc); 
	    i=0;
	    for (Map.Entry<String, Double> entry : sortedAcc.entrySet()) { 
		String key = entry.getKey(); 
		Double value = entry.getValue(); 
		System.out.println(qid + " " +key + " " + value);
		i++;
		if (i>=resultCount) {
		    break;
		}
	    } 

	}
    }
}


