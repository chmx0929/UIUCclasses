#include "monitor_neighbors.h"

extern int globalMyID;
//last time you heard from each node. TODO: you will want to monitor this
//in order to realize when a neighbor has gotten cut off from you.
extern struct timeval globalLastHeartbeat[NUM_HOP];

//our all-purpose UDP socket, to be bound to 10.1.1.globalMyID, port 7777
extern int globalSocketUDP;
//pre-filled for sending to 10.1.1.0 - 255, port 7777
extern struct sockaddr_in globalNodeAddrs[NUM_HOP];

extern struct Neighbors neighbors[NUM_HOP];
extern pthread_mutex_t neighbors_lock;
extern pthread_mutex_t topo_lock;
extern pthread_mutex_t lsp_lock;

extern struct Neighbors neighbors_last[NUM_HOP];

extern int distances[NUM_HOP][NUM_HOP];
extern int sequences[NUM_HOP];
extern int topochanged;

extern struct topo topo_distances[NUM_HOP];
extern int topo_forward[NUM_HOP];
extern int nextHop[NUM_HOP];
extern int temp_cost[NUM_HOP];

int myseq = 0;
int reTopo = 0;

//Yes, this is terrible. It's also terrible that, in Linux, a socket
//can't receive broadcast packets unless it's bound to INADDR_ANY,
//which we can't do in this assignment.
void hackyBroadcast(const char* buf, int length)
{
	int i;
	for(i=0;i<NUM_HOP;i++)
		if(i != globalMyID) //(although with a real broadcast you would also get the packet yourself)
			sendto(globalSocketUDP, buf, length, 0,
				  (struct sockaddr*)&globalNodeAddrs[i], sizeof(globalNodeAddrs[i]));
}

void checkNeighbors(){
	struct timeval currentTime;
	struct timeval timeDifference;

	gettimeofday(&currentTime, 0);
	int i;
	pthread_mutex_lock(&neighbors_lock);
	for (i = 0; i < NUM_HOP; i++)
	{
		timersub(&currentTime, &globalLastHeartbeat[i], &timeDifference);
		if ((timeDifference.tv_sec * 1000000 + timeDifference.tv_usec) > TIME_OUT){
			neighbors[i].up = 0;
		}
		else{
			neighbors[i].up = 1;
			if(temp_cost[i] != -1){ //get cost by global msg, now this node is up
				neighbors[i].cost = temp_cost[i];
				temp_cost[i] = -1;
			}
		}
	}
	neighbors[globalMyID].up = 1;
	pthread_mutex_unlock(&neighbors_lock);
}

void generateNexthop(){
	int i;
	int j;
	for (i = 0; i < NUM_HOP; ++i)
	{
		j = i;
		if(topo_forward[i] != -1){
			while(topo_forward[j] != j){
				j = topo_forward[j];
			}
			nextHop[i] = j;
		}else{
			nextHop[i] = -1;
		}
	}
}

int moveToConfirmed(){
	int i;
	int smallest = INT_MAX;
	int node = -1;
	for (i = 0; i < NUM_HOP; i++){
		if ((topo_distances[i].cost != -1) && (topo_distances[i].cost < smallest) && (topo_distances[i].confirmed != 1))
		{
			smallest = topo_distances[i].cost;
			node = i;
		}
	}
	if(node == -1){
		return -1;
	}
	topo_distances[node].confirmed = 1;
	return node;
}

void updateTopo(){
	// pthread_mutex_lock(&topo_lock);
	int smallest = INT_MAX;
	int node;
	int i, j;

	for (i = 0; i < NUM_HOP; i++)
	{
		topo_distances[i].cost = distances[globalMyID][i];
		topo_distances[i].confirmed = 0;
	}
	topo_distances[globalMyID].confirmed = 1;
	for (i = 0; i < NUM_HOP; i++)
	{
		if (topo_distances[i].cost != -1)
		{
			topo_forward[i] = i;
		}else{
			topo_forward[i] = -1;
		}	
	}
	topo_forward[globalMyID] = globalMyID;
	
	while(1){
		int finish = 1;
		int node = moveToConfirmed();
		if(node == -1){
			break;
		}
		for (i = 0; i < NUM_HOP; i++)
		{
			if(distances[node][i] > 0){
				if(topo_distances[i].cost == -1){ //current node can reach a new hop
					topo_distances[i].cost = topo_distances[node].cost + distances[node][i];
					topo_forward[i] = node;
				}else{ //they can both reach hop i
					int newcost = topo_distances[node].cost + distances[node][i];
					if((newcost == topo_distances[i].cost) && (node < topo_forward[i])){
						topo_forward[i] = node;
					}
					if(newcost < topo_distances[i].cost){
						topo_distances[i].cost = newcost;
						topo_forward[i] = node;
					}
				}
			}
		}

		for (i = 0; i < NUM_HOP; i++){
			if((topo_forward[i] != -1) && (topo_distances[i].confirmed == 0)){
				finish = 0;
			}
		}
		if(finish){
			break;
		}
	}
	// pthread_mutex_unlock(&topo_lock);
}

int prepareLSP(char * lspbuf){
	char* it = lspbuf;
	
	memcpy(it, "LSP", 3);
	it += 3;

	short int globalMyID_net = htons( (short int)(globalMyID) );
	memcpy(it, &globalMyID_net, sizeof(short int));
	it += sizeof(short int);

	int seqnum_net = htonl(myseq);
	myseq++;
	memcpy(it, &seqnum_net, sizeof(int));
	it += sizeof(int);

	int i;
	for(i=0; i < NUM_HOP; i++){
		if(neighbors_last[i].up == 1){
			short int nodeid_net = (short int)(neighbors_last[i].neighborID);
			nodeid_net = htons(nodeid_net);
			int cost_net = neighbors_last[i].cost;
			cost_net = htonl(cost_net);

			memcpy(it, &nodeid_net, sizeof(short int));
			it += sizeof(short int);
			memcpy(it, &cost_net, sizeof(int));
			it += sizeof(int);
		}
	}
	return (it - lspbuf);
}

//store in lsdb
int storeLSP(char* lspbuf, int size){
	char * it = lspbuf + 3;
	
	short int from;
	memcpy(&from, it, sizeof(short int));
	it += sizeof(short int);
	from = ntohs(from);

	int sequence;
	memcpy(&sequence, it, sizeof(int));
	it += sizeof(int);
	sequence = ntohl(sequence);

	//sequence number of this node is too old!
	if(sequence <= sequences[from])
		return 0;

	sequences[from] = sequence;

	int distance_last[NUM_HOP];
	memcpy(distance_last, distances[from], NUM_HOP*sizeof(int));

	int i;
	for(i=0; i < NUM_HOP; i++)
		distances[from][i] = -1;

	while( it-lspbuf < size ){
		short int to;
		memcpy(&to, it, sizeof(short int));
		it += sizeof(short int);
		to = ntohs(to);

		int cost;
		memcpy(&cost, it, sizeof(int));
		it += sizeof(int);
		cost = ntohl(cost);

		distances[from][to] = cost;
	}

	topochanged = topochanged || memcmp(distance_last, distances[from], NUM_HOP*sizeof(int));

	// debug Dijkstra
	// if(topochanged){
		// pthread_mutex_lock(&topo_lock);
	// 	int j;
	// 	char line[50];
	// 	for(i=0; i < NUM_HOP; i++){
	// 		for (j = 0; j < NUM_HOP; ++j)
	// 		{
	// 			if( distances[i][j] != -1 ){
	// 				sprintf(line, "%d thinks from %d to %d is %d\n", globalMyID, i, j, distances[i][j]);
	// 				append_log(line);
	// 			}
	// 		}
	// 	}
	// 	append_log("goes into updateTopo\n");
		// updateTopo();
	// 	for(i=0; i < NUM_HOP; i++){
	// 		if( neighbors[i].up != 0 ){
	// 			sprintf(line, "%d alive\n", i);
	// 			append_log(line);
	// 		}
	// 	}
	// 	append_log("updateTopo finish, goes into generateNexthop\n");
		// generateNexthop();
	// 	append_log("generateNexthop finish\n");
		// topochanged = 0;
	// 	append_log("--------------------------------------------\n");
	// 	append_log("topo_distances: \n");
	// 	for(i=0; i < NUM_HOP; i++){
	// 		if( topo_distances[i].cost != -1 ){
	// 			sprintf(line, "distance from %d to %d is %d\n", globalMyID, i, topo_distances[i].cost);
	// 			append_log(line);
	// 		}
	// 	}
	// 	for(i=0; i < NUM_HOP; i++){
	// 		if( topo_forward[i] != -1 ){
	// 			sprintf(line, "%d to %d via %d\n", globalMyID, i, topo_forward[i]);
	// 			append_log(line);
	// 		}
	// 	}
	// 	for(i=0; i < NUM_HOP; i++){
	// 		if( nextHop[i] != -1 ){
	// 			sprintf(line, "%d to %d nexthop %d\n", globalMyID, i, nextHop[i]);
	// 			append_log(line);
	// 		}
	// 	}
	// 	append_log("\n\n\n\n");
		// pthread_mutex_unlock(&topo_lock);
	// }

	return 1;
}

void floodLSP(char* lspbuf, int size, int heardFrom){
	int i;
	for(i=0; i < NUM_HOP; i++){
		if(neighbors_last[i].up == 0)
			continue;
		if(i == globalMyID || i == heardFrom) //smed tp all neighbors, excluding myself
			continue;
		sendto(globalSocketUDP, lspbuf, size, 0,
			(struct sockaddr*)&globalNodeAddrs[i], sizeof(globalNodeAddrs[i]));
	}
}

void checkSendLSPs(){
	pthread_mutex_lock(&neighbors_lock);
	int changed = memcmp(neighbors_last, neighbors, sizeof(neighbors));
	if (changed){
		memcpy(neighbors_last, neighbors, sizeof(neighbors));
	}
	pthread_mutex_unlock(&neighbors_lock);

	if(changed || topochanged){
		reTopo = 1;
		char lspbuf[SIZE_REC];
		int size = prepareLSP(lspbuf);
		storeLSP(lspbuf, size);
		floodLSP(lspbuf, size, globalMyID);
		topochanged = 0;
	}
}


void* announceToNeighbors(void* unusedParam)
{
	struct timespec initialSleep;
	initialSleep.tv_sec = 0;
	initialSleep.tv_nsec = 800 * 1000 * 1000; //800 ms
	nanosleep(&initialSleep, 0);

	struct timespec sleepFor;
	sleepFor.tv_sec = 0;
	sleepFor.tv_nsec = 300 * 1000 * 1000; //300 ms

	while(1)
	{

		hackyBroadcast("HEREIAM", 7);

		//check neighbor link alive
		checkNeighbors();
		
		//maybe send LSPs
		checkSendLSPs();

		nanosleep(&sleepFor, 0);
	}
}

void sendMSG(int nexthop, char* msgbuf, int buflen ){
	sendto(globalSocketUDP, msgbuf, buflen, 0, (struct sockaddr*)&globalNodeAddrs[nexthop], sizeof(globalNodeAddrs[nexthop]));
}

void sendMessage(int heardFrom, int destId, char* msgbuf, int buflen){
	if(reTopo){
		pthread_mutex_lock(&topo_lock);
	// printf("%d goes into updateTopo\n", globalMyID);
		updateTopo();
	// printf("%d goes into generateNexthop\n", globalMyID);
		generateNexthop();
		reTopo = 0;
		pthread_mutex_unlock(&topo_lock);
	}
	int nexthop = nextHop[destId];
	char logLine[256];
	if(nexthop == -1){
		sprintf(logLine, "unreachable dest %d\n", destId);
	}else{
		sendMSG(nexthop,msgbuf,buflen );
		msgbuf[buflen] = '\0';
		if(heardFrom == globalMyID){
			sprintf(logLine, "sending packet dest %d nexthop %d message %s\n", destId, nexthop, msgbuf+5);
		}else{
			sprintf(logLine, "forward packet dest %d nexthop %d message %s\n", destId, nexthop, msgbuf+5);
		}
	}	
	append_log(logLine);
}

void recGlobalMsg(int destId, char* message, int msg_size){
	char msgbuf[256];

	memcpy(msgbuf, "MSG", 3);
	short int dest = htons((short int)(destId));
	memcpy(msgbuf+3, &dest, 2);
	memcpy(msgbuf+5, message, msg_size);

	sendMessage(globalMyID, destId, msgbuf, msg_size+5);
}

void listenForNeighbors()
{
	char fromAddr[100];
	struct sockaddr_in theirAddr;
	socklen_t theirAddrLen;
	unsigned char recvBuf[SIZE_REC];

	int bytesRecvd;
	while(1)
	{
		theirAddrLen = sizeof(theirAddr);
		if ((bytesRecvd = recvfrom(globalSocketUDP, recvBuf, SIZE_REC , 0, 
					(struct sockaddr*)&theirAddr, &theirAddrLen)) == -1)
		{
			perror("connectivity listener: recvfrom failed");
			exit(1);
		}
		
		inet_ntop(AF_INET, &theirAddr.sin_addr, fromAddr, 100);
		
		short int heardFrom = -1;
		if(strstr(fromAddr, "10.1.1."))
		{
			heardFrom = atoi(
					strchr(strchr(strchr(fromAddr,'.')+1,'.')+1,'.')+1);
			
			//record that we heard from heardFrom just now.
			gettimeofday(&globalLastHeartbeat[heardFrom], 0);

			//TODO: this node can consider heardFrom to be directly connected to it; do any such logic now.

			if (!strncmp(recvBuf, "HEREIAM", 7)){
				gettimeofday(&globalLastHeartbeat[heardFrom], 0);
			}else if (!strncmp(recvBuf, "LSP", 3)){
				// use LSP
				if(storeLSP(recvBuf, bytesRecvd)==1)
					floodLSP(recvBuf, bytesRecvd, heardFrom);
			}else if (!strncmp(recvBuf, "MSG", 3)){
				// receive message or forward message
				int destId = ntohs(*((short int *)(recvBuf+3)));
				if(destId == globalMyID){
					char logLine[200];
					recvBuf[bytesRecvd] = '\0';
					sprintf(logLine, "receive packet message %s\n", recvBuf+5);
					append_log(logLine);
				}else{
					sendMessage(heardFrom, destId, recvBuf, bytesRecvd);
				}
			}else{
				printf("unknown type message\n");
			}

			//record that we heard from heardFrom just now.
			gettimeofday(&globalLastHeartbeat[heardFrom], 0);
		}
		
		//Is it a packet from the manager? (see mp2 specification for more details)
		//send format: 'send'<4 ASCII bytes>, destID<net order 2 byte signed>, <some ASCII message>
		if(!strncmp(recvBuf, "send", 4))
		{
			//TODO send the requested message to the requested destination node
			// ...
			short int destId = ntohs(*((short int *)(recvBuf+4)));
			recGlobalMsg((int)destId, recvBuf+6, bytesRecvd-6);
		}
		//'cost'<4 ASCII bytes>, destID<net order 2 byte signed> newCost<net order 4 byte signed>
		else if(!strncmp(recvBuf, "cost", 4))
		{
			//TODO record the cost change (remember, the link might currently be down! in that case,
			//this is the new cost you should treat it as having once it comes back up.)
			// ...
			short int neighborID = ntohs(*((short int *)(recvBuf+4)));
			int cost = ntohl(*((int *)(recvBuf+6)));
			if(neighbors[neighborID].up == 1){
				neighbors[neighborID].cost = cost;
			}else{
				temp_cost[neighborID] = cost;
			}
		}
		
		//TODO now check for the various types of packets you use in your own protocol
		//else if(!strncmp(recvBuf, "your other message types", ))
		// ... 
	}
	//(should never reach here)
	close(globalSocketUDP);
}

