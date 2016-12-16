from math import log
from itertools import combinations
	
#get D(t)---the number of lines in topic-i ----# of transactions
def getTransaction(num):
	sum_transaction = 0.0
	with open("topic-"+str(num)+".txt",'r') as f:
		for line in f:
			sum_transaction +=1.0
	return sum_transaction

#get f(t,p)
def getFrequence(num):
	allset={}
	with open("patterns/pattern-"+str(num)+".txt",'r') as f:
		for line in f:
			words = line.split()
			allset[tuple(words[1:])] = float(words[0])*getTransaction(num)
	return allset
#get support
def getSupport(num):
	allset={}
	with open("patterns/pattern-"+str(num)+".txt",'r') as f:
		for line in f:
			words = line.split()
			allset[tuple(words[1:])] = float(words[0])
	return allset

#get all D(t,t')
def getUnion(filename1,filename2):
	list_file1 = []
	with open(filename1,'r') as f:
		for line in f:
			words = line.split()
			list_file1.append(tuple(sorted(words)))

	list_file2 = []
	with open(filename2,'r') as f:
		for line in f:
			words = line.split()
			list_file2.append(tuple(sorted(words)))

	return len(list(set(list_file1)|set(list_file2)))

#get f(t'p)
def getPossiblity(item,filename):
	possiblity = 0
	with open(filename,'r') as f:
		for line in f:
			words = line.split()
			if set(item).issubset(set(words)):
				possiblity +=1
	return possiblity

#test whether item in this file
def itemOccur(item,filename):
	with open(filename,'r') as f:
		for line in f:
			words = line.split()
			if set(item).issubset(set(words)):
				return True
	return False

#get purity
def getPurity(num):
	dict_pattern = getFrequence(num)
	dt = getTransaction(num)
	dict_result = dict(dict_pattern)
	for key in dict_pattern:
		sup = {}
		dis = {}
		result =[]
		for x in xrange(0,5):
			if x == num:
				pass
			else:
				if itemOccur(key,"topic-"+str(x)+".txt"):
					sup[x] = getPossiblity(key,"topic-"+str(x)+".txt")
					dis[x] = getUnion("topic-"+str(num)+".txt","topic-"+str(x)+".txt")
				else:
					sup[x] = 0
					dis[x] = getUnion("topic-"+str(num)+".txt","topic-"+str(x)+".txt")

		for y in sup:
			result.append((dict_pattern[key]+sup[y])/dis[y])
		dict_result[key] = log(dict_pattern[key]/dt,2)-log(max(result),2)
	return dict_result

for x in xrange(0,5):
	dict_rank = {}
	output = open("purity/purity-"+str(x)+".txt", "w")
	dict_purity = getPurity(x)
	dict_pattern = getSupport(x)
	for key in dict_purity:
		#Rank by a combination of purity and support, but for each line, we only show the purity in the front
		dict_rank[key] = dict_purity[key]*0.1+dict_pattern[key]*0.9
	sortArray = []
	for key in dict_rank:
		sortArray.append(dict_rank[key])
	sortArray = list(set(sortArray))
	sortArray.sort(reverse=True)
	for i in sortArray:
		for key in dict_rank:
			if dict_rank[key] ==i:
				temp = []
				for j in key: temp.append(j)
				keyStr = ' '.join(temp)
				output.write(str(dict_purity[key])+' '+keyStr+'\n')
	output.close()

	dict_terms = {}
	index_terms = 0
	with open("vocab.txt",'r') as f:
		for term in f:
			dict_terms[index_terms] = term.rstrip('\n')
			index_terms +=1
	output = open("purity/purity-"+str(x)+".phrase", "w")
	with open("purity/purity-"+str(x)+".txt", "r") as f:
		for line in f:
			words = line.split()
			for i in xrange(1,len(words)):
				words[i] = dict_terms[int(words[i])]
			output.write(" ".join(words)+'\n')
	output.close()