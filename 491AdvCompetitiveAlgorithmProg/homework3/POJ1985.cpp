#include<cstdio>  
#include<algorithm>  
#include<cstring>  
#include<queue>  
using namespace std;  
const int maxn=50000+5;  
const int maxm=100000+5;  
  
//有向边  
struct Edge  
{  
    Edge(){}  
    Edge(int to,int cost,int next):to(to),cost(cost),next(next){}  
    int to;   //边尾部  
    int cost; //边距离  
    int next; //指向下条边  
}edges[maxm];  
int cnt=0;    //边总数  
int head[maxn];//头结点  
  
//添加两条有向边  
void AddEdge(int u,int v,int cost)  
{  
    edges[cnt]=Edge(v,cost,head[u]);  
    head[u]=cnt++;  
    edges[cnt]=Edge(u,cost,head[v]);  
    head[v]=cnt++;  
}  
  
//距离  
int dist[maxn];  
  
//BFS返回从s出发能到达的最远点编号  
int BFS(int s)  
{  
    int max_dist=0;  
    int id=s;  
    queue<int> Q;  
    memset(dist,-1,sizeof(dist));  
    dist[s]=0;  
    Q.push(s);  
  
    while(!Q.empty())  
    {  
        int u=Q.front(); Q.pop();  
        if(dist[u]>max_dist)  
            max_dist=dist[id=u];  
        for(int i=head[u]; i!=-1; i=edges[i].next)  
        {  
            Edge &e=edges[i];  
            if(dist[e.to]==-1)  
            {  
                dist[e.to]=dist[u]+e.cost;  
                Q.push(e.to);  
            }  
        }  
    }  
    return id;  
}  
  
int main()  
{  
    int n,m;  
    while(scanf("%d%d",&n,&m)==2)  
    {  
        cnt=0;  
        memset(head,-1,sizeof(head));  
        int u,v,cost;  
        char c;  
        for(int i=1;i<=m;i++)  
        {  
            scanf("%d%d%d %c",&u,&v,&cost,&c);  
            AddEdge(u,v,cost);  
        }  
        printf("%d\n",dist[BFS(BFS(u))]);  
    }  
    return 0;  
}