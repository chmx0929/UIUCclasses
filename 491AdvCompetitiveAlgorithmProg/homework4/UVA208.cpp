#include <stdio.h>
#include <string.h>

#define MAX_SIZE 21

//#define DEBUG

void trace(int, int, int);
void judge(int);

int route[MAX_SIZE][MAX_SIZE];
int tmproute[MAX_SIZE][MAX_SIZE];
int traced[MAX_SIZE];
int buffer[MAX_SIZE];
int mark[MAX_SIZE];
int route_num;

int main(){
    int destination;
    int tmp_1;
    int tmp_2;
    int i, j;
    int case_num = 1;
    int flag;
#ifdef DEBUG
    FILE *fp;
    fp = fopen("123.txt", "r");
#endif
    while(scanf("%d", &destination) != EOF){
        //initial
        for(i = 0; i < MAX_SIZE; i++){
            for(j = 0; j < MAX_SIZE; j++){
                route[i][j] = 0;
            }
            traced[i] = 0;
            buffer[i] = -1;
	    mark[i] = 0;
        }
        route_num = 0;
        flag = 0;
#ifdef DEBUG
        //read & save
        fscanf(fp, "%d", &destination);
        while(1){
            fscanf(fp, "%d %d", &tmp_1, &tmp_2);
            if(tmp_1 == 0 && tmp_2 == 0)break;
            route[tmp_1-1][tmp_2-1] = 1;
            route[tmp_2-1][tmp_1-1] = 1;
            flag = 1;
        }
#else
        //read & save
        //scanf("%d", &destination);
        while(1){
            flag = 1;
            scanf("%d %d", &tmp_1, &tmp_2);
            if(tmp_1 == 0 && tmp_2 == 0)break;
            route[tmp_1-1][tmp_2-1] = 1;
            route[tmp_2-1][tmp_1-1] = 1;
        }
#endif
        if(flag == 0)break;
        printf("CASE %d:\n", case_num);
	memcpy(tmproute, route, sizeof(route));
        judge(destination);
	trace(destination,1,0);
        printf("There are %d routes from the firestation to streetcorner %d.\n", route_num, destination);
        case_num++;
        //system("pause");
    }
#ifdef DEBUG
    fclose(fp);
#endif
    return 0;
}

void trace(int destination, int from, int deep){
    int i;
    buffer[deep] = from;
    if(from == destination){
        buffer[deep+1] = -1;
        //print out route
        printf("%d", buffer[0]);
        for(i = 1; i < MAX_SIZE; i++){
            if(buffer[i] == -1)break;
            printf(" %d", buffer[i]);
        }
        route_num++;
        printf("\n");
        return;
    }
    traced[from-1] = 1;
    for(i = 0; i < MAX_SIZE; i++){
        if(route[from-1][i]==1 && !traced[i] && mark[i])trace(destination, i+1, deep+1);
    }
    traced[from-1] = 0;
    return;
}

void judge(int n){
	int i;
	mark[n-1] = 1;
	if(n == 1)return;
	for(i = 0; i < MAX_SIZE; i++){
		if(tmproute[n-1][i] && mark[i] == 0){
			tmproute[n-1][i] = 0;
			judge(i+1);
		}
	}
}