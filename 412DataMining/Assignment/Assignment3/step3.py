#Step 3
#(1)Assign a Topic to Each Term
#(2)Re-organize the Terms by Topic
topic0 = open("topic-0.txt", "w")
topic1 = open("topic-1.txt", "w")
topic2 = open("topic-2.txt", "w")
topic3 = open("topic-3.txt", "w")
topic4 = open("topic-4.txt", "w")
changeline0 = False
changeline1 = False
changeline2 = False
changeline3 = False
changeline4 = False
with open('result/word-assignments.dat','r') as f:
	for line in f:
		words = line.split()
		iterwords = words[1:]
		for word in iterwords:
				[num_word,num_topic] = word.split(':')
				if num_topic=='00':
					topic0.write(num_word+' ')
					changeline0 = True
				if num_topic=='01':
					topic1.write(num_word+' ')
					changeline1 = True
				if num_topic=='02':
					topic2.write(num_word+' ')
					changeline2 = True
				if num_topic=='03':
					topic3.write(num_word+' ')
					changeline3 = True
				if num_topic=='04':
					topic4.write(num_word+' ')
					changeline4 = True
		if changeline0:
			topic0.write('\n')
			changeline0 = False
		if changeline1:
			topic1.write('\n')
			changeline1 = False
		if changeline2:
			topic2.write('\n')
			changeline2 = False
		if changeline3:
			topic3.write('\n')
			changeline3 = False
		if changeline4:
			topic4.write('\n')
			changeline4 = False
topic0.close()
topic1.close()
topic2.close()
topic3.close()
topic4.close()