from itertools import combinations
def generateFrequentPattern(inputName,outputName):
	allset={}
	resultset={}
	sortArray=list()
	sum_transaction = 0.0
	minSupport = 0.01

	#get sum of transactions
	with open(inputName,'r') as f:
		for l in f:
			sum_transaction +=1.0
	#generate all patterns and calculate their frequence
	with open(inputName,'r') as f:
		for line in f:
			words = line.split()
			for i in range(1,len(words)+1):
				current = list(sorted(combinations(words,i)))
				for key in current:
					if tuple(sorted(key)) not in allset:
						allset[tuple(sorted(key))] = 0
					allset[tuple(sorted(key))] +=1.0/sum_transaction
	#find patterns that frequence higher than min support and sort them by frequence
	for key in allset:
		if allset[key]>=minSupport:
			resultset[key]=allset[key]
			sortArray.append(allset[key])
	sortArray = list(set(sortArray))
	sortArray.sort(reverse=True)
	
	dict_terms = {}
	index_terms = 0
	with open("vocab.txt",'r') as f:
		for term in f:
			dict_terms[index_terms] = term.rstrip('\n')
			index_terms +=1
	#output the results to output file
	output = open(outputName+".txt", "w")
	outphrase = open(outputName+".phrase", "w")
	for i in sortArray:
		for key in resultset:
			if resultset[key] ==i:
				temp = []
				for j in key: temp.append(j)
				keyStr = ' '.join(temp)
				output.write(str(resultset[key])+' '+keyStr+'\n')
	output.close()
	for i in sortArray:
		for key in resultset:
			if resultset[key] ==i:
				temp = []
				for j in key: temp.append(dict_terms[int(j)])
				keyStr = ' '.join(temp)
				outphrase.write(str(resultset[key])+' '+keyStr+'\n')
	outphrase.close()

for i in range(0,5):
	generateFrequentPattern("topic-"+str(i)+".txt","patterns/pattern-"+str(i))