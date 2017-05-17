"""
Reads distributions from LDA output.
"""
import sys
import heapq
import metapy
import numpy
class LDAReader:
    def __init__(self, cfg_path, prefix):
        self.f_idx = metapy.index.make_forward_index(cfg_path)
        self.v_size = self.f_idx.unique_terms()
        self._load_term_topic(prefix + '.phi')
        self._load_doc_topic(prefix + '.theta')
    def num_topics(self):
        return len(self.term_topic)
    def num_docs(self):
        return self.f_idx.num_docs()
    def num_terms(self):
        return self.v_size
    def top_terms(self, topic_id, k=20):
        if topic_id > self.num_topics():
            raise Exception("Topic ID={} out of range".format(topic_id))
        top = []
        for term_id in range(len(self.term_topic[topic_id])):
            prob = self.term_topic[topic_id][term_id]
            heapq.heappush(top, (prob, term_id))
            if len(top) > k:
                heapq.heappop(top)
        top = list(map(lambda p: (p[0], self.f_idx.term_text(p[1])), top))
        return sorted(top, reverse=True)
    def topic_dist(self, doc_id):
        if doc_id > len(self.doc_topic):
            raise Exception("doc_id={} out of range".format(doc_id))
        return self.doc_topic[doc_id, ]
    def _load_term_topic(self, path):
        self.term_topic = []
        with open(path) as infile:
            for line in infile:
                tokens = line.strip().split()
                tokens.pop(0) # remove topic_id
                self.term_topic.append(numpy.zeros(self.v_size))
                for token in tokens:
                    term_id, prob = token.split(':')
                    self.term_topic[-1][int(term_id)] = float(prob)
    def _load_doc_topic(self, path):
        self.doc_topic = numpy.zeros(shape=(self.num_docs(), self.num_topics()))
        with open(path) as infile:
            for doc_id, line in enumerate(infile):
                tokens = line.strip().split()
                tokens.pop(0) # remove doc_id
                for topic_id, token in enumerate(tokens):
                    _, prob = token.split(':')
                    self.doc_topic[doc_id][topic_id] = float(prob)
if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python {} config.toml prefix".format(sys.argv[0]))
        sys.exit(1)
    reader = LDAReader(sys.argv[1], sys.argv[2])
    for topic_id in range(reader.num_topics()):
        print("{} Topic {} {}".format('=' * 10, topic_id, '=' * 10))
        for prob, term in reader.top_terms(topic_id):
            print(" {} {}".format(term, prob))
    for i in range(5):
        print("{} doc_id {} topic distribution {}".format('=' * 10, i, '=' * 10))
        print(reader.topic_dist(i))