# from __future__ import division
import metapy
import math
idx = metapy.index.make_inverted_index('config.toml')
# # Examine number of documents
# idx.num_docs()
# # Number of unique terms in the dataset
# idx.unique_terms()
# # The average document length
# idx.avg_doc_length()
# # The total number of terms
# idx.total_corpus_terms()

class PL2Ranker(metapy.index.RankingFunction):                                            
    """ Create a new ranking function in Python that can be used in MeTA. """                                                                          
    def __init__(self, some_param=0.5):                                             
        self.param = some_param
        # You *must* call the base class constructor here!
        super(PL2Ranker, self).__init__()                                        

    def score_one(self, sd):
        """ You need to override this function to return a score for a single term. For fields available in the score_data sd object, @see https://meta-toolkit.org/doxygen/structmeta_1_1index_1_1score__data.html """
        tfn = sd.doc_term_count * math.log(1.0 + self.param * sd.avg_dl / sd.doc_size, 2)
        lam = sd.num_docs / sd.corpus_term_count
        if (lam < 1) or (tfn <= 0):
            return 0
        else:
            part1 = tfn * math.log(tfn * lam, 2)
            part2 = math.log(math.e ,2) * ((1.0 / lam)-tfn)
            part3 = 0.5 * math.log(2 * math.pi * tfn, 2)
            score = sd.query_term_weight * ((part1 + part2 + part3) / (tfn + 1.0))
            return score


# Build the query object and initialize a ranker
query = metapy.index.Document()
ranker = PL2Ranker()
# To do an IR evaluation, we need to use the queries file and relevance judgements.
ev = metapy.index.IREval('config.toml')
# We will loop over the queries file and add each result to the IREval object ev.
num_results = 10
with open('cranfield-queries.txt') as query_file:
    for query_num, line in enumerate(query_file):
        query.content(line.strip())
        results = ranker.score(idx, query, num_results)                            
        avg_p = ev.avg_p(results, query_num, num_results)
        print("Query {} average precision: {}".format(query_num + 1, avg_p))
print ev.map()