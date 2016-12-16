
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;


// Create a place to store vertex colors
var vertexColorBuffer;

var mvMatrix = mat4.create();
var rotAngle = 0;
var lastTime = 0;

// set up matrix uniforms
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

// translate degree from angle to radians 
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

// create WebGl context
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

// load shader from Document Object Model
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);

  if (!shaderScript) {
    return null;
  }
  
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
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

// set tp shaders
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
  
}

//set up buffer, creating triangles and coloring them
function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
      //1
          -0.80, 0.83,  0.0,
          -0.80, 0.55,  0.0,
          -0.63, 0.55,  0.0,
      //2
          -0.80, 0.83,  0.0,
          -0.80, 0.55,  0.0,
          -0.29, 0.55,  0.0,
      //3
          -0.80, 0.83,  0.0,
          -0.80, 0.55,  0.0,
           0.29, 0.55,  0.0,
      //4
          -0.80, 0.83,  0.0,
          -0.80, 0.55,  0.0,
           0.63, 0.55,  0.0,
      //5
          -0.80, 0.83,  0.0,
           0.80, 0.55,  0.0,
           0.63, 0.55,  0.0,
      //6
          -0.80, 0.83,  0.0,
           0.80, 0.55,  0.0,
           0.80, 0.83,  0.0,
      //7
          -0.63, 0.55,  0.0,
          -0.63, -0.29, 0.0,
          -0.29, -0.29, 0.0,
      //8
          -0.63, 0.55,  0.0,
          -0.29, 0.55,  0.0,
          -0.29, 0.31,  0.0,
      //9
          -0.63, 0.55,  0.0,
          -0.29, 0.55,  0.0,
          -0.29, -0.07, 0.0,
      //10
          -0.63, 0.55,  0.0,
          -0.29, 0.55,  0.0,
          -0.29, -0.29, 0.0,
      //11
          -0.29, 0.31,  0.0,
          -0.29, -0.07, 0.0,
          -0.15, -0.07, 0.0,
      //12
          -0.29, 0.31,  0.0,
          -0.15, 0.31,  0.0,
          -0.15, -0.07, 0.0,
      //13
          0.63, 0.55,   0.0,
          0.63, -0.29,  0.0,
          0.29, -0.29,  0.0,
      //14
          0.63, 0.55,   0.0,
          0.29, 0.55,   0.0,
          0.29, 0.31,   0.0,
      //15
          0.63, 0.55,   0.0,
          0.29, 0.55,   0.0,
          0.29, -0.07,  0.0,
      //16
          0.63, 0.55,   0.0,
          0.29, 0.55,   0.0,
          0.29, -0.29,  0.0,
      //17
          0.29, 0.31,   0.0,
          0.29, -0.07,  0.0,
          0.15, -0.07,  0.0,
      //18
          0.29, 0.31,   0.0,
          0.15, 0.31,   0.0,
          0.15, -0.07,  0.0,
      //19-------------------------------orange rectangles
          -0.63, -0.30, 0.0,
          -0.52, -0.30, 0.0,
          -0.63, -0.42, 0.0,
      //20
          -0.52, -0.30, 0.0,
          -0.63, -0.42, 0.0,
          -0.52, -0.49, 0.0,
      //21
          -0.41, -0.30, 0.0,
          -0.29, -0.30, 0.0,
          -0.41, -0.57, 0.0,
      //22
          -0.29, -0.30, 0.0,
          -0.41, -0.57, 0.0,
          -0.29, -0.64, 0.0,
      //23
          -0.18, -0.30, 0.0,
          -0.06, -0.30, 0.0,
          -0.18, -0.71, 0.0,
      //24
          -0.06, -0.30, 0.0,
          -0.18, -0.71, 0.0,
          -0.06, -0.78, 0.0,
      //25
           0.63, -0.30, 0.0,
           0.52, -0.30, 0.0,
           0.63, -0.42, 0.0,
      //26
           0.52, -0.30, 0.0,
           0.63, -0.42, 0.0,
           0.52, -0.49, 0.0,
      //27
           0.41, -0.30, 0.0,
           0.29, -0.30, 0.0,
           0.41, -0.57, 0.0,
      //28
           0.29, -0.30, 0.0,
           0.41, -0.57, 0.0,
           0.29, -0.64, 0.0,
      //29
           0.18, -0.30, 0.0,
           0.06, -0.30, 0.0,
           0.18, -0.71, 0.0,
      //30
           0.06, -0.30, 0.0,
           0.18, -0.71, 0.0,
           0.06, -0.78, 0,0
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 90;
    
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
        0.07, 0.15, 0.29, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
      
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0,
        0.91, 0.29, 0.21, 1.0
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 90;  
}

// implement draw part
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  mat4.identity(mvMatrix);
  mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

var prv = -0.01;
var cur = 0;
var sinscalar = 0;

// implement animation part
function animate() {
        sinscalar += 0.1;
        if(cur > prv){
            prv = cur;
            cur += 0.01;
        }
        if(cur >= 0.5){
            cur = prv - 0.01;
        }
        if(cur < prv){
            prv = cur;
            cur -= 0.01;
        }
        if(cur <= -0.5){
            cur = prv + 0.01;
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        var triangleVertices = [
      //1
          -0.80+cur, 0.83,  0.0,
          -0.80+cur, 0.55,  0.0,
          -0.63+cur, 0.55,  0.0,
      //2
          -0.80+cur, 0.83,  0.0,
          -0.80+cur, 0.55,  0.0,
          -0.29+cur, 0.55,  0.0,
      //3
          -0.80+cur, 0.83,  0.0,
          -0.80+cur, 0.55,  0.0,
           0.29+cur, 0.55,  0.0,
      //4
          -0.80+cur, 0.83,  0.0,
          -0.80+cur, 0.55,  0.0,
           0.63+cur, 0.55,  0.0,
      //5
          -0.80+cur, 0.83,  0.0,
           0.80+cur, 0.55,  0.0,
           0.63+cur, 0.55,  0.0,
      //6
          -0.80+cur, 0.83,  0.0,
           0.80+cur, 0.55,  0.0,
           0.80+cur, 0.83,  0.0,
      //7
          -0.63+cur, 0.55,  0.0,
          -0.63+cur, -0.29, 0.0,
          -0.29+cur, -0.29, 0.0,
      //8
          -0.63+cur, 0.55,  0.0,
          -0.29+cur, 0.55,  0.0,
          -0.29+cur, 0.31,  0.0,
      //9
          -0.63+cur, 0.55,  0.0,
          -0.29+cur, 0.55,  0.0,
          -0.29+cur, -0.07, 0.0,
      //10
          -0.63+cur, 0.55,  0.0,
          -0.29+cur, 0.55,  0.0,
          -0.29+cur, -0.29, 0.0,
      //11
          -0.29+cur, 0.31,  0.0,
          -0.29+cur, -0.07, 0.0,
          -0.15+cur, -0.07, 0.0,
      //12
          -0.29+cur, 0.31,  0.0,
          -0.15+cur, 0.31,  0.0,
          -0.15+cur, -0.07, 0.0,
      //13
          0.63+cur, 0.55,   0.0,
          0.63+cur, -0.29,  0.0,
          0.29+cur, -0.29,  0.0,
      //14
          0.63+cur, 0.55,   0.0,
          0.29+cur, 0.55,   0.0,
          0.29+cur, 0.31,   0.0,
      //15
          0.63+cur, 0.55,   0.0,
          0.29+cur, 0.55,   0.0,
          0.29+cur, -0.07,  0.0,
      //16
          0.63+cur, 0.55,   0.0,
          0.29+cur, 0.55,   0.0,
          0.29+cur, -0.29,  0.0,
      //17
          0.29+cur, 0.31,   0.0,
          0.29+cur, -0.07,  0.0,
          0.15+cur, -0.07,  0.0,
      //18
          0.29+cur, 0.31,   0.0,
          0.15+cur, 0.31,   0.0,
          0.15+cur, -0.07,  0.0,
      //19-------------------------------orange rectangles
          -0.63+cur, -0.30, 0.0,
          -0.52+cur, -0.30, 0.0,
          -0.63+cur-Math.sin(sinscalar-0.25)*0.05, -0.42-Math.cos(sinscalar)*0.01, 0.0,
      //20
          -0.52+cur, -0.30, 0.0,
          -0.63+cur-Math.sin(sinscalar-0.25)*0.05, -0.42-Math.cos(sinscalar)*0.01, 0.0,
          -0.52+cur, -0.49, 0.0,
      //21
          -0.41+cur, -0.30, 0.0,
          -0.29+cur, -0.30, 0.0,
          -0.41+cur-Math.sin(sinscalar-0.25)*0.05, -0.57-Math.cos(sinscalar)*0.01, 0.0,
      //22
          -0.29+cur, -0.30, 0.0,
          -0.41+cur-Math.sin(sinscalar-0.25)*0.05, -0.57-Math.cos(sinscalar)*0.01, 0.0,
          -0.29+cur, -0.64, 0.0,
      //23
          -0.18+cur, -0.30, 0.0,
          -0.06+cur, -0.30, 0.0,
          -0.18+cur-Math.sin(sinscalar-0.25)*0.05, -0.71-Math.cos(sinscalar)*0.01, 0.0,
      //24
          -0.06+cur, -0.30, 0.0,
          -0.18+cur-Math.sin(sinscalar-0.25)*0.05, -0.71-Math.cos(sinscalar)*0.01, 0.0,
          -0.06+cur, -0.78, 0.0,
      //25
           0.63+cur, -0.30, 0.0,
           0.52+cur, -0.30, 0.0,
           0.63+cur+Math.sin(sinscalar-0.25)*0.05, -0.42+Math.cos(sinscalar)*0.01, 0.0,
      //26
           0.52+cur, -0.30, 0.0,
           0.63+cur+Math.sin(sinscalar-0.25)*0.05, -0.42+Math.cos(sinscalar)*0.01, 0.0,
           0.52+cur, -0.49, 0.0,
      //27
           0.41+cur, -0.30, 0.0,
           0.29+cur, -0.30, 0.0,
           0.41+cur+Math.sin(sinscalar-0.25)*0.05, -0.57+Math.cos(sinscalar)*0.01, 0.0,
      //28
           0.29+cur, -0.30, 0.0,
           0.41+cur+Math.sin(sinscalar-0.25)*0.05, -0.57+Math.cos(sinscalar)*0.01, 0.0,
           0.29+cur, -0.64, 0.0,
      //29
           0.18+cur, -0.30, 0.0,
           0.06+cur, -0.30, 0.0,
           0.18+cur+Math.sin(sinscalar-0.25)*0.05, -0.71+Math.cos(sinscalar)*0.01, 0.0,
      //30
           0.06+cur, -0.30, 0.0,
           0.18+cur+Math.sin(sinscalar-0.25)*0.05, -0.71+Math.cos(sinscalar)*0.01, 0.0,
           0.06+cur, -0.78, 0,0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
        vertexPositionBuffer.itemSize = 3;
        vertexPositionBuffer.numberOfItems = 90;
}

// startup function to set up environment and call tick function
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

// implement draw and animation parts
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}
