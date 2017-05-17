#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>

int main(int argc, char** argv)
{
	if(argc != 5 || (strcmp(argv[2], "cost") && strcmp(argv[2], "send")))
	{
		fprintf(stderr, "Usage: %s srcNode command [args]\n'command' must be 'send' or 'cost'.\n\n", argv[0]);
		if(argc>2 && !strcmp(argv[2], "cost") && argc != 5)
			fprintf(stderr, "Usage: %s srcNode cost destNode newCost\n\n", argv[0]);
		if(argc>2 && !strcmp(argv[2], "send") && argc != 5)
			fprintf(stderr, "Usage: %s srcNode send destNode \"the message\"\n\n", argv[0]);
		exit(1);
	}

	short int destID = atoi(argv[3]);
	short int no_destID = htons(destID);

	int senderSocket = socket(AF_INET, SOCK_DGRAM, 0);
	if(senderSocket < 0)
		perror("socket()");

	//NOTE: it is normally not necessary to bind() a socket you only plan to sendto() from,
	//      but the virtual network interfaces we're using make things a little weird.
	//      (specifically, there is a specific IP address that we want our packets to use 
	//      as the source, and you have to bind() if you want to control that.
	//      (We're also explicitly choosing source port 8999, but that's not actually important here.)
	struct sockaddr_in srcAddr;
	memset(&srcAddr, 0, sizeof(srcAddr));
	srcAddr.sin_family = AF_INET;
	srcAddr.sin_port = htons(8999);
	inet_pton(AF_INET, "10.0.0.10", &srcAddr.sin_addr);
	if(bind(senderSocket, (struct sockaddr*)&srcAddr, sizeof(srcAddr)) < 0)
		perror("bind()");
	
	struct sockaddr_in destAddr;
	char tempaddr[100];
	sprintf(tempaddr, "10.1.1.%s", argv[1]);
	memset(&destAddr, 0, sizeof(destAddr));
	destAddr.sin_family = AF_INET;
	destAddr.sin_port = htons(7777);
	inet_pton(AF_INET, tempaddr, &destAddr.sin_addr);

	if(!strcmp(argv[2], "cost"))
	{
		int no_newCost = htonl(atoi(argv[4]));

		char sendBuf[4+sizeof(short int)+sizeof(int)];

		strcpy(sendBuf, "cost");
		memcpy(sendBuf+4, &no_destID, sizeof(short int));
		memcpy(sendBuf+4+sizeof(short int), &no_newCost, sizeof(int));

		if(sendto(senderSocket, sendBuf, 4+sizeof(short int)+sizeof(int), 0,
		          (struct sockaddr*)&destAddr, sizeof(destAddr)) < 0)
			perror("sendto()");
	}
	else
	{
		int msgLen = 4+sizeof(short int)+strlen(argv[4]);
		char* sendBuf = malloc(msgLen);

		strcpy(sendBuf, "send");
		memcpy(sendBuf+4, &no_destID, sizeof(short int));
		memcpy(sendBuf+4+sizeof(short int), argv[4], strlen(argv[4]));

		if(sendto(senderSocket, sendBuf, msgLen, 0, (struct sockaddr*)&destAddr, sizeof(destAddr)) < 0)
			perror("sendto()");
		free(sendBuf);
	}
	close(senderSocket);
}
