# CS438 - spring 2013 MP0
#
# This is a simple example of a makefile, use this for reference when you create your own
#
# NOTE: if you decide to write your solution in C++, you will have to change the compiler 
# in this file. 

CC=/usr/bin/gcc
CC_OPTS=-g3
CC_LIBS=
CC_DEFINES=
CC_INCLUDES=
CC_ARGS=${CC_OPTS} ${CC_LIBS} ${CC_DEFINES} ${CC_INCLUDES}

# clean is not a file
.PHONY=clean

#target "all" depends on all others
all: client server listener talker mp0client

# client C depends on source file client.c, if that changes, make client will 
# rebuild the binary
mp0client: mp0client.c
	@${CC} ${CC_ARGS} -o mp0client mp0client.c

client: client.c
	@${CC} ${CC_ARGS} -o client client.c
	
listener: listener.c
	@${CC} ${CC_ARGS} -o listener listener.c

talker: talker.c
	@${CC} ${CC_ARGS} -o talker talker.c

server: server.c
	@${CC} ${CC_ARGS} -o server server.c
	
clean:
	@rm -f talker server client listener mp0client *.o