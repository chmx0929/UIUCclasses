 #include <stdio.h>
 #include <stdlib.h>
 #include <sys/socket.h>
 #include <sys/time.h>
 #include <sys/types.h>
 #include <string.h>
 #include <netinet/in.h>
 #include <unistd.h>

 int Max_n;
 struct sockaddr_in serv;

 int Socket_bind(unsigned short int myUDPport)
 {
     int s;
     struct sockaddr_in serv;
     struct timeval timeout={0,10};
     s=socket(AF_INET,SOCK_DGRAM,0);
     bzero(&serv,sizeof(serv));
     serv.sin_family=AF_INET;
     serv.sin_addr.s_addr = htonl(INADDR_ANY);
     serv.sin_port=htons(myUDPport);
     int Socket_Buf_Size=64*1024;
     setsockopt(s,SOL_SOCKET,SO_RCVBUF,(const char*)&Socket_Buf_Size,sizeof(int));
     setsockopt(s,SOL_SOCKET,SO_SNDBUF,(const char*)&Socket_Buf_Size,sizeof(int));
     setsockopt(s,SOL_SOCKET,SO_RCVTIMEO,(char*)&timeout,sizeof(struct timeval));
     int addr_len=sizeof(serv);
     if(bind(s,(struct sockaddr*)&serv,sizeof(serv))==-1)
     {
        return(-1);
     }
     else
     {
         return(s);
     }
 }

 void Message_Send_ACK(int s,int number)
 {
     int sed_num=htonl(number);
     int ans;
     char Write_Buff[100];
     memcpy(Write_Buff,&sed_num,4);
       // printf("Send:%d\n",number);
     ans=sendto(s,Write_Buff,4,0,(struct sockaddr *)&serv,sizeof(serv));
       // printf(":%d\n",ans);
 }

 int Message_Get(int s,int Msg_length,int number,char* Read_Buff,int* len)
 {
     int ans;
     int ret;
     int addr_len=sizeof(serv);
     ans=recvfrom(s,Read_Buff,4+Msg_length,0,(struct sockaddr *)&serv,&addr_len);
     if(ans==-1)
     {
         return(-1);
     }
     else
     {
         if(number!=Max_n-1)
         {
             if(ans!=Msg_length+4)
             {
                 //lost_byte+=Msg_length-ans;
                 return(-1);
             }
         }
         memcpy(&ret,Read_Buff,4);
        // printf("GET:%d\n",ntohl(ret));
         *len=ans-4;
         return(ntohl(ret));
     }
 }

void reliablyReceive(unsigned short int myUDPport, char* destinationFile)
{
     int number=0;
     int s=Socket_bind(myUDPport);
     int ret;
     int Msg_length=1468;       // length of each frame
     char Read_Buff[65541];
     int len;
     FILE* outfile;
    // printf("Start\n");
     Max_n=-1;
     while(Max_n==-1)
     {
         //Message_Send_ACK(s,number);
         Max_n=Message_Get(s,0,number,Read_Buff,&len);
     }
     Message_Send_ACK(s,number);
     outfile = fopen(destinationFile, "wb" );
     while(number<Max_n)
     {
         //printf("%d\n",number);
         if((ret=Message_Get(s,Msg_length,number,Read_Buff,&len))==number)
         {
             fwrite( Read_Buff+4, sizeof( unsigned char ), len, outfile );
             number++;
         }
        /* else
         {
             lost_packet++;
             lost_byte+=Msg_length;
         }*/
         Message_Send_ACK(s,number);
     }
     close(s);
}

int main(int argc, char** argv)
{
	unsigned short int udpPort;

	if(argc != 3)
	{
		fprintf(stderr, "usage: %s UDP_port filename_to_write\n\n", argv[0]);
		exit(1);
	}

	udpPort = (unsigned short int)atoi(argv[1]);

	reliablyReceive(udpPort, argv[2]);
}
