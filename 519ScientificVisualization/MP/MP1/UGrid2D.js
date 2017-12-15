
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





//--------------------------------------------------------
// A Simple 2D Grid Class
var UGrid2D = function(min_corner,max_corner,resolution){
  this.min_corner=min_corner;
  this.max_corner=max_corner;
  this.resolution=resolution;
  console.log('UGrid2D instance created');
}


// Method: draw_grid
// Draw the grid lines

UGrid2D.prototype.draw_grid = function(canvas){
	  var ctx = canvas.getContext('2d');
	  // loc=[0,0];
	  delta = canvas.width/this.resolution;
	  for (var i=0;i<=this.resolution;i++)
	  {
      ctx.beginPath();
	  	ctx.moveTo(i*delta, 0);
      	ctx.lineTo(i*delta, canvas.height-1);
      	ctx.lineWidth = 1;
      	// set line color
      	ctx.strokeStyle = '#000000';
      	ctx.stroke();
	   }
	   // loc=[0,0];

	  	delta = canvas.height/this.resolution;

	  for (var i=0;i<=this.resolution;i++)
	  {
      ctx.beginPath();
	  	ctx.moveTo(0,i*delta);
      	ctx.lineTo(canvas.width-1,i*delta);
      	ctx.lineWidth = 1;
      	// set line color
      	ctx.strokeStyle = '#000000';
      	ctx.stroke();
	   }
}


//End UGrid2D--------------------------------------------