/** 
 *  @fileOverview Implements a simple visualization tool for a set of 2D mathematical functions.
 *
 *  @author       <Your Name Here!>
 *
 */

function main(){ 

// Retrieve < canvas > element <- (1) 
var canvas = document.getElementById('example'); 
if (! canvas) { 
    console.log(' Failed to retrieve the < canvas > element'); 
    return false; 
} 
else{
	console.log(' Got < canvas > element ');
}
// Get the rendering context for 2DCG <- (2) 
var ctx = canvas.getContext('2d'); 

// Draw something 
var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);

// Set up the logical domain of the function which we'll map to pixels
var x_extent=[-1.0,1.0]
var y_extent=[-1.0,1.0]

//Determine the data range...useful for the color mapping
var mn = 0;
var mx = 1;

//------------
  	
//Color the domain according to the function value
for (var y=0;y<canvas.height;y++)
	for (var x=0;x<canvas.width;x++)
  	{	
  		
        //Convert pixel to canvas coordinates
        //YOUR CODE HERE
        var temp = pixel2pt(canvas.width,canvas.height,[-1,1],[-1,1],x,y);
        
        //Evaluate the gaussian function at that point
  		//YOUR CODE HERE
        var fval = gaussian(temp);
        
        console.log("Got function value: ", fval);
  		
  		//---------------
  		var color = greyscale_map(fval,mn,mx);
  		i = (y*canvas.width + x)*4
  		
  		imgData.data[i]=color[0];
  		imgData.data[i+1]= color[1];
  		imgData.data[i+2]= color[2];
  		imgData.data[i+3]= color[3];
     }
    
	ctx.putImageData(imgData,0,0);
}

/**
 * Translates from pixel (screen) coordinates to coordinates in the domain of a given mathematical function
 * @param {number} width of canvas in pixels
 * @param {number} height of canvas in pixels
 * @param {Object[]} Two floating point numbers specifying the extent of the domain on the x axis (e.g. [-1,1] )
 * @param {Object[]} Two floating point numbers specifying the extent of the domain on the y axis (e.g. [-1,1] )
 * @param {number} x coordinate in pixel space
 * @param {number} y coordinate in pixel space
 * @return {Object[]} The x and y cooridnates of the pixel in the mathematical domain (e.g. [0.5, -0.5])
 */
function pixel2pt(width,height,x_extent,y_extent, p_x,p_y){
	var pt = [0,0];

  //YOUR CODE HERE
  pt[0] = (p_x / width) * (x_extent[1]- x_extent[0]) + x_extent[0];
  pt[1] = (p_y / height) * (y_extent[1]- y_extent[0]) + y_extent[0];
  //--------------	
	return pt;
}
/**
 * Returns the value of a simple Gaussian function at a given point
 * @param {Object[]} coordinates of point in 2D domain of the function
 * @return {Number} value of the Gaussian function
 */
function gaussian(pt){
	return Math.exp(-(pt[0]*pt[0]+pt[1]*pt[1]));
}
/**
 * Maps a number within a given range to a shade of grey
 * @param {Number} value to mapped to a color
 * @param {Number} minimum value of the range
 * @param {Number} maximum value of the range
 * @return {Object[]} A color specified as an RGB value, each channel is in [0,255] and in this instance all channels have the same value to generate a grey. 
 */
function greyscale_map(fval,fmin,fmax){
  var c=255*((fval-fmin)/(fmax-fmin));
  var color = [Math.round(c),Math.round(c),Math.round(c),255];
	return color;
}

