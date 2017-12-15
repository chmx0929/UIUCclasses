#include <iostream>
#include <algorithm>
#include <queue>
#include <vector>
using namespace std;

const int MAXN = 1010;
const int INFS = 0x3FFFFFFF;

struct edge {
    int to, cost;
    edge(int _to, int _cost) : to(_to), cost(_cost) {}
};

vector<edge> G[MAXN];
int d[2][MAXN], cnt[2][MAXN];
bool vis[2][MAXN];

struct ST {
    int u, dd, r;
    ST(int _u, int _dd, int _r) : u(_u), dd(_dd), r(_r) {}
    bool operator < (const ST& o) const { return dd > o.dd; }
};

int dijkstra(int s, int t, int n) {
    for (int i = 1; i <= n; i++) {
        d[0][i] = d[1][i] = INFS;
        cnt[0][i] = cnt[1][i] = 0;
        vis[0][i] = vis[1][i] = false;
    }
    priority_queue<ST> Q;
    Q.push(ST(s, 0, 0));
    d[0][s] = 0, cnt[0][s] = 1;
    while (!Q.empty()) {
        ST o = Q.top(); Q.pop();
        int u = o.u, r = o.r;

        if (vis[r][u]) continue;
        else vis[r][u] = true;

        for (int i = 0; i < G[u].size(); i++) {
            edge& e = G[u][i];
            int dis = o.dd + e.cost;
            if (dis < d[0][e.to]) {
                if (d[0][e.to] != INFS) {
                    cnt[1][e.to] = cnt[0][e.to];
                    d[1][e.to] = d[0][e.to];
                    Q.push(ST(e.to, d[1][e.to], 1));
                }
                d[0][e.to] = dis;
                cnt[0][e.to] = cnt[r][u];
                Q.push(ST(e.to, dis, 0));
            }
            else if (dis == d[0][e.to]) {
                cnt[0][e.to] += cnt[r][u];
            } 
            else if (dis < d[1][e.to]) {
                d[1][e.to] = dis;
                cnt[1][e.to] = cnt[r][u];
                Q.push(ST(e.to, dis, 1));
            } 
            else if (dis == d[1][e.to]) {
                cnt[1][e.to] += cnt[r][u];
            }
        }
    }
    int ans = cnt[0][t];
    if (d[0][t] == d[1][t] - 1)
        ans += cnt[1][t];
    return ans;
}

int main() {
    int cases;
    scanf("%d", &cases);
    while (cases--) {
        int n, m;
        scanf("%d%d", &n, &m);
        for (int i = 1; i <= n; i++)
            G[i].clear();
        for (int i = 0; i < m; i++) {
            int u, v, cost;
            scanf("%d%d%d", &u, &v, &cost);
            G[u].push_back(edge(v, cost));
        }
        int s, t;
        scanf("%d%d", &s, &t);
        printf("%d\n", dijkstra(s, t, n));
    }
    return 0;
}