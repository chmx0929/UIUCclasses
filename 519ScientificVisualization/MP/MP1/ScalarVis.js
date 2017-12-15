
//University of Illinois/NCSA Open Source License
//Copyright (c) 2015 University of Illinois
//All rights reserved.
//
//Developed by: 		Eric Shaffer
//                  Department of Computer Science
//                  University of Illinois at Urbana Champaign
//
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
//documentation files (the "Software"), to deal with the Software without restriction, including without limitation
//the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
//to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//Redistributions of source code must retain the above copyright notice, this list of conditions and the following
//disclaimers.Redistributions in binary form must reproduce the above copyright notice, this list
//of conditions and the following disclaimers in the documentation and/or other materials provided with the distribution.
//Neither the names of <Name of Development Group, Name of Institution>, nor the names of its contributors may be
//used to endorse or promote products derived from this Software without specific prior written permission.
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
//WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//CONTRIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//DEALINGS WITH THE SOFTWARE.




//-------------------------------------------------------
// Global variables
var x_extent=[-1.0,1.0];
var y_extent=[-1.0,1.0];
var myGrid;

//------------------------------------------------------
//MAIN
function main() {
	render();
}

//--Function: render-------------------------------------
//Main drawing function

function render(canvas){
  var res = parseFloat(document.getElementById("grid_res").value);
  // ----------------------------------------------------------------------------------
  var contour_values = document.getElementById("contour_value").value;
  var thresholds = contour_values.split(" ");
  var frequency = document.getElementById("frequency").value;
  // Array to store vertex value
  var _value = (function()
  {
    var array = [];
    for(var y = 0; y != (res+1); y++) { array[y] = new Array(res+1); }
      return array;
  })();
  // ----------------------------------------------------------------------------------
  myGrid = new UGrid2D([x_extent[0],y_extent[0]],  [x_extent[1],y_extent[1]]  ,res);
  var canvas = document.getElementById('example');
  if (! canvas) {
    console.log(' Failed to retrieve the < canvas > element');
    return false;
  }
  else {
	console.log(' Got < canvas > element ');
  }


// Get the rendering context for 2DCG <- (2)
var ctx = canvas.getContext('2d');

// Draw the scalar data using an image rpresentation
var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);

// Store whole image fval data
var pt_value = (function()
  {
    var array = [];
    for(var y = 0; y != (canvas.width+1); y++) { array[y] = new Array(canvas.height+1); }
      return array;
  })();

// Choose the scalar function
var scalar_func = gaussian;
if (document.getElementById("Sine").checked)
  scalar_func = sin2D;

//Determine the data range...useful for the color mapping
var mn = scalar_func(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,0,0));
var mx = mn
for (var y=0;y<canvas.height;y++)
	for (var x=0;x<canvas.width;x++)
  	{
  		var fval = scalar_func(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x,y));
  		if (fval < mn)
  			mn=fval;
  		if (fval>mx)
  			mx=fval;
  	}

  // Set the colormap based in the radio button
  var color_func = rainbow_colormap;
  if (document.getElementById("greyscale").checked)
    color_func = greyscale_map;
  if (document.getElementById("designed").checked)
    color_func = designed_colormap;

  //Color the domain according to the scalar value
  for (var y=0;y<canvas.height;y++)
  	for (var x=0;x<canvas.width;x++)
    {
        // Do Interpolation if necessary
        if (document.getElementById("interpolation").checked){
          var x_left = Math.floor(x/frequency)*frequency;
          var x_right = Math.ceil(x/frequency)*frequency;
          var y_top = Math.floor(y/frequency)*frequency;
          var y_bottom = Math.ceil(y/frequency)*frequency;
          if(x_left == x_right )
          {
            x_right+=frequency;
          }
          if (y_top == y_bottom)
          {
            y_bottom+=frequency;
          }
          var left_top = scalar_func(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x_left,y_top));
          var right_top = scalar_func(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x_right,y_top));
          var left_bottom = scalar_func(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x_left,y_bottom));
          var right_bottom = scalar_func(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x_right,y_bottom));

          var R1 = (x_right-x)/(x_right-x_left)*left_bottom + (x-x_left)/(x_right-x_left)*right_bottom;
          var R2 = (x_right-x)/(x_right-x_left)*left_top + (x-x_left)/(x_right-x_left)*right_top; 
          var fval = (y_top-y)/(y_top-y_bottom)*R1 + (y-y_bottom)/(y_top-y_bottom)*R2;
        }else{
          var fval = scalar_func(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x,y));
        }

        pt_value[x][y] = fval;
    	var color = color_func(fval,mn,mx);

    	i = (y*canvas.width + x)*4

    	imgData.data[i]=color[0];
    	imgData.data[i+1]= color[1];
    	imgData.data[i+2]= color[2];
    	imgData.data[i+3]= color[3];
    }

   for (var y=0;y<(res+1);y++)
    for (var x=0;x<(res+1);x++)
    {
        var fval = pt_value[x*(canvas.width/res)][y*(canvas.height/res)];
        _value[x][y] = fval;
    }
    for (var i = 0; i <(res+1); i++) {
    	_value[res][i] = pt_value[canvas.width-1][i*(canvas.height/res)];
    	_value[i][res] = pt_value[i*(canvas.width/res)][canvas.height-1];
    }
    _value[res][res] = pt_value[canvas.width-1][canvas.width-1];
    console.log(_value);
	ctx.putImageData(imgData,0,0);

  // Draw the grid if necessary
  if (document.getElementById("show_grid").checked)
    myGrid.draw_grid(canvas);
  
  //Draw contour
  for (var t = 0; t < thresholds.length; t++){
    var a = draw_contour(canvas,res,parseFloat(thresholds[t]),_value,pt_value);
  }
}

//--------------------------------------------------------
// Map a point in pixel coordinates to the 2D function domain
function pixel2pt(width,height,x_extent,y_extent, p_x,p_y){
	var pt = [0,0];
	xlen=x_extent[1]-x_extent[0]
	ylen=y_extent[1]-y_extent[0]
	pt[0]=(p_x/width)*xlen + x_extent[0];
	pt[1]=(p_y/height)*ylen + y_extent[0];
	return pt;
	}

//--------------------------------------------------------
// Map a point in domain coordinates to pixel coordinates
function pt2pixel(width,height,x_extent,y_extent, p_x,p_y){
	var pt = [0,0];

	var xlen = (p_x-x_extent[0])/(x_extent[1]-x_extent[0]);
  var ylen = (p_y-y_extent[0])/(y_extent[1]-y_extent[0]);

	pt[0]=Math.round(xlen*width);
	pt[1]=Math.round(ylen*height);
	return pt;
	}