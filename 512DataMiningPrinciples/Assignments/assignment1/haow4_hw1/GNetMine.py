import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix

np.set_printoptions(threshold = np.nan)
trainId_author = pd.DataFrame(pd.read_csv('trainId_author.txt', names = ['author']))
testId_author = pd.DataFrame(pd.read_csv('testId_author.txt', names = ['author']))
trainId_paper = pd.DataFrame(pd.read_csv('trainId_paper.txt', names = ['paper']))
testId_paper = pd.DataFrame(pd.read_csv('testId_paper.txt', names = ['paper']))

author_label = pd.DataFrame(pd.read_csv('author_label.txt', names = ['author', 'label'], sep = "	"))
paper_label = pd.DataFrame(pd.read_csv('paper_label.txt', names = ['paper', 'label'], sep = "	"))
conf_label = pd.DataFrame(pd.read_csv('conf_label.txt', names = ['conference', 'label'], sep = "	"))

paper_author_with1 = pd.DataFrame(pd.read_csv('PA.txt', names = ['paper' , 'author', '1'], sep="	"))
paper_author = paper_author_with1.drop(['1'], axis=1)
paper_conference_with1 = pd.DataFrame(pd.read_csv('PC.txt', names = ['paper' , 'conference', '1'], sep="	"))
paper_conference = paper_conference_with1.drop(['1'], axis=1)
paper_term_with1 = pd.DataFrame(pd.read_csv('PT.txt', names = ['paper' , 'term', '1'], sep="	"))
paper_term = paper_term_with1.drop(['1'], axis=1)
author_paper_conference = paper_author.join(paper_conference.set_index('paper'), on='paper')
author_conference = author_paper_conference.drop(['paper'], axis=1)

num_author = author_conference['author'].max()
num_conference = author_conference['conference'].max()
num_paper = paper_author['paper'].max()
num_term = paper_term['term'].max()
num_label = author_label['label'].max()

def generate_zeros(row, column):
	matrix_zeros = np.zeros(shape = (row, column))
	return matrix_zeros

def get_rij(i, j, relation):
	matrix = generate_zeros(i, j)
	r = pd.DataFrame(matrix)
	for index, x, y in relation.itertuples():
		r.set_value(x-1, y-1, r.ix[x-1, y-1]+1)
	return r

def get_yij(i, j, relation):
	matrix = generate_zeros(i, j)
	r = pd.DataFrame(matrix)
	for index, x, y in relation.itertuples():
		r.set_value(x-1, y-1, 1)
	return r

def get_dij(rij):
    sum_row = rij.sum(axis=1)
    sqrt = sum_row ** (0.5)
    sqrt = 1.0 / sqrt
    d = np.zeros((rij.shape[0], rij.shape[0]))
    np.fill_diagonal(d, sqrt)
    return d

def get_sij(rij):
    rji = rij.transpose()
    dij = csr_matrix(get_dij(rij))
    dji = csr_matrix(get_dij(rji))
    rijcsr = csr_matrix(rij)
    res = dij.dot(rijcsr).dot(dji)
    return res.todense()

R_author_conference = get_rij(num_author, num_conference, author_conference)
# print R_author_conference.values
R_paper_conference = get_rij(num_paper, num_conference, paper_conference)
R_paper_author = get_rij(num_paper, num_author, paper_author)
R_paper_term = get_rij(num_paper, num_term, paper_term)

S_ac = get_sij(R_author_conference.values)
S_ca = get_sij(R_author_conference.T.values)
S_pc = get_sij(R_paper_conference.values)
S_cp = get_sij(R_paper_conference.T.values)
S_pt = get_sij(R_paper_term.values)
S_tp = get_sij(R_paper_term.T.values)
S_pa = get_sij(R_paper_author.values)
S_ap = get_sij(R_paper_author.T.values)

train_author = trainId_author.merge(author_label)
train_paper = trainId_paper.merge(paper_label)
Y_a = get_yij(num_author, num_label, train_author)
Y_p = get_yij(num_paper, num_label, train_paper)
Y_c = get_yij(num_conference, num_label, conf_label)
Y_t = pd.DataFrame(np.zeros(shape = (num_term, num_label)))

temp_a = Y_a
temp_p = Y_p
temp_t = Y_t
temp_c = Y_c
lamb = 0.2
alpha = 0.1

for x in xrange(1,6):
	f_a = (lamb * (S_ap.dot(temp_p) + S_ac.dot(temp_c)) + alpha * Y_a) / (2 * lamb + alpha)
	f_p = (lamb * (S_pa.dot(temp_a) + S_pt.dot(temp_t) + S_pc.dot(temp_c)) + alpha * Y_p) / (3 * lamb + alpha)
	f_t = (lamb * S_tp.dot(temp_p) + alpha * Y_t ) / (lamb + alpha)
	f_c = (lamb * (S_cp.dot(temp_p) + S_ca.dot(temp_a)) + alpha * Y_c) / (2 * lamb + alpha)

	temp_a = f_a
	temp_p = f_p
	temp_c = f_c
	temp_t = f_t

result_a = 0
truth_author = testId_author.merge(author_label)
pred_author = (pd.DataFrame(np.take(np.argmax(f_a, axis = 1), testId_author - 1)) + 1).T
for index, author, label in truth_author.itertuples():
	if pred_author.iloc[index][0] == label:
		result_a = result_a + 1
print "Accuracy of author:", result_a/4014.0

result_p = 0
truth_paper = testId_paper.merge(paper_label)
pred_paper = (pd.DataFrame(np.take(np.argmax(f_p, axis = 1), testId_paper - 1)) + 1).T
for index, paper, label in truth_paper.itertuples():
	if pred_paper.iloc[index][0] == label:
		result_p = result_p + 1
print "Accuracy of paper:", result_p/57.0

result_c = 0
truth_conf = conf_label
pred_conf = (pd.DataFrame(np.take(np.argmax(f_c, axis = 1), np.arange(20))) + 1).T
for index, conference, label in truth_conf.itertuples():
	if pred_conf.iloc[index][0] == label:
		result_c = result_c + 1
print "Accuracy of conference:", result_c/20.0