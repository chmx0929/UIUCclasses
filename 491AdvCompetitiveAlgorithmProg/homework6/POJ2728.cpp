#include <cstdio>
#include <cmath>
#include <algorithm>

const int MAXN = 1000;
const int CACHE_FIX = 3;
const float EPS = 1e-4;

struct Node;
struct UndirectedEdge;

struct Node {
    int id;
    int x, y, z;
    bool inTree;
    UndirectedEdge *e;
} nodes[MAXN];

struct UndirectedEdge {
    float benifit, cost;
    float w;

    UndirectedEdge(float benifit, float cost) : benifit(benifit), cost(cost) {}
    UndirectedEdge() {}
} edges[MAXN + CACHE_FIX][MAXN];

int n;

inline float prim() {
    nodes[0].inTree = true;
    for (int i = 1; i < n; i++) nodes[i].e = &edges[0][i], nodes[i].inTree = false;

    float ans = 0;
    for (int i = 0; i < n - 1; i++) {
        Node *v = NULL;
        for (int i = 0; i < n; i++) if (!nodes[i].inTree && (v == NULL || nodes[i].e->w < v->e->w)) v = &nodes[i];

        ans += v->e->w;
        v->e = NULL;
        v->inTree = true;

        for (int i = 0; i < n; i++) if (!nodes[i].inTree && nodes[i].e->w > edges[i][v->id].w) nodes[i].e = &edges[i][v->id];
    }

    return ans;
}

inline float test(float p) {
    for (register int i = 0; i < n; i++) {
        for (register int j = i + 1; j < n; j++) {
            edges[j][i].w = edges[i][j].w = edges[i][j].cost - edges[i][j].benifit * p;
        }
    }

    float result = prim();
    //printf("test(%lf) = %lf\n", p, result);
    return result;
}

inline float solve(float sum) {
    register float l = 0, r = sum;
    //while (r - l > EPS) {
    for (int i = 0; i < 22; i++) {
        float mid = l + (r - l) / 2;
        if (test(mid) > 0) l = mid;
        else r = mid;
    }

    return l + (r - l) / 2;
}

inline float sqr(float x) {
    return x * x;
}

inline float distance(float x1, float x2, float y1, float y2) {
    return sqrt(sqr(x1 - x2) + sqr(y1 - y2));
}

int main() {
    while (scanf("%d", &n) != EOF && n != 0) {
        for (int i = 0; i < n; i++) nodes[i].id = i;

        for (int i = 0; i < n; i++) scanf("%d %d %d", &nodes[i].x, &nodes[i].y, &nodes[i].z);

        float sum = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                edges[j][i] = edges[i][j] = UndirectedEdge(distance(nodes[i].x, nodes[j].x, nodes[i].y, nodes[j].y), abs(nodes[i].z - nodes[j].z));
                sum += edges[i][j].benifit;
            }
        }

        float ans = solve(100);
        printf("%.3f\n", ans);
    }

    return 0;
}