dict_frequence = {}
#Read file into dictionary
with open('paper.txt','r') as f:
	for line in f:
		[num,words] = line.split('\t')
		for word in words.split():
			if dict_frequence.has_key(word):
				dict_frequence[word] = dict_frequence[word] + 1
			else:
				dict_frequence[word] = 1
#Step 2
index = 0
dict_index = {}
index_dict = {}
#(1)
#Save words into vocab.txt
output = open("vocab.txt", "w")
for word in dict_frequence.keys():
	dict_index[word] = index
	index_dict[index] = word
	output.write(word+'\n')
	index = index + 1
output.close()

#(2)
#Save words and numbers into title.txt
output_title = open("title.txt", "w")
with open('paper.txt','r') as f:
	for line in f:
		[num,words] = line.split('\t')
		dict_times={}
		for word in words.split():
			if word in dict_times:
				dict_times[word] +=1
			else:
				dict_times[word] = 1
		output_title.write(str(len(dict_times.keys())))
		for key in dict_times:
			output_title.write(' '+str(dict_index.get(key))+':'+str(dict_times.get(key)))
		output_title.write('\n')
output_title.close()