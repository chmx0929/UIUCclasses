
#include <cstdio>  
#include <cstring>  
#include <cstdlib>  
  
using namespace std;  
const int maxn = 1000010, prinum = 99999;  
  
bool nprime[maxn];  
int plist[1500000];  
int lp;  
  
double dfs(int);  
double dp[maxn];  
bool dvis[maxn];  
  
int main()  
{  
    for(int i=2; i<=1001; i++)  
    {  
        if(!nprime[i])  
        {  
            int now = i*2;  
            while(now < maxn)  
            {  
                nprime[now] = 1;  
                now += i;  
            }  
        }  
    }  
    for(int i=2; i<maxn; i++)  
        if(!nprime[i])  
        {  
            lp++;  
            plist[lp] = i;  
        }  
  
    dp[1] = 0;  
    dvis[1] = 1;  
      
    int T;  
    scanf("%d", &T);  
    for(int i=1; i<=T; i++)  
    {  
        int n;  
        scanf("%d", &n);  
        printf("Case %d: %.6lf\n", i, dfs(n));  
    }  
}  
  
double dfs(int now)  
{  
    if(dvis[now]) return dp[now];  
    dvis[now] = 1;  
    int tot = 0, divn = 0;  
    double ans = 0;  
    for(int i=1; i<=lp&&plist[i]<=now; i++)  
    {  
        tot++;  
        if(now%plist[i] == 0)  
        {  
            divn++;  
            ans += dfs(now/plist[i]);  
        }  
    }  
      
    ans = (ans+tot)/divn;  
    dp[now] = ans;  
    return ans;  
}