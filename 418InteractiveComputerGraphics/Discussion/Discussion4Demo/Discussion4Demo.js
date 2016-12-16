
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;


// Create a place to store vertex colors
var vertexColorBuffer;

var blueZ = -3.9;
var greenZ = -2.5;
var redZ = -1.1;
var blueflag = -1.0;
var greenflag = -1.0;
var redflag = -1.0;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotAngle = 0;
var lastTime = 0;
var transformVec = vec3.create();    
vec3.set(transformVec,0.0,0.0,-2.0);


//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
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

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
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

/**
 * Setup the fragment and vertex shaders
 */
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

/**
 * Populate buffers with data
 */
function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
    -0.5, 0.5,0.0,
     0.5, 0.5,0.0,
    -0.5,-0.5,0.0,
    -0.5,-0.5,0.0,
     0.5, 0.5,0.0,
     0.5,-0.5,0.0
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 6;
    
  redBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, redBuffer);
  color = [0.5,0.5,0.0,1.0];
  var color_red = color.concat(color,color,color,color,color);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color_red), gl.STATIC_DRAW);
  redBuffer.itemSize = 4;
  redBuffer.numItems = 6;

  greenBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, greenBuffer);
  color = [0.0,0.5,0.5,1.0];
  var color_green = color.concat(color,color,color,color,color);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color_green), gl.STATIC_DRAW);
  greenBuffer.itemSize = 4;
  greenBuffer.numItems = 6; 

  blueBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, blueBuffer); 
  color = [0.5,0.0,0.5,1.0];
  var color_blue = color.concat(color,color,color,color,color);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color_blue), gl.STATIC_DRAW);
  blueBuffer.itemSize = 4;
  blueBuffer.numItems = 6; 
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 


  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);
  mat4.perspective(pMatrix,degToRad(90), 1 , 0.1, 100.0);
  vec3.set(transformVec, 0.0,0.0,redZ)
  mat4.translate(mvMatrix, mvMatrix,transformVec);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, redBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, redBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);

  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);
  mat4.perspective(pMatrix,degToRad(90), 1 , 0.1, 100.0);
  vec3.set(transformVec, 0.0,0.0,greenZ)
  mat4.translate(mvMatrix, mvMatrix,transformVec);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, greenBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, greenBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);

  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);
  mat4.perspective(pMatrix,degToRad(90), 1 , 0.1, 100.0);
  vec3.set(transformVec, 0.0,0.0,blueZ)
  mat4.translate(mvMatrix, mvMatrix,transformVec);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, blueBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, blueBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;    
        if (blueZ >= -1.0 || blueZ <= -4.0) {
          blueflag = -1*blueflag
        }
        if (greenZ >= -1.0 || greenZ <= -4.0) {
          greenflag = -1*greenflag
        }
        if (redZ >= -1.0 || redZ <= -4.0) {
          redflag = -1*redflag
        }
        blueZ = blueZ + (blueflag*0.01)
        greenZ = greenZ + (greenflag*0.01)
        redZ = redZ + (redflag*0.01)
    }
    lastTime = timeNow;
}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

