import numpy as np
import pandas as pd

def formula(name, d): #name: index of actor , d: dataframe
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
	return result.tolist()


def PathSim():
	#load data
	genre = ['action', 'adventure', 'animation', 'comedy', 'documentary', 'drama', 'fantasy', 'horror', 'fiction', 'thriller']
	data = pd.read_csv('actor.txt', names = ['actor', 'action', 'adventure', 'animation', 'comedy', 'documentary', 'drama', 'fantasy', 'horror', 'fiction', 'thriller'], sep=" ")
	matrix = pd.DataFrame(data)
	names = matrix['actor'].tolist() #name
	matrix = matrix.drop('actor',axis =1)
	sum_movies = matrix.sum(axis =1).tolist() #playcount
	gender = 'male' #artist
	# print sum_movies
	# print names
	# print matrix
	# return formula(name, matrix)
	for x in xrange(0,len(names)):
		sim = formula(x, matrix) #match
		node = []
		link = []
		b_dict = dict()
		for y in xrange(0,len(names)):
			a_dict = dict()
			a_dict['match'] = sim[y]
			a_dict['name'] = names[y]
			tyoe =  matrix.iloc[y].tolist().index(max(matrix.iloc[y].tolist()))
			a_dict['artist'] = genre[tyoe]
			a_dict['id'] = names[x]+"_"+names[y]
			a_dict["playcount"] = sum_movies[y]
			node.append(a_dict.copy())
			if sim[y] > 0.9 and x != y:
				c_dict = dict()
				c_dict["source"] = names[x]+"_"+names[x]
				c_dict["target"] = names[x]+"_"+names[y]
				link.append(c_dict.copy())
		b_dict["nodes"] = node
		b_dict["links"] = link
		actor = open(names[x]+'.json', 'w')
		actor.write(str(b_dict).replace("\'","\""))

PathSim()

# print "APVPA:", APVPA(7696)
# print "APTPA:", APTPA(7696)