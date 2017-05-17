import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.StringTokenizer;

import java.util.HashMap;


import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.conf.Configured;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapred.FileInputFormat;
import org.apache.hadoop.mapred.FileOutputFormat;
import org.apache.hadoop.mapred.JobClient;
import org.apache.hadoop.mapred.JobConf;
import org.apache.hadoop.mapred.MapReduceBase;
import org.apache.hadoop.mapred.Mapper;
import org.apache.hadoop.mapred.OutputCollector;
import org.apache.hadoop.mapred.Reducer;
import org.apache.hadoop.mapred.Reporter;
import org.apache.hadoop.util.Tool;
import org.apache.hadoop.util.ToolRunner;

/**
 * This is a simple inverted index builder created based on 
 * the "standard" WordCount.java example. 
 *
 * To run: hadoop jar simir.jar InvertedIndex
 *            [-m <i>maps</i>] [-r <i>reduces</i>] <i>in-dir</i> <i>out-dir</i> 
 * All the files in "in-dir" will be indexed
 * The "out-dir" must not already exist (it will be created as a result of running this program.
 * The output will be written into the "out-dir" with a name like "part-00000".  
 */

public class InvertedIndex extends Configured implements Tool {
  
  /**
   * Each line represents a document with the first string being the document ID and the rest, words in the document
   * The Mapper function counts the words in each line (i.e., each document) and 
   * emit 
   * (<b>word</b>, <b>document ID</b>,<b> count</b>).
   */
  public static class MapClass extends MapReduceBase
    implements Mapper<LongWritable, Text, Text, Text> {
    
    private final static IntWritable one = new IntWritable(1);
    private Text word = new Text();
      private Text did = new Text(); 
    
    public void map(LongWritable key, Text value, 
                    OutputCollector<Text, Text> output, 
                    Reporter reporter) throws IOException {
      String line = value.toString();
      StringTokenizer itr = new StringTokenizer(line);
      String docID ="";
      String term ="";
      HashMap<String, Integer> wordcount = new HashMap<String, Integer>();
      /// Hash table to store and accumulate the counts. 
      if (itr.hasMoreTokens()) {
	  docID=itr.nextToken();
	  while (itr.hasMoreTokens()) {
	      term = itr.nextToken(); // fetch a term in the document
	      if (wordcount.containsKey(term)) { 
		  // we've seen this term before, so the term is already in the hash table and we should increase its count by one
		  //#########################################################//
		  // Add one missing statement here to increase the counter by one
		  // Hint:  wordcount.put(???) 
		  //#########################################################//
		  wordcount.put(term, wordcount.get(term)+1);		  
	      } else { 
		  // this is first time we see this word, set value '1'
		  //#########################################################//
		  // Add one missing statement here to set the counter to 1
		  // Hint: wordcount.put(???) 
		  //#########################################################//
		  wordcount.put(term, 1);
	      } 
	  }
	  for (String s : wordcount.keySet()) {
	      word.set(s); 
	      // how to set the value for "did" appropriately so that the emitted pair "word" and "did" would 
	      // represent what we'd like to pass to the Reducer? 
	      //#########################################################//
	      // Add one missing statement here to set the right value for "did"
	      // Hint:  did.set(???) 
	      //#########################################################//
	      did.set(docID+" "+wordcount.get(s).toString());
	      output.collect(word, did); 
	  } 
      }
    }
  }
  

  /**
   * A reducer class that just emits the concatenation of the input values for each key
   */
  public static class Reduce extends MapReduceBase
    implements Reducer<Text, Text, Text, Text> {
    
      Text s= new Text(); 
    public void reduce(Text key, Iterator<Text> values,
                       OutputCollector<Text, Text> output, 
                       Reporter reporter) throws IOException {
	String sum = "";
	while (values.hasNext()) { // what should we do for each value fecthed? 
	    //#########################################################//
	    // add one line to use "sum" to form a concatenation of all the values
	    // Hint: use "values.next().toString()" to obtain the value
	    // 
	    //#########################################################//
	    sum = sum + values.next().toString() + " ";
	}
	Text t = new Text(); 
	t.set(key); 
	s.set(sum );
	output.collect(t, s);
    }
  }
  
  static int printUsage() {
    System.out.println("InvertedIndex [-m <maps>] [-r <reduces>] <input> <output>");
    ToolRunner.printGenericCommandUsage(System.out);
    return -1;
  }
  
  /**
   * The main driver for inverted index map/reduce program.
   * Invoke this method to submit the map/reduce job.
   * @throws IOException When there is communication problems with the 
   *                     job tracker.
   */
  public int run(String[] args) throws Exception {
    JobConf conf = new JobConf(getConf(), InvertedIndex.class);
    conf.setJobName("invertedindex");
 
    // the keys are words (strings)
    conf.setOutputKeyClass(Text.class);
    // the values are also strings
    conf.setOutputValueClass(Text.class);
    
    conf.setMapperClass(MapClass.class);        
    conf.setCombinerClass(Reduce.class);
    conf.setReducerClass(Reduce.class);
    
    List<String> other_args = new ArrayList<String>();
    for(int i=0; i < args.length; ++i) {
      try {
        if ("-m".equals(args[i])) {
          conf.setNumMapTasks(Integer.parseInt(args[++i]));
        } else if ("-r".equals(args[i])) {
          conf.setNumReduceTasks(Integer.parseInt(args[++i]));
        } else {
          other_args.add(args[i]);
        }
      } catch (NumberFormatException except) {
        System.out.println("ERROR: Integer expected instead of " + args[i]);
        return printUsage();
      } catch (ArrayIndexOutOfBoundsException except) {
        System.out.println("ERROR: Required parameter missing from " +
                           args[i-1]);
        return printUsage();
      }
    }
    // Make sure there are exactly 2 parameters left.
    if (other_args.size() != 2) {
      System.out.println("ERROR: Wrong number of parameters: " +
                         other_args.size() + " instead of 2.");
      return printUsage();
    }
    FileInputFormat.setInputPaths(conf, other_args.get(0));
    FileOutputFormat.setOutputPath(conf, new Path(other_args.get(1)));
        
    JobClient.runJob(conf);
    return 0;
  }
  
  
  public static void main(String[] args) throws Exception {
    int res = ToolRunner.run(new Configuration(), new InvertedIndex(), args);
    System.exit(res);
  }

}
