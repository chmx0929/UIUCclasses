import urllib.request
from urllib.request import Request, urlopen
import re

def search(name, genre, actor):
	url = 'http://www.google.com/search?q='
	names = name.split()
	actor.write(name.replace(" ","_") + ' ')
	for name in names:
		url = ''.join([url, name, '+'])
	for g in genre:
		new_url = ''.join([url, g, '+movies'])
		count = 0
		html = urlopen(Request(new_url, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'})).read().decode('utf-8')
			#soup = BeautifulSoup(html, 'html.parser')
			#print(soup)
			#data1 = soup("a", {"class": "klitem"})
			#data2 = soup("a", {"class": "rl_item"})
		data1 = re.findall('class="klitem"', html)
		data2 = re.findall('class="rl_item"', html)
		count += len(data1) + len(data2)
		if g == 'thriller':
			actor.write(str(count))
		else:
			actor.write(str(count) + ' ')
	actor.write('\n')



def main(start_url, genre, actor):
	html = urllib.request.urlopen(start_url).read().decode('utf-8')
	data = re.findall('listItem__title list.+?>(.+?)</a>', html)
	for name in data:
		search(name, genre, actor)

start_url = 'http://www.ranker.com/list/best-american-actors-working-today/ranker-film'
genre = ['action', 'adventure', 'animation', 'comedy', 'documentary', 'drama', 'fantasy', 'horror', 'fiction', 'thriller']
actor = open('actor.txt', 'w')
main(start_url, genre, actor)