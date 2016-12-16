
function SceneTransforms(c){
	this.stack = [];
	this.camera = c;
	this.mvMatrix    = mat4.create();    // The Model-View matrix
	this.pMatrix     = mat4.create();    // The projection matrix
	this.nMatrix     = mat4.create();    // The normal matrix
	this.cMatrix     = mat4.create();    // The camera matrix	
};


SceneTransforms.prototype.calculateModelView = function(){
	this.mvMatrix = this.camera.getViewTransform();
};

SceneTransforms.prototype.calculateNormal = function(){
	
    mat4.identity(this.nMatrix);
    mat4.set(this.mvMatrix, this.nMatrix);
    mat4.inverse(this.nMatrix);
    mat4.transpose(this.nMatrix);
};

SceneTransforms.prototype.calculatePerspective = function(){
	//Initialize Perspective matrix
    mat4.identity(this.pMatrix);
    mat4.perspective(30, c_width / c_height, 0.1, 1000.0, this.pMatrix);
};


/**
*   Defines the initial values for the transformation matrices
*/
SceneTransforms.prototype.init = function(){
    this.calculateModelView();
    this.calculatePerspective();
    this.calculateNormal();
};


SceneTransforms.prototype.updatePerspective = function(){
    mat4.perspective(30, c_width / c_height, 0.1, 1000.0, this.pMatrix);  // We can resize the screen at any point so the perspective matrix should be updated always.
};


/**
* Maps the matrices to shader matrix uniforms
*
* Called once per rendering cycle. 
*/
SceneTransforms.prototype.setMatrixUniforms = function(){
	this.calculateNormal();
    gl.uniformMatrix4fv(Program.uMVMatrix, false, this.mvMatrix);  //Maps the Model-View matrix to the uniform prg.uMVMatrix
    gl.uniformMatrix4fv(Program.uPMatrix, false, this.pMatrix);    //Maps the Perspective matrix to the uniform prg.uPMatrix
    gl.uniformMatrix4fv(Program.uNMatrix, false, this.nMatrix);    //Maps the Normal matrix to the uniform prg.uNMatrix
};


SceneTransforms.prototype.push = function(){
	var memento =  mat4.create();
	mat4.set(this.mvMatrix, memento);
	this.stack.push(memento);
};

SceneTransforms.prototype.pop = function(){
	if(this.stack.length == 0) return;
	this.mvMatrix  =  this.stack.pop();
};