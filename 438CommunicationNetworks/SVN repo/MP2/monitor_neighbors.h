#ifndef MONITOR_NEIGHBOR_H
#define MONITOR_NEIGHBOR_H

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
#include <limits.h>
#include <sys/time.h>

#define NUM_HOP 256
#define TIME_OUT 800000
#define SIZE_REC 2000  //256*6+9 = 1545 < 2000

struct Neighbors
{
	int neighborID;
	int cost;
	int up;
};

struct topo
{
	int cost;
	int confirmed;
};

void listenForNeighbors();
void* announceToNeighbors(void* unusedParam);
void* checkLinkDown(void* unusedParam);

#endif