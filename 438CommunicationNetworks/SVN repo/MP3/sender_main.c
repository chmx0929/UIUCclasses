#include <stdio.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <string.h>
#include <netinet/in.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>

 struct sockaddr_in serv;

 int Socket_bind(char* hostname, unsigned short int hostUDPport)
 {
     int s;
     struct timeval timeout={0,10};
     s=socket(AF_INET,SOCK_DGRAM,0);
     bzero(&serv,sizeof(serv));
     serv.sin_family=AF_INET;
     serv.sin_addr.s_addr=inet_addr(hostname);
     serv.sin_port=htons(hostUDPport);

     int Socket_Buf_Size=64*1024;
     setsockopt(s,SOL_SOCKET,SO_RCVBUF,(const char*)&Socket_Buf_Size,sizeof(int));
     setsockopt(s,SOL_SOCKET,SO_SNDBUF,(const char*)&Socket_Buf_Size,sizeof(int));
     setsockopt(s,SOL_SOCKET,SO_RCVTIMEO,(char*)&timeout,sizeof(struct timeval));
     return(s);
 }

 void Socket_Close(int s)
 {
    close(s);
 }

 int Message_Send(int s,int num,char* Msg,int SendLength)
 {
     int sed_num=htonl(num);
     //struct sockaddr_in client;
     char Write_Buff[65541];
     memcpy(Write_Buff,&sed_num,4);
     memcpy(Write_Buff+4,Msg,SendLength);
     int addr_len=sizeof(serv);
     //printf("send %d\n",num);
     return(sendto(s,Write_Buff,SendLength+4,0,(struct sockaddr *)&serv,addr_len));
 }

 int Message_Get_ACK(int s)
 {
     int ans;
     int ret;
     //struct sockaddr_in client;
     char Read_Buff[65536];
     int addr_len=sizeof(serv);
     ans=recvfrom(s,Read_Buff,4,0,(struct sockaddr *)&serv,&addr_len);
     if(ans!=-1)
     {
         memcpy(&ret,Read_Buff,4);
    // printf("get %d\n",ntohl(ret));
         return(ntohl(ret));
     }
     else
     {
         return(-1);
     }
 }

void reliablyTransfer(char* hostname, unsigned short int hostUDPport, char* filename, unsigned long long int bytesToTransfer)
{
    int number;
    int s;
    int i,j;
    unsigned char** text;                     // msg need to be send
    int* length;
    int Msg_length = 1468;             // length of each frame
    int set_timeout = 40;              // init RTT : ms
    int n = 8;                           // n
    int temp = 40;                            // current RTT
    int ACK;
    struct timeval t1,t2;
    int tmp_tail;
	
    FILE *infile;
    infile=fopen(filename,"rb");
    int Max_n;
	int Size_n=1000;
//printf("[%s] %d",hostname,hostUDPport);
    s=Socket_bind(hostname,hostUDPport);
    Max_n=(bytesToTransfer+Msg_length-1)/Msg_length;
    text=malloc(sizeof(char*)*Size_n);
    length=malloc(sizeof(int)*Size_n);

	tmp_tail=0;  
    for(i=0;i<Size_n;i++)
    {
	    text[i]=NULL;
	}	
    for(i=0;i<n;i++)
    {
        if(i>=Max_n)
        {
            break;
        }
        text[i]=malloc(sizeof(unsigned char)*(Msg_length+1));
        fread(text[i],sizeof(unsigned char),Msg_length,infile);
		tmp_tail++;
        if(i<Max_n-1)
        {
            length[i]=Msg_length;
        }
        else
        {
            length[i]=bytesToTransfer%Msg_length;
        }
    }
    if(s!=-1)
    {
        number=0;
       // printf("Wait Client! %d\n",Max_n);
        do{
            Message_Send(s,Max_n,filename,0);
            number=Message_Get_ACK(s);
        }while(number==-1);  // wait client ready
        number=0;
        //printf("Client Ready!\n");
        while(number<Max_n)
        {
             for(i=number;i<number+n;i++)
             {
                 if(i>=Max_n)
                 {
                     break;
                 }
                 int ret_tmp;
                 ret_tmp=Message_Send(s,i,text[i%Size_n],length[i%Size_n]);
                 //printf("%d\n",ret_tmp);
             }
             gettimeofday(&t1,0);
             gettimeofday(&t2,0);
             while(number<i && ((t2.tv_sec-t1.tv_sec)*1000+((t2.tv_usec - t1.tv_usec)/1000))<set_timeout)
             {
                 ACK=Message_Get_ACK(s);
                 if(number<ACK)
                 {
                     number=ACK;
                     gettimeofday(&t2,0);
                     temp = 2*((t2.tv_sec-t1.tv_sec)*1000+((t2.tv_usec - t1.tv_usec)/1000));
                 }
                 gettimeofday(&t2,0);
             }
			 if(number<i)
			 {
			     n=n/2;
				 if(n<2)
				 {
				     n=2;
				 }
			 }
			 else
			 {
			     n=n*2;
				 if(n>Size_n)
				 {
				     n=Size_n;
				 }
			 }
			 for(j=number;j<number+n;j++)
			 {
				 if(j>=Max_n)
				 {
					break;
				 }
				 if(j>=tmp_tail)
				 {
				    if(text[j%Size_n]!=NULL)
					{
                        free(text[j%Size_n]); 					
					}
					tmp_tail++;
					text[j%Size_n]=malloc(sizeof(unsigned char)*(Msg_length+1));
					fread(text[j%Size_n],sizeof(unsigned char),Msg_length,infile);
					length[j%Size_n]=strlen(text[j%Size_n]);
					if(j<Max_n-1)
					{
						length[j%Size_n]=Msg_length;
					}
					else
					{
						length[j%Size_n]=bytesToTransfer%Msg_length;
					}
				 }
			 }
             if (temp<20)
             {
             	temp = 40;
             	set_timeout = 40;
             }else{
             	set_timeout = temp;
             }
        }
        fclose(infile);
    }
}

int main(int argc, char** argv)
{
	unsigned short int udpPort;
	unsigned long long int numBytes;

	if(argc != 5)
	{
		fprintf(stderr, "usage: %s receiver_hostname receiver_port filename_to_xfer bytes_to_xfer\n\n", argv[0]);
		exit(1);
	}
	udpPort = (unsigned short int)atoi(argv[2]);
	numBytes = atoll(argv[4]);

	reliablyTransfer(argv[1], udpPort, argv[3], numBytes);
}
