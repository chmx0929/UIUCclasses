/*
** client.c -- a stream socket client demo
*/

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <netdb.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <iostream>
#include <cstring>
#include <fstream>

using namespace std;

#define MAXDATASIZE 1024 // max number of bytes we can get at once 

// get sockaddr, IPv4 or IPv6:
void *get_in_addr(struct sockaddr *sa)
{
	if (sa->sa_family == AF_INET) {
		return &(((struct sockaddr_in*)sa)->sin_addr);
	}

	return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

int client(string arg){
	int sockfd, numbytes;  
	char buf[MAXDATASIZE];
	struct addrinfo hints, *servinfo, *p;
	int rv;
	char s[INET6_ADDRSTRLEN];
	int bytes_sent;
	int len;
	int count = 0;
	string url;
	string host;
	string port = "80";
	string path;
	string msg;
	int loc_port;
	int loc_path;
	for (int i = 0; i < arg.length(); ++i)
	{
		if(arg[i]==':'){
			count++;
		}
	}
	// drop protocal
	url = arg.substr(7);
	if(count==2){
		loc_port = url.find(':');
		loc_path = url.find('/');
		host = url.substr(0,loc_port);
		port = url.substr(loc_port+1,loc_path-loc_port-1);
		if(loc_path!=-1){
			path = url.substr(loc_path);
		}
	}else{
		loc_path = url.find('/');
		host = url.substr(0,loc_path);
		if(loc_path!=-1){
			path = url.substr(loc_path);
		}
	}

	memset(&hints, 0, sizeof hints);
	hints.ai_family = AF_UNSPEC;
	hints.ai_socktype = SOCK_STREAM;

	if ((rv = getaddrinfo(host.c_str(), port.c_str(), &hints, &servinfo)) != 0) {
		fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
		return 1;
	}

	// loop through all the results and connect to the first we can
	for(p = servinfo; p != NULL; p = p->ai_next) {
		if ((sockfd = socket(p->ai_family, p->ai_socktype,
				p->ai_protocol)) == -1) {
			perror("client: socket");
			continue;
		}

		if (connect(sockfd, p->ai_addr, p->ai_addrlen) == -1) {
			close(sockfd);
			perror("client: connect");
			continue;
		}

		break;
	}

	if (p == NULL) {
		fprintf(stderr, "client: failed to connect\n");
		return 2;
	}

	inet_ntop(p->ai_family, get_in_addr((struct sockaddr *)p->ai_addr),
			s, sizeof s);
	printf("client: connecting to %s\n", s);

	freeaddrinfo(servinfo); // all done with this structure

	//send request
	if (path.length() == 0)
	{
		path = "/";
	}
	cout<<"path: "<<path<<endl;
	msg = "GET "+path+" HTTP/1.0\r\nUser-Agent: Wget/1.15 (linux-gnu)\r\nAccept: */*\r\nHost: "+host+":"+port+"\r\nConnection: Keep-Alive\r\n\r\n";
	cout<<"request: "<<endl;
	cout<<msg<<endl;
	len = msg.length();
	bytes_sent = send(sockfd, msg.c_str(), len, 0);
	if(len != bytes_sent){	// check number of bytes sent
		perror("send");
	    exit(1);
	}

	if ((numbytes = recv(sockfd, buf, MAXDATASIZE-1, 0)) == -1) {
	    perror("recv");
	    exit(1);
	}

	if(buf[9]=='3'&&buf[10]=='0'&&buf[11]=='1'){
		string location(buf);
		int index = location.find("Location:");
		string loc = location.substr(index+10); 
		int end = loc.find("\r\n");
		client(location.substr(index+10,end));
		return 0;
	}
	buf[numbytes] = '\0';
	cout<<"response: "<<endl;
	cout<<buf<<endl;
	int ind;
	string resp(buf);
	ind = resp.find("\r\n\r\n");
	ofstream file;
	file.open("output");
	file<<resp.substr(ind+4);

	while(1){
		if ((numbytes = recv(sockfd, buf, MAXDATASIZE-1, 0)) == 0)
		{
			break;
		}
		buf[numbytes] = '\0';
		file<<buf;
	}

	file.close();

	close(sockfd);

	return 0;
}

int main(int argc, char *argv[])
{
	if (argc != 2) {
	    fprintf(stderr,"usage: client hostname\n");
	    exit(1);
	}
	return client(argv[1]);
}

