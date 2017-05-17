all: vec_router ls_router manager_send

vec_router: main.c monitor_neighbors.c monitor_neighbors.h
	gcc -pthread -o vec_router main.c monitor_neighbors.c

ls_router: main.c monitor_neighbors.c monitor_neighbors.h
	gcc -pthread -o ls_router main.c monitor_neighbors.c

manager_send: manager_send.c
	gcc -o manager_send manager_send.c

.PHONY: clean
clean:
	rm *.o vec_router ls_router manager_send
