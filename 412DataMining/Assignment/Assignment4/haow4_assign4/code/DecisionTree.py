# -*- coding: UTF-8 -*-
import random
import sys
from collections import Counter
import math

class DecisionTreeClassifier(object):

    def __init__(self, max_features=lambda x: x, max_depth=10, min_samples_split=2):
        self.max_features = max_features
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split


    def fit(self, X, y):
        n_features = len(X[0])
        n_sub_features = int(self.max_features(n_features))
        feature_indices = random.sample(xrange(n_features), n_sub_features)
        
        self.trunk = self.build_tree(X, y, feature_indices, 0)

    def predict(self, X):
        num_samples = len(X)
        y = [ 0 for i in range(num_samples) ]
        for j in xrange(num_samples):
            node = self.trunk

            while isinstance(node, Node):
                if X[j][node.feature_index] <= node.threshold:
                    node = node.branch_true
                else:
                    node = node.branch_false
            y[j] = node

        return y

       
    def build_tree(self, X, y, feature_indices, depth):
        if depth is self.max_depth or len(y) < self.min_samples_split or gini(y) is 0:
            return mode(y)
        feature_index, threshold = find_split(X, y, feature_indices)
        X_true, y_true, X_false, y_false = split(X, y, feature_index, threshold)
        if len(y_true) is 0 or len(y_false) is 0:
            return mode(y)
        
        branch_true = self.build_tree(X_true, y_true, feature_indices, depth + 1)
        branch_false = self.build_tree(X_false, y_false, feature_indices, depth + 1)

        return Node(feature_index, threshold, branch_true, branch_false)


def find_split(X, y, feature_indices):

    #num_features = X.shape[1]
    num_samples = len(X)
    num_features = len(X[0])

    best_gain = 0
    best_feature_index = 0
    best_threshold = 0
    for feature_index in feature_indices:
        values = []
        for i in range( num_samples ):
            values.append( X[i][feature_index] )
        values = sorted(set(values))
        for j in xrange(len(values) - 1):
            threshold = (values[j] + values[j+1])/2
            X_true, y_true, X_false, y_false = split(X, y, feature_index, threshold)
            gain = gini_gain(y, y_true, y_false)

            if gain > best_gain:
                best_gain = gain
                best_feature_index = feature_index
                best_threshold = threshold

    return best_feature_index, best_threshold

def load_data(file_name):
    X = []
    y = []
    with open(file_name, "r") as f:
        for l in f:
            sp = l.strip("\n").split(" ")
            label = int(sp[0])
            y.append(label)
            fea = []
            for i in range(1, len(sp)):
                fea.append( float( sp[i].split(":")[1] ) )
            X.append(fea)
    return X, y

def mode(X):
    d = {}
    for x in X:
        if x not in d:
            d[x] = 0
        d[x] += 1
    res = [ (x, d[x]) for x in d ]
    res = sorted(res, key=lambda x:x[1], reverse=True)
    return res[0][0]

def gini(Y):
    distribution = Counter(Y)
    s = 0.0
    total = len(Y)
    for y, num_y in distribution.items():
        probability_y = (float(num_y)/total)
        s += (probability_y) * math.log(probability_y)
    return -s

def gini_gain(y, y_true, y_false):
    return gini(y) - (gini(y_true)*len(y_true) + gini(y_false)*len(y_false))/len(y)

class Node(object):
    def __init__(self, feature_index, threshold, branch_true, branch_false):
        self.feature_index = feature_index
        self.threshold = threshold
        self.branch_true = branch_true
        self.branch_false = branch_false

def split(X, y, feature_index, threshold):
    X_true = []
    y_true = []
    X_false = []
    y_false = []

    for j in xrange(len(y)):
        if X[j][feature_index] <= threshold:
            X_true.append(X[j])
            y_true.append(y[j])
        else:
            X_false.append(X[j])
            y_false.append(y[j])

    return X_true, y_true, X_false, y_false

if __name__ == "__main__":
    train_file = sys.argv[1]
    test_file = sys.argv[2]
    dt = DecisionTreeClassifier(max_depth=20)
    train_x, train_y = load_data( train_file )
    test_x, test_y = load_data( test_file )
    dt.fit(train_x, train_y)
    preds = dt.predict(test_x)
    # print accuracy
    corr = 0
    test_samples = len(test_x)
    for i in range(test_samples):
        if preds[i] == test_y[i]:
            corr += 1
    # print "acc:", corr / float(test_samples)

    class_num = 0
    class_map = {}
    class_index = 0
    for i in train_y:
        if i not in class_map:
            class_map[i] = class_index
            class_index += 1
            class_num += 1
    for i in preds:
        if i not in class_map:
            class_map[i] = class_index
            class_index += 1
            class_num += 1
    matrix = [ [ 0 for i in range(class_num) ] for j in range( class_num ) ]
    for i in range( len(test_y) ):
        actual = test_y[i]
        pred = preds[i]
        matrix[ class_map[ actual ] ] [ class_map[pred] ] += 1
    for i in matrix:
        print " ".join( [ str(x) for x in i ] )