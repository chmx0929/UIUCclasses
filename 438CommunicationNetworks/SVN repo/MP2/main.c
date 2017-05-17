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
#include <pthread.h>
#include <sys/time.h>
#include "monitor_neighbors.h"

int globalMyID = 0;
//last time you heard from each node. TODO: you will want to monitor this
//in order to realize when a neighbor has gotten cut off from you.
struct timeval globalLastHeartbeat[NUM_HOP];

//our all-purpose UDP socket, to be bound to 10.1.1.globalMyID, port 7777
int globalSocketUDP;
//pre-filled for sending to 10.1.1.0 - 255, port 7777
struct sockaddr_in globalNodeAddrs[NUM_HOP];

struct Neighbors neighbors[NUM_HOP];
pthread_mutex_t neighbors_lock = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t topo_lock = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t lsp_lock = PTHREAD_MUTEX_INITIALIZER;

struct Neighbors neighbors_last[NUM_HOP];
struct topo topo_distances[NUM_HOP];
int topo_forward[NUM_HOP];
int nextHop[NUM_HOP];

int distances[NUM_HOP][NUM_HOP]; //all members LSP
int sequences[NUM_HOP];
int topochanged = 0;
int temp_cost[NUM_HOP];

FILE *logfile = NULL;
void append_log(char* line){
	fwrite(line, 1, strlen(line), logfile);
	fflush(logfile);
}

int main(int argc, char** argv)
{
	if(argc != 4)
	{
		fprintf(stderr, "Usage: %s mynodeid initialcostsfile logfile\n\n", argv[0]);
		exit(1);
	}
	
	//initialization: get this process's node ID, record what time it is, 
	//and set up our sockaddr_in's for sending to the other nodes.
	globalMyID = atoi(argv[1]);
	int i;
	for(i=0;i<NUM_HOP;i++)
	{
		gettimeofday(&globalLastHeartbeat[i], 0);
		
		char tempaddr[100];
		sprintf(tempaddr, "10.1.1.%d", i);
		memset(&globalNodeAddrs[i], 0, sizeof(globalNodeAddrs[i]));
		globalNodeAddrs[i].sin_family = AF_INET;
		globalNodeAddrs[i].sin_port = htons(7777);
		inet_pton(AF_INET, tempaddr, &globalNodeAddrs[i].sin_addr);
	}
	
	//setting up log file	
	logfile = fopen(argv[3], "w+");
	if(logfile == NULL)
	{
		fprintf(stderr, "cannot open log file: %s!\n", argv[3]);
		exit(1);
	}

	//TODO: read and parse initial costs file. default to cost 1 if no entry for a node. file may be empty.
	for (i = 0; i < NUM_HOP; ++i)
	{
		neighbors[i].neighborID = i;
		neighbors[i].cost = 1; //default cost 1
		neighbors[i].up = 0;
		temp_cost[i] = -1;
	}
	FILE *fp;
	char buff[255];
	int neighbor;
	int cost;
	fp = fopen(argv[2],"r");
	while(fgets(buff, sizeof(buff), fp) != NULL){
		sscanf(buff, "%d %d", &neighbor, &cost);
		neighbors[neighbor].cost = cost; //set cost to neighbor
	}
	fclose(fp);
	neighbors[globalMyID].cost = 0;
	neighbors[globalMyID].up = 1;
	
	memcpy(&neighbors_last, &neighbors, sizeof(neighbors));

	int j;
	for(i=0; i < NUM_HOP; ++i){
		for(j=0; j < NUM_HOP; ++j)
			distances[i][j] = -1;
		sequences[i] = -1;
	}

	//socket() and bind() our socket. We will do all sendto()ing and recvfrom()ing on this one.
	if((globalSocketUDP=socket(AF_INET, SOCK_DGRAM, 0)) < 0)
	{
		perror("socket");
		exit(1);
	}
	char myAddr[100];
	struct sockaddr_in bindAddr;
	sprintf(myAddr, "10.1.1.%d", globalMyID);	
	memset(&bindAddr, 0, sizeof(bindAddr));
	bindAddr.sin_family = AF_INET;
	bindAddr.sin_port = htons(7777);
	inet_pton(AF_INET, myAddr, &bindAddr.sin_addr);
	if(bind(globalSocketUDP, (struct sockaddr*)&bindAddr, sizeof(struct sockaddr_in)) < 0)
	{
		perror("bind");
		close(globalSocketUDP);
		exit(1);
	}
	
	//start threads... feel free to add your own, and to remove the provided ones.
	pthread_t announcerThread;
	pthread_create(&announcerThread, 0, announceToNeighbors, (void*)0);
	
	//good luck, have fun!
	listenForNeighbors();
}
