from itertools import combinations

if __name__ == "__main__":
	alphabet = "abcdefghijklmnopqrstuvwxyz"
	words = list(alphabet)
	index = 1
	library = {}

	for i in range(1,6):
		current = list(sorted(combinations(words,i)))
		for element in current:
			library["".join(element)] = index
			index = index+1

	data = input()
	while data != "":
		if data in library.keys():
			print (library[data])
		else:
			print (0)
		data = input()