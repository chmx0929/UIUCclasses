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

#define MAXDATASIZE 100 // max number of bytes we can get at once 

// get sockaddr, IPv4 or IPv6:
void *get_in_addr(struct sockaddr *sa)
{
	if (sa->sa_family == AF_INET) {
		return &(((struct sockaddr_in*)sa)->sin_addr);
	}

	return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

int main(int argc, char *argv[])
{
	int sockfd, numbytes;  
	char buf[MAXDATASIZE];
	struct addrinfo hints, *servinfo, *p;
	int rv;
	char s[INET6_ADDRSTRLEN];

	char *msg = "HELO\n";
	char *repeat = "RECV\n";
	char *bye = "BYE\n";
	char *netid_part1 = "USERNAME ";
	char *netid_part2 = argv[3];
	char *netid_part3 = "\n";
	char netid[20],temp1[20],temp2[5];
	strcpy(netid,netid_part1);
	strcpy(temp1,netid_part2);
	strcpy(temp2,netid_part3);
	strcat(netid, temp1);
	strcat(netid, temp2);

	int len, bytes_sent;

	if (argc != 4) {
	    fprintf(stderr,"usage: client hostname\n");
	    exit(1);
	}

	memset(&hints, 0, sizeof hints);
	hints.ai_family = AF_UNSPEC;
	hints.ai_socktype = SOCK_STREAM;

	if ((rv = getaddrinfo(argv[1], argv[2], &hints, &servinfo)) != 0) {
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

	// inet_ntop(p->ai_family, get_in_addr((struct sockaddr *)p->ai_addr),
	// 		s, sizeof s);

	freeaddrinfo(servinfo); // all done with this structure

	// HELO -> 100 - OK
	len = strlen(msg);
	bytes_sent = send(sockfd, msg, len, 0);
	if(len != bytes_sent){	// check number of bytes sent
		perror("send");
	    exit(1);
	}
	if ((numbytes = recv(sockfd, buf, MAXDATASIZE-1, 0)) == -1) {
	    perror("recv");
	    exit(1);
	}

	// USERNAME haow4   -> 200 - Username: haow4
	len = strlen(netid);
	bytes_sent = send(sockfd, netid, len, 0);
	if(len != bytes_sent){	// check number of bytes sent
		perror("send");
	    exit(1);
	}
	if ((numbytes = recv(sockfd, buf, MAXDATASIZE-1, 0)) == -1) {
	    perror("recv");
	    exit(1);
	}

	// Repeat RECV
	len = strlen(repeat);
	for(int i = 0; i < 10; i++){
		bytes_sent = send(sockfd, repeat, len, 0);
		if(len != bytes_sent){	// check number of bytes sent
			perror("send");
	    	exit(1);
		}
		if ((numbytes = recv(sockfd, buf, MAXDATASIZE-1, 0)) == -1) {
	    	perror("recv");
	    	exit(1);
		}
		buf[numbytes] = '\0';
		printf("Received: %s", buf+12);
	}

	// Send bye
	len = strlen(bye);
	bytes_sent = send(sockfd, bye, len, 0);
	if(len != bytes_sent){	// check number of bytes sent
		perror("send");
	    exit(1);
	}
	if ((numbytes = recv(sockfd, buf, MAXDATASIZE-1, 0)) == -1) {
	    perror("recv");
	    exit(1);
	}
	buf[numbytes] = '\0';

	close(sockfd);

	return 0;
}