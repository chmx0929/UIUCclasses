import numpy as np
import pandas as pd

def formula(name, d, top): #name: authorID , d: dataframe , top:how many top rank results
	#get numerator
	person_id = name
	person = d.iloc[person_id]
	numerator = 2*person.dot(d.T)
	
	#get denominator
	d_square = d ** 2
	sum_square = d_square.sum(axis = 1)
	person_square = sum_square.iloc[person_id]
	denominator = sum_square + person_square

	#get reuslt
	result = numerator.divide(denominator)
	result_sort = np.argsort(result)
	return (result_sort[(-1-top):-1]).values

def APVPA(name):
	#load data and drop extra column
	data = pd.read_csv('PA.txt', names = ['paper' , 'author', '1'], sep="	")
	paper_author_with1 = pd.DataFrame(data)
	paper_author = paper_author_with1.drop(['1'], axis=1)
	data = pd.read_csv('PC.txt', names = ['paper' , 'conference', '1'], sep="	")
	paper_conference_with1 = pd.DataFrame(data)
	paper_conference = paper_conference_with1.drop(['1'], axis=1)
	
	#join tables to get author-conference
	author_paper_conference = paper_author.join(paper_conference.set_index('paper'), on='paper')
	author_conference = author_paper_conference.drop(['paper'], axis=1)
	num_author = author_conference['author'].max()
	num_conference = author_conference['conference'].max()
	
	#create dataframe where row index is authorID and column is conferenceID
	matirx_zeros = np.zeros(shape = (num_author+1, num_conference+1))
	d = pd.DataFrame(matirx_zeros)

	#assign values in dataframe according to author-conference table
	for index, author, conference in author_conference.itertuples():
		d.set_value(author,conference,d.ix[author,conference]+1)
	return formula(name, d, 5)

def APTPA(name):
	#load data and drop extra column
	data = pd.read_csv('PA.txt', names = ['paper' , 'author', '1'], sep="	")
	paper_author_with1 = pd.DataFrame(data)
	paper_author = paper_author_with1.drop(['1'], axis=1)
	data = pd.read_csv('PT.txt', names = ['paper' , 'term', '1'], sep="	")
	paper_term_with1 = pd.DataFrame(data)
	paper_term = paper_term_with1.drop(['1'], axis=1)
	
	#join tables to get author-term
	author_paper_term = paper_author.join(paper_term.set_index('paper'), on='paper')
	author_term = author_paper_term.drop(['paper'], axis=1)
	num_author = author_term['author'].max()
	num_term = author_term['term'].max()
	
	#create dataframe where row index is authorID and column is termID
	matirx_zeros = np.zeros(shape = (num_author+1,num_term+1))
	d = pd.DataFrame(matirx_zeros)

	#assign values in dataframe according to author-term table
	for index, author, term in author_term.itertuples():
		d.set_value(author,term,d.ix[author,term]+1)

	return formula(name, d, 5)

print "APVPA:", APVPA(7696)
print "APTPA:", APTPA(7696)