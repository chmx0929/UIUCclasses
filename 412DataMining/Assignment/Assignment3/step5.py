def getMaxPettern(inputName,outputName):
	set_all=[]
	with open(inputName, "r") as f:
		for line in f:
			current_set =[]
			words = line.split()
			for i in xrange(1,len(words)):
				current_set.append(words[i])
			set_all.append(set(current_set))

	temp_set = list(set_all)
	set_result = list(set_all)
	for x in set_all:
		temp_set.remove(x)
		for y in temp_set:
			if x.issubset(y):
				if x in set_result:
					set_result.remove(x)
		temp_set.append(x)
	output = open(outputName+".txt", "w")
	with open(inputName, "r") as f:
		for line in f:
			current_set =[]
			words = line.split()
			for i in xrange(1,len(words)):
				current_set.append(words[i])
			if set(current_set) in set_result:
				output.write(line)
	output.close()

	dict_terms = {}
	index_terms = 0
	with open("vocab.txt",'r') as f:
		for term in f:
			dict_terms[index_terms] = term.rstrip('\n')
			index_terms +=1
	output = open(outputName+".phrase", "w")
	with open(outputName+".txt", "r") as f:
		for line in f:
			words = line.split()
			for i in xrange(1,len(words)):
				words[i] = dict_terms[int(words[i])]
			output.write(" ".join(words)+'\n')
	output.close()

def getClosedPettern(inputName,outputName):
	set_all=[]
	dict_all={}
	with open(inputName, "r") as f:
		for line in f:
			current_set =[]
			words = line.split()
			for i in xrange(1,len(words)):
				current_set.append(words[i])
			set_all.append(set(sorted(current_set)))
			dict_all[tuple(sorted(current_set))] = words[0]
			
	temp_set = list(set_all)
	set_result = list(set_all)
	for x in set_all:
		temp_set.remove(x)
		for y in temp_set:
			if (x.issubset(y)) and (dict_all[tuple(sorted(list(x)))]==dict_all[tuple(sorted(list(y)))]):
				if x in set_result:
					set_result.remove(x)
		temp_set.append(x)
	output = open(outputName+".txt", "w")
	with open(inputName, "r") as f:
		for line in f:
			current_set =[]
			words = line.split()
			for i in xrange(1,len(words)):
				current_set.append(words[i])
			if set(current_set) in set_result:
				output.write(line)
	output.close()

	dict_terms = {}
	index_terms = 0
	with open("vocab.txt",'r') as f:
		for term in f:
			dict_terms[index_terms] = term.rstrip('\n')
			index_terms +=1
	output = open(outputName+".phrase", "w")
	with open(outputName+".txt", "r") as f:
		for line in f:
			words = line.split()
			for i in xrange(1,len(words)):
				words[i] = dict_terms[int(words[i])]
			output.write(" ".join(words)+'\n')
	output.close()

for i in range(0,5):
	getMaxPettern("patterns/pattern-"+str(i)+".txt","max/max-"+str(i))
	getClosedPettern("patterns/pattern-"+str(i)+".txt","closed/closed-"+str(i))