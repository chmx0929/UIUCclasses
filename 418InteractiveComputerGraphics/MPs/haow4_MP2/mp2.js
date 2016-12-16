
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

// Create a place to store cube color
var cubeVertexColorBuffer;

// Create a place to store cube geometry
var cubeVertexPositionBuffer;

//Create a place to store normals for shading
//var sphereVertexNormalBuffer;

// Create a place to store terrain geometry
var tVertexPositionBuffer;

// Create a place to store terrain color
var tVertexColorBuffer;

//Create a place to store normals for shading
var tVertexNormalBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0, 0.0, 1.4);
var viewDir = vec3.fromValues(0.0, 0.0, -1.0);
var up = vec3.fromValues(0.0, 1.0, 0.0);
var viewPt = vec3.fromValues(0.0, 0.0, 0.0);
var eyeLocX = 0.0;
var eyeLocY = -0.3;
var eyeLocZ = 0.0;
var speedX = 0.0;
var speedY = 0.0;
var speedZ = 0.0003;
// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();
var mvMatrixStack = [];

//quaternion for keeping tack of view quaternion and normal quaternion
var Pview = quat.fromValues(0, 0, -1, 1);
var Pnormal = quat.fromValues(0, 1, 0, 1);


//-------------------------------------------------------------------------
function setupTerrainBuffers() {
    
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var cTerrain=[];
    var gridN = 64;
    
    var numT = terrainFromIteration(gridN, -1,1,-1,1, vTerrain, fTerrain, nTerrain);
    
    //console.log("Generated ", numT, " triangles"); 
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    //Setup terrain color
    colorTerrain(gridN,cTerrain);
    tVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cTerrain), gl.STATIC_DRAW);
    tVertexColorBuffer.itemSize = 4;
    tVertexColorBuffer.numItems = (gridN+1)*(gridN+1)+(gridN+1);
    //console.log(cTerrain);
    
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain),
                  gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
    
    //Setup Edges
     generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain),
                  gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = eTerrain.length;
}

//-------------------------------------------------------------------------
function drawTerrain(){
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            tVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

//-------------------------------------------------------------------------
function drawTerrainEdges(){
 gl.polygonOffset(1,1);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
 gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
function setupShaders() {
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");
  
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    gl.useProgram(shaderProgram);
    
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}


//----------------------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
    gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
    gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
    gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
    gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//-------------------------------------------------------------------------
function setupSphereBuffers() {
    
    var sphereSoup=[];
    var sphereNormals=[];
    var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
    console.log("Generated ", numT, " triangles"); 
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                  gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);     
}

//-------------------------------------------------------------------------
function drawSphere(){
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}

//----------------------------------------------------------------------------------
function setupCubeBuffers(){
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    var triangleVertices = [
        0.2, -0.2,  0.3,
        0.0, -0.2,  0.3,
        0.2, -0.2,  0.5,
        0.0, -0.2,  0.5,
        0.0, -0.2,  0.3,
        0.2, -0.2,  0.5,
        
        0.2, 0.0,  0.3,
        0.0, 0.0,  0.3,
        0.2, 0.0,  0.5,
        0.0, 0.0,  0.5,
        0.0, 0.0,  0.3,
        0.2, 0.0,  0.5,
        
        0.0, -0.2, 0.5,
        0.0, -0.2, 0.3,
        0.0, 0.0,  0.3,
        0.0, -0.2, 0.5,
        0.0,  0.0, 0.5,
        0.0, 0.0,  0.3,
        
        0.2, -0.2, 0.5,
        0.2, -0.2, 0.3,
        0.2, 0.0,  0.3,
        0.2, -0.2, 0.5,
        0.2,  0.0, 0.5,
        0.2, 0.0,  0.3,
        
        0.0, -0.2, 0.5,
        0.0, 0.0, 0.5,
        0.2, -0.2,0.5,
        0.2, 0.0, 0.5,
        0.0, 0.0, 0.5,
        0.2, -0.2,0.5,
        
        0.0, -0.2, 0.3,
        0.0, 0.0, 0.3,
        0.2, -0.2,0.3,
        0.2, 0.0, 0.3,
        0.0, 0.0, 0.3,
        0.2, -0.2,0.3
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numberOfItems = 36;
    
    cubeVertexColorBuffer =gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    var colors = [];
    for(var i=0;i<36;i++){
        colors.push(1);
        colors.push(0);
        colors.push(0);
        colors.push(1);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    cubeVertexColorBuffer.itemSize = 4;
    cubeVertexColorBuffer.numItems = 48;
}

//---------------------------------------------------------------------------------
function drawCube(){
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.drawArrays(gl.TRIANGLES, 0, cubeVertexPositionBuffer.numberOfItems);
}

//----------------------------------------------------------------------------------
function setupBuffers() {
    setupTerrainBuffers();
    setupCubeBuffers();
}

//-----------------------------------------------------------------------------------
function uploadMaterialToShader(a,d,s) {
  gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, s);
}

//----------------------------------------------------------------------------------
function draw() { 
    var transformVec = vec3.create();
    
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
    // We want to look down -z, so create a lookat point in that direction
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
    
    //Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,eyeLocX,eyeLocY,eyeLocZ);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-90));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(0));
    setMatrixUniforms();
    eyeLocZ = eyeLocZ+speedZ;
    eyeLocY = eyeLocY+speedY;
    eyeLocX = eyeLocX+speedX;
    uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[1.0,0.5,0.0],[0.0,0.0,0.0]);
    drawTerrain();
    uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
    drawTerrainEdges();
    mvPopMatrix();
    //Draw Cube
    drawCube();
}

//---------------------------------------------------------------------------------
function handleKeys(){
    var qx = quat.create();
    var qy = quat.create();
    var newqx = quat.create();
    var newqy = quat.create();
    var out = quat.create();
    var xAxis = vec3.fromValues(1,0,0);
    var zAxis = vec3.fromValues(0,0,1);
    if(window.event.keyCode === 38){
            //Up
            quat.setAxisAngle(qx, xAxis,degToRad(0.3));
            quat.conjugate(newqx,qx);
            quat.multiply(out, Pview, newqx);
            quat.multiply(Pview, qx, out);
            quat.multiply(out, Pnormal, newqx);
            quat.multiply(Pnormal, qx, out);
            viewDir = vec3.fromValues(Pview[0], Pview[1], Pview[2]);
            up = vec3.fromValues(Pnormal[0], Pnormal[1], Pnormal[2]);
            speedY = speedY - 0.00002;
        }else if(window.event.keyCode === 40){
            //Down
            quat.setAxisAngle(qx, xAxis,degToRad(-0.3));
            quat.conjugate(newqx,qx);
            quat.multiply(out, Pview, newqx);
            quat.multiply(Pview, qx, out);
            quat.multiply(out, Pnormal, newqx);
            quat.multiply(Pnormal, qx, out);
            viewDir = vec3.fromValues(Pview[0], Pview[1], Pview[2]);
            up = vec3.fromValues(Pnormal[0], Pnormal[1], Pnormal[2]);
            speedY = speedY + 0.00002;
        }else if(window.event.keyCode === 37){
            //Left
            quat.setAxisAngle(qy, zAxis, degToRad(0.3));
            quat.conjugate(newqy,qy);
            quat.multiply(out, Pnormal, newqy);
            quat.multiply(Pnormal, qy, out);
            up = vec3.fromValues(Pnormal[0], Pnormal[1], Pnormal[2]);
            speedX = speedX + 0.00002;
        }else if(window.event.keyCode === 39){
            //Right
            quat.setAxisAngle(qy, zAxis, degToRad(-0.3));
            quat.conjugate(newqy,qy);
            quat.multiply(out, Pnormal, newqy);
            quat.multiply(Pnormal, qy, out);
            up = vec3.fromValues(Pnormal[0], Pnormal[1], Pnormal[2]);
            speedX = speedX - 0.00002;
       }
}

//----------------------------------------------------------------------------------
function collisionDetection(){
    if((eyeLocX>=-0.2)&&(eyeLocX<=0.0)){
        if((eyeLocY>=-0.5)&&(eyeLocY<=-0.3)){
            if((eyeLocZ>=1.1)&&(eyeLocZ<=1.3)){
                return true;      
            }
        }
    }
    return false;
}

//----------------------------------------------------------------------------------
function animate() {
    document.addEventListener('keydown',handleKeys, false);
    //Collision Detection
    if(collisionDetection()){
        window.location.reload();
    }
}


//----------------------------------------------------------------------------------
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}