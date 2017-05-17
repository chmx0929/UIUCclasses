# CS438 - spring 2013 MP0
#
# This is a simple example of a makefile, use this for reference when you create your own
#
# NOTE: if you decide to write your solution in C++, you will have to change the compiler 
# in this file. 

CC=/usr/bin/g++
CC_OPTS=-g3
CC_LIBS=
CC_DEFINES=
CC_INCLUDES=
CC_ARGS=${CC_OPTS} ${CC_LIBS} ${CC_DEFINES} ${CC_INCLUDES}

# clean is not a file
.PHONY=clean

#target "all" depends on all others
all: http_client http_server

# client C depends on source file client.c, if that changes, make client will 
# rebuild the binary
http_client: http_client.cpp
	@${CC} ${CC_ARGS} -o http_client http_client.cpp

http_server: http_server.cpp
	@${CC} ${CC_ARGS} -o http_server http_server.cpp
	
clean:
	@rm -f http_server http_client *.o