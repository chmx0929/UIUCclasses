#include<stdio.h>  
#include<string.h>  
#include<iostream>  
using namespace std;  
#define MIN(a,b) (a)>(b)?(b):(a)  
const int INF = 0x3f3f3f3f ;  
int N, M ;  
int maze[110][110] ;  
int dis[110][110] ;  
int fa[110][110] ;  
int temp ;  
int res[110] ;  
void solve(int i, int j ,int k){            //记录最小环的路径   
    temp = 0 ;  
    while(j != i){  
        res[temp++] = j  ;  
        j = fa[i][j] ;  
    }  
    res[temp++] = i ;  
    res[temp++] = k ;  
}  
void Floyd(){  
    for(int i=1;i<=N;i++){  
        for(int j=1;j<=N;j++){  
            dis[i][j] = maze[i][j] ;  
        }  
    }  
    int ans = INF ;  
    for(int k=1;k<=N;k++){  
        for(int i=1;i<k;i++){  
            for(int j=i+1;j<k;j++){  
                if(dis[i][j]<INF && maze[i][k]<INF && maze[k][j]<INF && ans>dis[i][j] + maze[i][k] + maze[k][j]){  
                    ans = dis[i][j] + maze[i][k] + maze[k][j] ;  
                    solve(i,j,k);     
                }  
            }  
        }  
        for(int i=1;i<=N;i++){  
            for(int j=1;j<=N;j++){  
                if(dis[i][k]<INF && dis[k][j]<INF && dis[i][j]>dis[i][k] + dis[k][j]){  
                    dis[i][j] = dis[i][k] + dis[k][j] ;  
                    fa[i][j] = fa[k][j] ;  
                    fa[j][i] = fa[k][i] ;  
                }  
            }  
        }     
    }  
    if(ans == INF){  
        printf("No solution.\n");  
    }  
    else{  
        for(int i=0;i<temp;i++){  
            printf("%d%c",res[i],i==temp-1?'\n':' ');  
        }  
    }  
}  
int main(){  
    int a ,b ,c ;  
    while(scanf("%d %d",&N,&M) == 2){  
        for(int i=1;i<=N;i++){  
            for(int j=1;j<=N;j++){  
                if(i == j)  maze[i][j] = 0;   
                else        maze[i][j] = INF ;  
            }  
        }  
        for(int i=1;i<=M;i++){  
            scanf("%d %d %d",&a,&b,&c);  
            if(maze[a][b] > c){  
                maze[a][b] = maze[b][a] = c ;  
                fa[a][b] = a ;              //标记(i,j)最短路径上，距离j最近的那个结点   
                fa[b][a] = b ;    
            }     
        }  
        Floyd() ;  
    }     
    return 0 ;  
}  