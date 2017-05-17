"""
Runs LDA to create doc-topic and topic-word distributions.
"""
import sys
import metapy
if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python {} config.toml prefix n_topics".format(sys.argv[0]))
        sys.exit(1)
    lda = metapy.topics.run_gibbs(sys.argv[1], sys.argv[2], int(sys.argv[3]), alpha=0.1, beta=0.1, num_iters=500)