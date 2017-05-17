/*
** server.c -- a stream socket server demo
*/

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <sys/wait.h>
#include <signal.h>
#include <iostream>
#include <string>
#include <fstream>
using namespace std;


#define BACKLOG 10	 // how many pending connections queue will hold

void sigchld_handler(int s)
{
	while(waitpid(-1, NULL, WNOHANG) > 0);
}

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
	if (argc != 2) {
	    fprintf(stderr,"usage: server port\n");
	    exit(1);
	}
	int sockfd, new_fd;  // listen on sock_fd, new connection on new_fd
	struct addrinfo hints, *servinfo, *p;
	struct sockaddr_storage their_addr; // connector's address information
	socklen_t sin_size;
	struct sigaction sa;
	int yes=1;
	char s[INET6_ADDRSTRLEN];
	int rv;


	memset(&hints, 0, sizeof hints);
	hints.ai_family = AF_UNSPEC;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_flags = AI_PASSIVE; // use my IP

	if ((rv = getaddrinfo(NULL, argv[1], &hints, &servinfo)) != 0) {
		fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
		return 1;
	}

	// loop through all the results and bind to the first we can
	for(p = servinfo; p != NULL; p = p->ai_next) {
		if ((sockfd = socket(p->ai_family, p->ai_socktype,
				p->ai_protocol)) == -1) {
			perror("server: socket");
			continue;
		}

		if (setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &yes,
				sizeof(int)) == -1) {
			perror("setsockopt");
			exit(1);
		}

		if (bind(sockfd, p->ai_addr, p->ai_addrlen) == -1) {
			close(sockfd);
			perror("server: bind");
			continue;
		}

		break;
	}

	if (p == NULL)  {
		fprintf(stderr, "server: failed to bind\n");
		return 2;
	}

	freeaddrinfo(servinfo); // all done with this structure

	if (listen(sockfd, BACKLOG) == -1) {
		perror("listen");
		exit(1);
	}

	sa.sa_handler = sigchld_handler; // reap all dead processes
	sigemptyset(&sa.sa_mask);
	sa.sa_flags = SA_RESTART;
	if (sigaction(SIGCHLD, &sa, NULL) == -1) {
		perror("sigaction");
		exit(1);
	}

	printf("server: waiting for connections...\n");

	while(1) {  // main accept() loop
		sin_size = sizeof their_addr;
		new_fd = accept(sockfd, (struct sockaddr *)&their_addr, &sin_size);
		if (new_fd == -1) {
			perror("accept");
			continue;
		}

		inet_ntop(their_addr.ss_family,
			get_in_addr((struct sockaddr *)&their_addr),
			s, sizeof s);
		printf("server: got connection from %s\n", s);

		if (!fork()) { // this is the child process
			close(sockfd); // child doesn't need the listener
			// start--------------------------------------------------
			int byte_count;
			int index_path = 5;
			int end_path;
			int newline;
			char buf[1000];
			string path;
			string response;
			string firstline;
			string context;
			bool protocal;
			//recieve data --------------------------------------------
			byte_count = recv(new_fd, buf, sizeof buf, 0);
			buf[byte_count] = '\0';
			cout<<"request: "<<endl;
			cout<<buf<<endl;
			string str(buf);
			end_path = str.find("HTTP");
			newline = str.find("\r\n");
			firstline = str.substr(0,newline);
			protocal = (firstline.substr(end_path)=="HTTP/1.0")||(firstline.substr(end_path)=="HTTP/1.1");
			path = str.substr(index_path-1,end_path-index_path);

			if(firstline.substr(0,4)=="GET "&&protocal&&(path.length()>1)&&(path.at(0)=='/')){
				FILE *file;
				char c;
				char buf_send[1000];
				int numbytes = 0;
				path = str.substr(index_path,end_path-index_path-1);
				file = fopen(path.c_str(),"rb");
				if(file){ // file exists
					sprintf(buf_send,"HTTP/1.0 200 OK\r\n\r\n");
					if (send(new_fd, buf_send, strlen(buf_send), 0) == -1){
						perror("send");
					}
					while(1){ //send file
						numbytes = fread(buf_send,1,1000,file);
						if (numbytes <= 0)
						{
							break;
						}else{
							if (send(new_fd, buf_send, numbytes, 0) == -1){
								perror("send");
							}		
						}
					}
					
				}else{ //file not exists
					context = "whoops,file not found!";
					response = "HTTP/1.0 404 Not Found\r\n\r\n"+context;
					if (send(new_fd, response.c_str(), response.length(), 0) == -1){
						perror("send");
					}
				}
				fclose(file);
			}else{
				response = "HTTP/1.0 400 Bad Request\r\n\r\n";
				if (send(new_fd, response.c_str(), response.length(), 0) == -1){
					perror("send");
				}
			}
			cout<<"response: "<<endl;
			cout<<response+context<<endl;

			close(new_fd);
			exit(0);
		}
		close(new_fd);  // parent doesn't need this
	}

	return 0;
}

