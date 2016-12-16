# -*- coding: UTF-8 -*-
import sys
import math
from DecisionTree import DecisionTreeClassifier

def mymode(X, n_tree, n_samples):
    predictions = []
    for i in range(n_samples):
        d = {}
        for j in range(n_tree):
            x = X[j][i]
            if x not in d:
                d[x] = 0
            d[x] += 1
        res = [ (x, d[x]) for x in d ]
        res = sorted(res, key=lambda x:x[1], reverse=True)
        predictions.append( res[0][0] )
    return predictions 

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
    return (X), (y)

def shuffle_in_unison(a, b):
    import random
    random.seed(100)
    all = [ (a[i], b[i]) for i in range(len(a)) ]
    random.shuffle(all)
    na = [ x[0] for x in all ]
    nb = [ x[1] for x in all ]
    return na, nb

def gini(Y):
    distribution = Counter(Y)
    s = 0.0
    total = len(Y)
    for y, num_y in distribution.items():
        probability_y = float (num_y/total)
        s += (probability_y)*math.log(probability_y)
    return -s

def gini_gain(y, y_true, y_false):
    return gini(y) - (gini(y_true)*len(y_true) + gini(y_false)*len(y_false))/len(y)

class RandomForestClassifier(object):
    def __init__(self, n_estimators=32, max_features=lambda x: x, max_depth=20,
        min_samples_split=2, bootstrap=0.632):
        self.n_estimators = n_estimators
        self.max_features = max_features
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.bootstrap = bootstrap
        self.forest = []

    def fit(self, X, y):
        self.forest = []
        n_samples = len(y)
        n_sub_samples = int(round(n_samples*self.bootstrap))
        for i in xrange(self.n_estimators):
            X, y = shuffle_in_unison(X, y)
            X_subset = [ X[i] for i in range(n_sub_samples) ]
            y_subset = [ y[i] for i in range(n_sub_samples) ]

            tree = DecisionTreeClassifier(self.max_features, self.max_depth,
                                            self.min_samples_split)
            tree.fit(X_subset, y_subset)
            self.forest.append(tree)

    def predict(self, X):
        n_samples = len(X)
        n_trees = len(self.forest)
        predictions = [ [ 0 for i in range(n_samples) ] for j in range(n_trees) ]
        for i in xrange(n_trees):
            predictions[i] = self.forest[i].predict(X)
        return mymode(predictions, n_trees, n_samples)

    def score(self, X, y):
        y_predict = self.predict(X)
        n_samples = len(y)
        correct = 0
        for i in xrange(n_samples):
            if y_predict[i] == y[i]:
                correct = correct + 1
        accuracy = correct/float(n_samples)
        return accuracy
    
if __name__ == "__main__":
    train_file = sys.argv[1]
    test_file = sys.argv[2]
    train_x, train_y = load_data( train_file )
    test_x, test_y = load_data(test_file)
    # print "Load data finish..."
    rf = RandomForestClassifier(n_estimators=32, max_depth=20)
    rf.fit(train_x, train_y)
    # print "test acc:", rf.score(test_x, test_y) 
    preds = rf.predict(test_x)

    # print "confusion matrix:"
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