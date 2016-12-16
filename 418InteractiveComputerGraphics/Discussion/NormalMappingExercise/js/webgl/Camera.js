/**
*   Camera
*/

var CAMERA_ORBITING_TYPE = 1;
var CAMERA_TRACKING_TYPE = 2;

function Camera(t){
    this.matrix     = mat4.create();
    this.up         = vec3.create();
    this.right      = vec3.create();
    this.normal     = vec3.create();
    this.position   = vec3.create();
    this.focus      = vec3.create();
    this.azimuth    = 0.0;
    this.elevation  = 0.0;
    this.type       = t;
    this.steps      = 0;
    
    this.home = vec3.create();
      
    this.hookRenderer = null;
    this.hookGUIUpdate = null;
}

Camera.prototype.setType = function(t){
    
    this.type = t;
    
    if (t != CAMERA_ORBITING_TYPE && t != CAMERA_TRACKING_TYPE) {
        alert('Wrong Camera Type!. Setting Orbitting type by default');
        this.type = CAMERA_ORBITING_TYPE;
    }
}

Camera.prototype.goHome = function(h){
    if (h != null){
        this.home = h;
    }
    
    this.setPosition(this.home);
    this.setAzimuth(0);
    this.setElevation(0);
    this.steps = 0;
}

Camera.prototype.dolly = function(s){
    var c = this;
    
    var p =  vec3.create();
    var n = vec3.create();
    
    p = c.position;
    
    var step = s - c.steps;
    
    vec3.normalize(c.normal,n);
    
    var newPosition = vec3.create();
    
    if(c.type == CAMERA_TRACKING_TYPE){
        newPosition[0] = p[0] - step*n[0];
        newPosition[1] = p[1] - step*n[1];
        newPosition[2] = p[2] - step*n[2];
    }
    else{
        newPosition[0] = p[0];
        newPosition[1] = p[1];
        newPosition[2] = p[2] - step; 
    }
	
    c.setPosition(newPosition);
    c.steps = s;
}

Camera.prototype.setPosition = function(p){
    vec3.set(p, this.position);
    this.update();
}

Camera.prototype.setFocus = function(f){
	vec3.set(f, this.focus);
	this.update();
}

Camera.prototype.setAzimuth = function(az){
    this.changeAzimuth(az - this.azimuth);
}

Camera.prototype.changeAzimuth = function(az){
    var c = this;
    c.azimuth +=az;
    
    if (c.azimuth > 360 || c.azimuth <-360) {
		c.azimuth = c.azimuth % 360;
	}
    c.update();
}

Camera.prototype.setElevation = function(el){
    this.changeElevation(el - this.elevation);
}

Camera.prototype.changeElevation = function(el){
    var c = this;
    
    c.elevation +=el;
    
    if (c.elevation > 360 || c.elevation <-360) {
		c.elevation = c.elevation % 360;
	}
    c.update();
}

Camera.prototype.calculateOrientation = function(){
	var m = this.matrix;
    mat4.multiplyVec4(m, [1, 0, 0, 0], this.right);
    mat4.multiplyVec4(m, [0, 1, 0, 0], this.up);
    mat4.multiplyVec4(m, [0, 0, 1, 0], this.normal);
}

Camera.prototype.update = function(){
	mat4.identity(this.matrix);
	
	this.calculateOrientation();
    
    if (this.type == CAMERA_TRACKING_TYPE){
        mat4.translate(this.matrix, this.position);
        mat4.rotateY(this.matrix, this.azimuth * Math.PI/180);
        mat4.rotateX(this.matrix, this.elevation * Math.PI/180);
    }
    else {
        var trxLook = mat4.create();
        mat4.rotateY(this.matrix, this.azimuth * Math.PI/180);
        mat4.rotateX(this.matrix, this.elevation * Math.PI/180);
        mat4.translate(this.matrix,this.position);
        //mat4.lookAt(this.position, this.focus, this.up, trxLook);
        //mat4.inverse(trxLook);
        //mat4.multiply(this.matrix,trxLook);
    }

    this.calculateOrientation();
    
    /**
    * We only update the position if we have a tracking camera.
    * For an orbiting camera we do not update the position. If
    * you don't believe me, go ahead and comment the if clause...
    * Why do you think we do not update the position?
    */
    if(this.type == CAMERA_TRACKING_TYPE){
        mat4.multiplyVec4(this.matrix, [0, 0, 0, 1], this.position);
    }
    
    //console.info('------------- update -------------');
    //console.info(' right: ' + vec3.str(this.right)+', up: ' + vec3.str(this.up)+',normal: ' + vec3.str(this.normal));
    //console.info('   pos: ' + vec3.str(this.position));
    //console.info('   azimuth: ' + this.azimuth +', elevation: '+ this.elevation);
    if(this.hookRenderer){
        this.hookRenderer();
    }
    if(this.hookGUIUpdate){
        this.hookGUIUpdate();
    }
    
}

Camera.prototype.getViewTransform = function(){
    var m = mat4.create();
    mat4.inverse(this.matrix, m);
    return m;
}

