
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;


// Create a place to store vertex colors
var vertexColorBuffer;
var pMatrix = mat4.create();
var mvMatrix = mat4.create();
var rotAngle = 0;
var rotAngle2 = 0;
var lastTime = 0;
var mvMatrixStack = [];

function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}


function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


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

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  
}

function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
    0.0,0.5,0.0,
    0.0,0.6,0.0,
    -0.42,0.42,0.0,

    -0.42,0.42,0.0,
    -0.35,0.35,0.0,
    0.0,0.5,0.0,
    
    -0.35,0.35,0.0,
    -0.42,0.42,0.0,
    -0.6,0.0,0.0,
    
    -0.6,0.0,0.0,
    -0.5,0.0,0.0,
    -0.35,0.35,0.0,
    
    -0.5,0.0,0.0,
    -0.6,0.0,0.0,
    -0.42,-0.42,0.0,
    
    -0.42,-0.42,0.0,
    -0.35,-0.35,0.0,
    -0.5,0.0,0.0,
    
    -0.35,-0.35,0.0,
    -0.42,-0.42,0.0,
    0.0,-0.6,0.0,
    
    0.0,-0.6,0.0,
    0.0,-0.5,0.0,
    -0.35,-0.35,0.0,
    
    0.0,-0.5,0.0,
    0.0,-0.6,0.0,
    0.42,-0.42,0.0,
    
    0.42,-0.42,0.0,
    0.35,-0.35,0.0,
    0.0,-0.5,0.0,
    
    0.35,-0.35,0.0,
    0.42,-0.42,0.0,
    0.6,0.0,0.0,
    
    0.6,0.0,0.0,
    0.5,0.0,0.0,
    0.35,-0.35,0.0,
    
    0.5,0.0,0.0,
    0.6,0.0,0.0,
    0.42,0.42,0.0,
    
    0.42,0.42,0.0,
    0.35,0.35,0.0,
    0.5,0.0,0.0,
    
    0.35,0.35,0.0,
    0.42,0.42,0.0,
    0.0,0.5,0.0,
    
    0.0,0.5,0.0,
    0.0,0.6,0.0,
    0.42,0.42,0.0
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 48;
   
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1,
    0.5,0.5,0,1
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 48;

  secondRingColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, secondRingColorBuffer);
  var colors2 = [
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1,
    0.8,0.2,0,1
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.STATIC_DRAW);
  secondRingColorBuffer.itemSize = 4;
  secondRingColorBuffer.numItems = 48;  
}

function draw() { 
  var transformVec = vec3.create();
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  
  mat4.identity(mvMatrix);
  mvPushMatrix();
  mvPushMatrix();

  vec3.set(transformVec, -0.3,0.0,0.0)
  mat4.translate(mvMatrix, mvMatrix,transformVec);
  mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotAngle));
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, secondRingColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            secondRingColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  mvPopMatrix();
  mat4.rotateX(mvMatrix, mvMatrix, degToRad(45));
  mat4.rotateZ(mvMatrix, mvMatrix, degToRad(-1*rotAngle));
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  mvPopMatrix();
}

function animate() {
  rotAngle = (rotAngle + 1) % 360;
}

function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}
