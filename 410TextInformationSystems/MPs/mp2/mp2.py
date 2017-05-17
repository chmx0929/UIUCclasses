import metapy
idx = metapy.index.make_inverted_index('config.toml')

# Build the query object and initialize a ranker
query = metapy.index.Document()
ranker = metapy.index.DirichletPrior(mu=700)
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