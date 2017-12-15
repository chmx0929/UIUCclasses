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
//A simple Gaussian function
function gaussian(pt){
	return Math.exp(-(pt[0]*pt[0]+pt[1]*pt[1]));
}

//--------------------------------------------------------
//The infamous rainbow color map, normalized to the data range
function rainbow_colormap(fval,fmin,fmax){
	var dx=0.8;
	var fval_nrm = (fval-fmin)/(fmax-fmin);
	var g = (6.0-2.0*dx)*fval_nrm +dx;
	var R = Math.max(0.0,(3.0-Math.abs(g-4.0)-Math.abs(g-5.0))/2.0 )*255;
	var G = Math.max(0.0,(4.0-Math.abs(g-2.0)-Math.abs(g-4.0))/2.0 )*255;
	var B = Math.max(0.0,(3.0-Math.abs(g-1.0)-Math.abs(g-2.0))/2.0 )*255;
	color = [Math.round(R),Math.round(G),Math.round(B),255];
	return color;
}

//--------------------------------------------------------
//

function greyscale_map(fval,fmin,fmax){
  var c=255*((fval-fmin)/(fmax-fmin));
  var color = [Math.round(c),Math.round(c),Math.round(c),255];
	return color;
}

//--------------------------------------------------------
//

function gaussian_gradient(pt){
  var dx = -2*pt[0]*gaussian(pt);
  var dy = -2*pt[1]*gaussian(pt);
	return [dx,dy];
}

//--------------------------------------------------------
//

function gaussian_divergence(pt){
  var gradient =  gaussian_gradient(pt);
	return gradient[0]+gradient[1];
}

//--------------------------------------------------------
//

function gaussian_vorticity_mag(pt){
	return 0;
}

//--------------------------------------------------------
//

function normalize2D(v){
  var len = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
  if (len == 0.0)
    {
       console.log("Zero length gradient");
       return ([0.0,0.0]);
    }
  return [v[0]/len,v[1]/len];
}

//--------------------------------------------------------
//

function euler_integration(pt,h,steps,get_vector)
{
    var ln=[[pt[0],pt[1]]];
    for(i=0;i<steps;i++)
      {
        v = get_vector(ln[i]);
        ln.push( [ln[i][0]+h*v[0],ln[i][1]+h*v[1]]);
      }
    return ln;
}

//--------------------------------------------------------
//A simple Sine function (for test ambiguous cases)
function sin2D(pt){
  return Math.sin(Math.abs(pt[0]-pt[1]));
  // return Math.cos(Math.abs(pt[0]-pt[1]));
  // return Math.sin(Math.abs(pt[0]+pt[1])-400);
  // return Math.cos(Math.abs(pt[0]+pt[1])-400)+1;
}

//--------------------------------------------------------
//Designed colormap
function designed_colormap(fval,fmin,fmax){
  if (fval < 0.5)
  {
    color = [0,100,200,255];  
  }
  else{
    var dx=0.8;
    var fval_nrm = (fval-fmin)/(fmax-fmin);
    var g = (6.0-2.0*dx)*fval_nrm +dx;
    var R = Math.max(0.0,(3.0-Math.abs(g-4.0)-Math.abs(g-5.0))/2.0 );
    var G = Math.max(0.0,(4.0-Math.abs(g-2.0)-Math.abs(g-4.0))/2.0 );
    var B = Math.max(0.0,(3.0-Math.abs(g-1.0)-Math.abs(g-2.0))/2.0 );
    color = [Math.round(Math.cos(R)*255),Math.round(Math.cos(G)*255),Math.round(Math.cos(B)*255),255];
  }
  return color;
}

//--------------------------------------------------------
//Draw contour without interpolation
function draw_contour(canvas,res,threshold,_value,pt_value)
{
  	// draw contour
  	var ctx = canvas.getContext('2d');
  	loc=[0,0];
    for (var y=0;y<res;y++)
     for (var x=0;x<res;x++)
      {
      var avg = pt_value[x*canvas.width/res+canvas.width/(2*res)][y*canvas.height/res+canvas.height/(2*res)];

      ctx.beginPath();
      // only left top vertex >= threshold
      if (_value[x][y]>=threshold&&_value[x+1][y]<threshold&&_value[x][y+1]<threshold&&_value[x+1][y+1]<threshold) 
      {
        var ptx = ((x+1)*canvas.width/res*(_value[x][y]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y]))/(_value[x][y]-_value[x+1][y]); 
        var pty = ((y+1)*canvas.height/res*(_value[x][y]-threshold)+y*canvas.height/res*(threshold-_value[x][y+1]))/(_value[x][y]-_value[x][y+1]);
        ctx.moveTo(ptx, y*canvas.height/res);
        ctx.lineTo(x*canvas.width/res, pty);
      }
      // only left top vertex < threshold
      if (_value[x][y]<threshold&&_value[x+1][y]>=threshold&&_value[x][y+1]>=threshold&&_value[x+1][y+1]>=threshold) 
      {
        var ptx = (x*canvas.width/res*(_value[x+1][y]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y]))/(_value[x+1][y]-_value[x][y]); 
        var pty = (y*canvas.height/res*(_value[x][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x][y]))/(_value[x][y+1]-_value[x][y]);
        ctx.moveTo(ptx, y*canvas.height/res);
        ctx.lineTo(x*canvas.width/res, pty);
      }
      // only right top vertex >= threshold
      if (_value[x][y]<threshold&&_value[x+1][y]>=threshold&&_value[x][y+1]<threshold&&_value[x+1][y+1]<threshold) 
      {
        var ptx = (x*canvas.width/res*(_value[x+1][y]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y]))/(_value[x+1][y]-_value[x][y]); 
        var pty = ((y+1)*canvas.height/res*(_value[x+1][y]-threshold)+y*canvas.height/res*(threshold-_value[x+1][y+1]))/(_value[x+1][y]-_value[x+1][y+1]);
        ctx.moveTo(ptx, y*canvas.height/res);
        ctx.lineTo((x+1)*canvas.width/res, pty);
      }
      // only right top vertex < threshold
      if (_value[x][y]>=threshold&&_value[x+1][y]<threshold&&_value[x][y+1]>=threshold&&_value[x+1][y+1]>=threshold) 
      {
        var ptx = ((x+1)*canvas.width/res*(_value[x][y]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y]))/(_value[x][y]-_value[x+1][y]);
        var pty = (y*canvas.height/res*(_value[x+1][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x+1][y]))/(_value[x+1][y+1]-_value[x+1][y]);
        ctx.moveTo(ptx, y*canvas.height/res);
        ctx.lineTo((x+1)*canvas.width/res, pty);
      }
      // only left bottom vertex >= threshold
      if (_value[x][y]<threshold&&_value[x+1][y]<threshold&&_value[x][y+1]>=threshold&&_value[x+1][y+1]<threshold) 
      {
        var ptx = ((x+1)*canvas.width/res*(_value[x][y+1]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y+1]))/(_value[x][y+1]-_value[x+1][y+1]);
        var pty = (y*canvas.width/res*(_value[x][y+1]-threshold)+(y+1)*canvas.width/res*(threshold-_value[x][y]))/(_value[x][y+1]-_value[x][y]);
        ctx.moveTo(x*canvas.width/res, pty);
        ctx.lineTo(ptx, (y+1)*canvas.height/res);
      }
      // only left bottom vertex < threshold
      if (_value[x][y]>=threshold&&_value[x+1][y]>=threshold&&_value[x][y+1]<threshold&&_value[x+1][y+1]>=threshold) 
      {
        var ptx = (x*canvas.width/res*(_value[x+1][y+1]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y+1]))/(_value[x+1][y+1]-_value[x][y+1]);
        var pty = ((y+1)*canvas.width/res*(_value[x][y]-threshold)+y*canvas.width/res*(threshold-_value[x][y+1]))/(_value[x][y]-_value[x][y+1]);
        ctx.moveTo(x*canvas.width/res, pty);
        ctx.lineTo(ptx, (y+1)*canvas.height/res);
      }
      // only right bottom vertex >= threshold
      if (_value[x][y]<threshold&&_value[x+1][y]<threshold&&_value[x][y+1]<threshold&&_value[x+1][y+1]>=threshold) 
      {
        var ptx = (x*canvas.width/res*(_value[x+1][y+1]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y+1]))/(_value[x+1][y+1]-_value[x][y+1]);
        var pty = (y*canvas.height/res*(_value[x+1][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x+1][y]))/(_value[x+1][y+1]-_value[x+1][y]);
        ctx.moveTo(ptx, (y+1)*canvas.height/res);
        ctx.lineTo((x+1)*canvas.width/res, pty);
      }
      // only right bottom vertex < threshold
      if (_value[x][y]>=threshold&&_value[x+1][y]>=threshold&&_value[x][y+1]>=threshold&&_value[x+1][y+1]<threshold) 
      {
        var ptx = ((x+1)*canvas.width/res*(_value[x][y+1]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y+1]))/(_value[x][y+1]-_value[x+1][y+1]);
        var pty = ((y+1)*canvas.height/res*(_value[x+1][y]-threshold)+y*canvas.height/res*(threshold-_value[x+1][y+1]))/(_value[x+1][y]-_value[x+1][y+1]);
        ctx.moveTo(ptx, (y+1)*canvas.height/res);
        ctx.lineTo((x+1)*canvas.width/res, pty);
      }

      // top vertex >= threshold
      if (_value[x][y]>=threshold&&_value[x+1][y]>=threshold&&_value[x][y+1]<threshold&&_value[x+1][y+1]<threshold) 
      {
      	var pty1 = ((y+1)*canvas.height/res*(_value[x][y]-threshold)+y*canvas.height/res*(threshold-_value[x][y+1]))/(_value[x][y]-_value[x][y+1]);
      	var pty2 = ((y+1)*canvas.height/res*(_value[x+1][y]-threshold)+y*canvas.height/res*(threshold-_value[x+1][y+1]))/(_value[x+1][y]-_value[x+1][y+1]);
        ctx.moveTo(x*canvas.width/res, pty1);
        ctx.lineTo((x+1)*canvas.width/res, pty2);
      }
      // top vertex < threshold
      if (_value[x][y]<threshold&&_value[x+1][y]<threshold&&_value[x][y+1]>=threshold&&_value[x+1][y+1]>=threshold) 
      {
		var pty1 = (y*canvas.height/res*(_value[x][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x][y]))/(_value[x][y+1]-_value[x][y]);
      	var pty2 = (y*canvas.height/res*(_value[x+1][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x+1][y]))/(_value[x+1][y+1]-_value[x+1][y]);
        ctx.moveTo(x*canvas.width/res, pty1);
        ctx.lineTo((x+1)*canvas.width/res, pty2);
      }
      // left vertex >= threshold
      if (_value[x][y]>=threshold&&_value[x+1][y]<threshold&&_value[x][y+1]>=threshold&&_value[x+1][y+1]<threshold) 
      {
      	var ptx1 = ((x+1)*canvas.width/res*(_value[x][y]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y]))/(_value[x][y]-_value[x+1][y]);
      	var ptx2 = ((x+1)*canvas.width/res*(_value[x][y+1]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y+1]))/(_value[x][y+1]-_value[x+1][y+1]);
        ctx.moveTo(ptx1, y*canvas.height/res);
        ctx.lineTo(ptx2, (y+1)*canvas.height/res);
      }
      // left vertex < threshold
      if (_value[x][y]<threshold&&_value[x+1][y]>=threshold&&_value[x][y+1]<threshold&&_value[x+1][y+1]>=threshold) 
      {
      	var ptx1 = (x*canvas.width/res*(_value[x+1][y]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y]))/(_value[x+1][y]-_value[x][y]);
      	var ptx2 = (x*canvas.width/res*(_value[x+1][y+1]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y+1]))/(_value[x+1][y+1]-_value[x][y+1]);
        ctx.moveTo(ptx1, y*canvas.height/res);
        ctx.lineTo(ptx2, (y+1)*canvas.height/res);
      }

      // diag vertex >= threshold
      if (_value[x][y]>=threshold&&_value[x+1][y]<threshold&&_value[x][y+1]<threshold&&_value[x+1][y+1]>=threshold) 
      {
        if (avg>=threshold) 
        {
		  var ptx1 = ((x+1)*canvas.width/res*(_value[x][y]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y]))/(_value[x][y]-_value[x+1][y]); 
          var pty1 = (y*canvas.height/res*(_value[x+1][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x+1][y]))/(_value[x+1][y+1]-_value[x+1][y]);
          ctx.moveTo(ptx1, y*canvas.height/res);
          ctx.lineTo((x+1)*canvas.width/res, pty1);
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#000000';
          ctx.stroke();

          var ptx2 = (x*canvas.width/res*(_value[x+1][y+1]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y+1]))/(_value[x+1][y+1]-_value[x][y+1]);
          var pty2 = (y*canvas.height/res*(_value[x+1][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x+1][y]))/(_value[x+1][y+1]-_value[x+1][y]);
          ctx.beginPath();
          ctx.moveTo(x*canvas.width/res, pty2);
          ctx.lineTo(ptx2, (y+1)*canvas.height/res);
        } 
        else 
        {
          var ptx1 = ((x+1)*canvas.width/res*(_value[x][y]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y]))/(_value[x][y]-_value[x+1][y]); 
          var pty1 = (y*canvas.height/res*(_value[x+1][y+1]-threshold)+y*canvas.height/res*(threshold-_value[x+1][y]))/(_value[x+1][y+1]-_value[x+1][y]);
          ctx.moveTo(ptx1, y*canvas.height/res);
          ctx.lineTo(x*canvas.width/res, pty1);
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#000000';
          ctx.stroke();

		  var ptx2 = (x*canvas.width/res*(_value[x+1][y+1]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y+1]))/(_value[x+1][y+1]-_value[x][y+1]);
          var pty2 = (y*canvas.height/res*(_value[x+1][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x+1][y]))/(_value[x+1][y+1]-_value[x+1][y]);
          ctx.beginPath();
          ctx.moveTo((x+1)*canvas.width/res, pty2);
          ctx.lineTo(ptx2, (y+1)*canvas.height/res);
        }
      }
      // diag vertex < threshold
      if (_value[x][y]<threshold&&_value[x+1][y]>=threshold&&_value[x][y+1]>=threshold&&_value[x+1][y+1]<threshold) 
      {
        if (avg<threshold) 
        {
          var ptx1 = (x*canvas.width/res*(_value[x+1][y]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y]))/(_value[x+1][y]-_value[x][y]);
          var pty1 = ((y+1)*canvas.height/res*(_value[x+1][y]-threshold)+y*canvas.height/res*(threshold-_value[x+1][y+1]))/(_value[x+1][y]-_value[x+1][y+1]);
          ctx.moveTo(ptx1, y*canvas.height/res);
          ctx.lineTo((x+1)*canvas.width/res, pty1);
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#000000';
          ctx.stroke();

          var ptx2 = ((x+1)*canvas.width/res*(_value[x][y+1]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y+1]))/(_value[x][y+1]-_value[x+1][y+1]);
          var pty2 = (y*canvas.height/res*(_value[x][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x][y]))/(_value[x][y+1]-_value[x][y]);
          ctx.beginPath();
          ctx.moveTo(x*canvas.width/res, pty2);
          ctx.lineTo(ptx2, (y+1)*canvas.height/res);
        } 
        else 
        {
          var ptx1 = (x*canvas.width/res*(_value[x+1][y]-threshold)+(x+1)*canvas.width/res*(threshold-_value[x][y]))/(_value[x+1][y]-_value[x][y]);
          var pty1 = ((y+1)*canvas.height/res*(_value[x+1][y]-threshold)+y*canvas.height/res*(threshold-_value[x+1][y+1]))/(_value[x+1][y]-_value[x+1][y+1]);
          var ptx2 = ((x+1)*canvas.width/res*(_value[x][y+1]-threshold)+x*canvas.width/res*(threshold-_value[x+1][y+1]))/(_value[x][y+1]-_value[x+1][y+1]);
          var pty2 = (y*canvas.height/res*(_value[x][y+1]-threshold)+(y+1)*canvas.height/res*(threshold-_value[x][y]))/(_value[x][y+1]-_value[x][y]);
          ctx.moveTo(ptx1, y*canvas.height/res);
          ctx.lineTo(x*canvas.width/res, pty2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#000000';
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo((x+1)*canvas.width/res, pty1);
          ctx.lineTo(ptx2, (y+1)*canvas.height/res);
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
    }
}