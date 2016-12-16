var WEBGLAPP_RENDER = undefined;
var WEBGLAPP_TIMER_ID = -1;
var WEBGLAPP_RENDER_RATE = 16;

function WebGLApp(canvas) {
    this.loadSceneHook = undefined;
    this.configureGLHook = undefined;
    gl = Utils.getGLContext(canvas);
}
  
WebGLApp.prototype.run = function(){
        if (this.configureGLHook == undefined){
            alert('The WebGL application cannot start because the configureGLHook has not been specified'); return;
        }
        if (this.loadSceneHook == undefined){
            alert('The WebGL application cannot start because the loadSceneHook has not been specified'); return;
        }
        if (this.drawSceneHook == undefined){
            alert('The WebGL application cannot start because the drawSceneHook has not been specified'); return;
        }
        
        this.configureGLHook();
        
        this.loadSceneHook();
        
        WEBGLAPP_RENDER = this.drawSceneHook;
        
        renderLoop();
 }
 
 /**
 * Causes immediate rendering
 */
 WebGLApp.prototype.refresh = function(){
    if (WEBGLAPP_RENDER) WEBGLAPP_RENDER();
 }
     
renderLoop = function(){
     WEBGLAPP_TIMER_ID = setInterval(WEBGLAPP_RENDER, WEBGLAPP_RENDER_RATE);
}

window.onblur = function(){
    clearInterval(WEBGLAPP_TIMER_ID);
    console.info('Rendering stopped');
}

window.onfocus = function(){
    renderLoop();
    console.info('Rendering resumed');
}

