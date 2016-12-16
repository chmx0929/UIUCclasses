var heights = [];
//-------------------------------------------------------------------------
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray,normalArray){
    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
           vertexArray.push(0);
           
           normalArray.push(0);
           normalArray.push(0);
           normalArray.push(1);
       }

    var numT=0;
    for(var i=0;i<n;i++)
       for(var j=0;j<n;j++)
       {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           numT+=2;
       }
    
    //update vertexArray z value and normalArray
    heightMapCreate(n,vertexArray, faceArray, normalArray);
    return numT;
}

//-------------------------------------------------------------------------
function generateLinesFromIndexedTriangles(faceArray,lineArray){
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

//-------------------------------------------------------------------------
//Creating height
function heightMapCreate( n,vertexArray, faceArray, normalArray){
    var maxIndex = n;
    for(var i=0; i<=n; i++){
        var columns = [];
        for(var j=0; j<=n; j++)
            columns[j] = 0;
        heights[i] = columns;
    }
    //Initialize 4 corners to some heights
    var temp = Math.random()*0.06;
    heights[0][0]= temp;
    var temp = Math.random()*0.06;
    heights[maxIndex][0]= temp;
    var temp = Math.random()*0.06;
    heights[0][maxIndex]= temp;
    var temp = Math.random()*0.06;
    heights[maxIndex][maxIndex]= temp;
    //For each square in the array, midpoint height = avg four corner points + random value
    square(0,0,maxIndex, heights);
    //For each diamond in the array, midpoint height = avg four corner points + random value
    diamond(0,0, maxIndex, heights, n);
    //Computing Normals
    normal(vertexArray, heights, faceArray, n,normalArray);
}

//-------------------------------------------------------------------------
//For each square in the array, midpoint height = avg four corner points + random value
function square(startX, startY, range, heights){
    if(range > 1){
        var topleft = heights[startX][startY];
        var botleft = heights[startX+range][startY];
        var topright = heights[startX][startY+range];
        var botright = heights[startX+range][startY+range];
        //Midpoint height = avg four corner points + random value
        heights[startX+range/2][startY+range/2]= (topleft+botleft+topright+botright)/4 + Math.random()*0.06;
        square(startX, startY, range/2, heights);
        square(startX+range/2, startY, range/2, heights);
        square(startX, startY+range/2, range/2, heights);
        square(startX/2, startY+range/2, range/2, heights);
    }
}

//-------------------------------------------------------------------------
//For each diamond in the array, midpoint height = avg four corner points + random value
function diamond(startX, startY, range, heights, size){
    if(range > 1){
        var topleft = heights[startX][startY];
        var botleft = heights[startX+range][startY];
        var topright = heights[startX][startY+range];
        var botright = heights[startX+range][startY+range];
        var mid =  heights[startX+range/2][startY+range/2];
        //top
        if(startY == 0)
            heights[startX+range/2][startY] = (topleft+topright+mid)/3+Math.random()*0.06;
        else{ 
            heights[startX+range/2][startY] = (topleft+topright+mid+heights[startX+range/2][startY-range/2])/4+Math.random()*0.06;
        }
        //left
        if(startX == 0){
            heights[startX][startY+range/2] = (topleft+botleft+mid)/3+Math.random()*0.06;   
        }
        else{
            heights[startX][startY+range/2] = (topleft+botleft+mid+heights[startX-range/2][startY+range/2])/4+Math.random()*0.06; 
        }
        //bottom
        if(startY+range == size){
            heights[startX+range/2][startY+range] = (botleft+botright+mid)/3+Math.random()*0.06;
        }
        else{
            heights[startX+range/2][startY+range] = (botleft+botright+mid+heights[startX+range/2][startY+range*2])/4+Math.random()*0.06;   
        }
        //right
        if(startX+range == size){
            heights[startX+range][startY+range/2] = (topright+botright+mid)/3+Math.random()*0.06;   
        }
        else{
            heights[startX+range][startY+range/2] = (topright+botright+mid+heights[startX+range*2][startY+range/2])/4+Math.random()*0.06;   
        }
        
        diamond(startX, startY, range/2, heights, size);
        diamond(startX+range/2, startY, range/2, heights, size);
        diamond(startX, startY+range/2, range/2, heights, size);
        diamond(startX+range/2, startY+range/2, range/2, heights, size);
    }
}

//-------------------------------------------------------------------------
//set up normal value for vertex
function normal(vertexArray, heights, faceArray, n, normalArray){
    var index=0;
    //Passing values from heights array to vertex array
    for(var i=0; i<=n; i++){
        for(var j=0; j<=n; j++){
            vertexArray[index+2] = heights[i][j];
            index=index+3;
        }
    }
    //create triangle normal
    var triangleNormal = [];
    var i =0;
    while(i+3<=faceArray.length){
        //index for three points
        var p1 = faceArray[i];
        var p2 = faceArray[i+1];
        var p3 = faceArray[i+2];
        //vectors in same triangle
        var point1 = vec3.fromValues(vertexArray[p1*3], vertexArray[p1*3+1], vertexArray[p1*3+2]);
        var point2 = vec3.fromValues(vertexArray[p2*3], vertexArray[p2*3+1], vertexArray[p2*3+2]);
        var point3 = vec3.fromValues(vertexArray[p3*3], vertexArray[p3*3+1], vertexArray[p3*3+2]);
        //Compute a normal
        var v1 = vec3.create();
        var v2 = vec3.create();
        var v3 = vec3.create();
        vec3.subtract(v1, point3, point1);
        vec3.subtract(v2, point2, point1);
        vec3.cross(v3, v2,v1);
        vec3.normalize(v3, v3);
        triangleNormal.push(v3);
        i = i+3;
    }
    var j=0;
    while(j+3<=vertexArray.length){
        var normal =vec3.fromValues(0,0,0);
        var numN = 0;
        for(var k=0; k<faceArray.length; k++){
            if(j/3 == faceArray[k]){
                vec3.add(normal, normal, triangleNormal[Math.floor(k/3)]);
                numN++;
            }
            if(numN == 6)
                break;
        }
        vec3.normalize(normal,normal);
        normalArray[j] = normal[0]/numN;
        normalArray[j+1] = normal[1]/numN;
        normalArray[j+2] = normal[2]/numN;
        j = j+3;
    }  
}

//-------------------------------------------------------------------------
function colorTerrain(n,colorArray){
    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
            if(heights[i][j]>0.07){
                colorArray.push(0);
                colorArray.push(0);
                colorArray.push(0);
                colorArray.push(1);
            }else if(heights[i][j]>0.05){
                colorArray.push(1);
                colorArray.push(0.5);
                colorArray.push(0);
                colorArray.push(1);
            }else if(heights[i][j]>0.03){
                colorArray.push(0);
                colorArray.push(1);
                colorArray.push(0);
                colorArray.push(1);
            }else{
                colorArray.push(0);
                colorArray.push(0);
                colorArray.push(1);
                colorArray.push(1);
            }        
       }
}