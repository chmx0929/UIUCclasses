//-------------------------------------------------------
// Global variables
var x_extent=[-1.0,1.0];
var y_extent=[-1.0,1.0];

//------------------------------------------------------
//MAIN
function main() {
  render();
}

//--Function: render-------------------------------------
//Main drawing function
function render(canvas){
  var L = parseFloat(document.getElementById("L").value);
  var K = parseFloat(document.getElementById("K").value);
  var G = parseFloat(document.getElementById("G").value);
  var color_func = greyscale_map;
  if (document.getElementById("color").checked)
    color_func = rainbow_colormap;
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

  // Store whole image noise data
  var pt_noise = (function()
  {
    var array = [];
    for(var y = 0; y != (canvas.width+1); y++) { array[y] = new Float32Array(canvas.height+1); }
      return array;
  })();

  var pt_lic = (function()
  {
    var array = [];
    for(var y = 0; y != (canvas.width+1); y++) { array[y] = new Float32Array(canvas.height+1); }
      return array;
  })();

  for (var y=0;y<canvas.height;y++){
  	for (var x=0;x<canvas.width;x++)
    {
      pt_noise[x][y] = Math.random();
    }
  }

  for (var y=0;y<canvas.height;y++){
    for (var x=0;x<canvas.width;x++)
    {
      var h = 5.0*(x_extent[1]-x_extent[0])/canvas.width;
      var steps = L;
      var pixel = [x,y];
      var numerator = 0.0;
      var denominator = 0.0;
      var pt_pixel = pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x,y);
      var linpts_forward = euler_integration(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x,y),h,steps,gaussian_gradient);
      var linpts_backward = euler_integration(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x,y),h,steps,gaussian_gradient_backward);

      var temp_forward = 0.0;
      var temp_backward = 0.0;
      var distances_backward = new Float32Array(steps);
      var distances_forward = new Float32Array(steps);
      distances_backward[0]=0.0;
      distances_forward[0]=0.0;
      for (var i = 0; i < steps-1; i++) {
        temp_backward = temp_backward + distance(linpts_backward[i],linpts_backward[i+1]);
        temp_forward = temp_forward + distance(linpts_backward[i],linpts_forward[i+1]);
        distances_backward[i+1]=temp_backward;
        distances_forward[i+1]=temp_forward;
      }

      for (var i = 0; i < steps; i++) {
        var pixel_backward = pt2pixel(canvas.width,canvas.height,x_extent,y_extent,linpts_backward[i][0],linpts_backward[i][1]);
        var pixel_forward = pt2pixel(canvas.width,canvas.height,x_extent,y_extent,linpts_forward[i][0],linpts_forward[i][1]);
        var weight_backward = Math.exp(-Math.pow(distances_backward[i],2));
        var weight_forward = Math.exp(-Math.pow(distances_forward[i],2));

        if (pixel_backward[0]<0||pixel_backward[0]>canvas.width||pixel_backward[1]<0||pixel_backward[1]>canvas.height||pixel_forward[0]<0||pixel_forward[0]>canvas.width||pixel_forward[1]<0||pixel_forward[1]>canvas.height) {
          numerator = numerator + weight_backward * Math.random() + weight_forward * Math.random();
        }else{
          numerator = numerator + weight_backward * pt_noise[pixel_backward[0]][pixel_backward[1]] + weight_forward * pt_noise[pixel_forward[0]][pixel_forward[1]];
        }
        denominator = denominator + weight_backward + weight_forward;
      }
      numerator = numerator - pt_noise[x][y]; // substract weight(1) * target pixel noise since euler_integration calculate twice(backward,forward)
      denominator = denominator - 1; // substract target pixel weight(1) since euler_integration calculate twice(backward,forward)
      pt_lic[x][y] = numerator/denominator;
    }
  }
  var mn_temp = 256;
  var mx_temp = -256;
  for (var y=0;y<canvas.height;y++)
    for (var x=0;x<canvas.width;x++)
    {
      var grad = gaussian_gradient(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x,y));
      var fval = Math.sqrt(Math.pow(grad[0],2)+Math.pow(grad[1],2));
      if (fval < mn_temp)
        mn_temp=fval;
      if (fval>mx_temp)
        mx_temp=fval;
  }

  var mn = pt_noise[0][0];
  var mx = mn;
  for (var y=0;y<canvas.height;y++)
    for (var x=0;x<canvas.width;x++)
    {
      var fval = pt_noise[x][y];
      if (fval < mn)
        mn=fval;
      if (fval>mx)
        mx=fval;
  }

  for (var y=0;y<canvas.height;y++){
    for (var x=0;x<canvas.width;x++)
    {
      if (document.getElementById("color").checked){
        color_func = rainbow_colormap;
        var grad = gaussian_gradient(pixel2pt(canvas.width,canvas.height,x_extent,y_extent,x,y));
        var temp = Math.sqrt(Math.pow(grad[0],2)+Math.pow(grad[1],2));
        var color = color_func(temp,mn_temp,mx_temp);
        i = (y*canvas.width + x)*4
        imgData.data[i]=color[0]*pt_lic[x][y];
        imgData.data[i+1]= color[1]*pt_lic[x][y];
        imgData.data[i+2]= color[2]*pt_lic[x][y];
        imgData.data[i+3]= color[3];
      }else{
        var color = color_func(pt_lic[x][y],mn,mx);
        i = (y*canvas.width + x)*4
        imgData.data[i]=color[0];
        imgData.data[i+1]= color[1];
        imgData.data[i+2]= color[2];
        imgData.data[i+3]= color[3];
      }
    }
  }

	ctx.putImageData(imgData,0,0);
  if (document.getElementById("hedgehog").checked){
    draw_glyphs(K,G,gaussian_gradient,canvas);
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

//--------------------------------------------------------
function distance(pt1,pt2){
  return Math.sqrt(Math.pow(pt1[0]-pt2[0],2)+Math.pow(pt1[1]-pt2[1],2));
}

//--------------------------------------------------------
function greyscale_map(fval,fmin,fmax){
  var c=255*((fval-fmin)/(fmax-fmin));
  var color = [Math.round(c),Math.round(c),Math.round(c),255];
  return color;
}

//--------------------------------------------------------
function gaussian(pt){
  return Math.exp(-(pt[0]*pt[0]+pt[1]*pt[1]));
}

//--------------------------------------------------------
function gaussian_gradient(pt){
  var dx = -2*pt[0]*gaussian(pt);
  var dy = -2*pt[1]*gaussian(pt);
  return [dx,dy];
}

//--------------------------------------------------------
function gaussian_gradient_backward(pt){
  var dx = 2*pt[0]*gaussian(pt);
  var dy = 2*pt[1]*gaussian(pt);
  return [dx,dy];
}

//--------------------------------------------------------
function euler_integration(pt,h,steps,get_vector)
{
  var ln=[[pt[0],pt[1]]];
  for(i=0;i<steps;i++)
    {
      v = get_vector(ln[i]);
      if (get_vector==gaussian_gradient) {
        ln.push([ln[i][0]+h*v[0],ln[i][1]+h*v[1]]);
      }else{
        ln.push([ln[i][0]-h*v[0],ln[i][1]-h*v[1]]);
      }
    }
  return ln;
}

//--------------------------------------------------------
function draw_glyphs(K,G,vec_func,canvas){
  delta_x = canvas.width/G;
  delta_y = canvas.height/G;
  for (var i=0;i<G;i++)
    for(var j=0;j<G;j++)
      {
       if (document.getElementById("random").checked){
       		pix = [Math.round(Math.random()*canvas.width),Math.round(Math.random()*canvas.height)];
       }else{
       		pix = [i*delta_x,j*delta_y];
       }
       var pt = pixel2pt(canvas.width,canvas.height,x_extent,y_extent,pix[0],pix[1]);
       var grad = vec_func(pt);

       var dest =[pt[0]+grad[0],pt[1]+grad[1]]
       var pixdest = pt2pixel(canvas.width,canvas.height,x_extent,y_extent,dest[0],dest[1]);

       // Scale
       pixdest[0]=pix[0]+((pixdest[0]-pix[0])*K);
       pixdest[1]=pix[1]+((pixdest[1]-pix[1])*K);

       var ctx = canvas.getContext('2d');

       ctx.beginPath();
       ctx.moveTo(pix[0], pix[1]);
       ctx.lineTo(pixdest[0],pixdest[1]);
       ctx.lineWidth = 1;
       ctx.strokeStyle = '#FF0000';
       ctx.stroke();
      }
}

//---------------------------------------------------------
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