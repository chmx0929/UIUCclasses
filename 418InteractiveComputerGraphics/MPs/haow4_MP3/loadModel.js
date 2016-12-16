var teapotVertices =[];
var teapotFaces =[];
var teapotNormals = [];
var texArray =[];
var teapotModel ={
  "vertexPositions" : null,
  "indices" : null,
  "vertexNormals" : null,
  "texture_coords":null};

// cube model function from basic-object-models-IFS.js---------------------------------------------
function cube(side) {
   var s = (side || 1)/2;
   var coords = [];
   var normals = [];
   var texCoords = [];
   var indices = [];
   function face(xyz, nrm) {
      var start = coords.length/3;
      var i;
      for (i = 0; i < 12; i++) {
         coords.push(xyz[i]);
      }
      for (i = 0; i < 4; i++) {
         normals.push(nrm[0],nrm[1],nrm[2]);
      }
      texCoords.push(0,0,1,0,1,1,0,1);
      indices.push(start,start+1,start+2,start,start+2,start+3);
   }
   face( [-s,-s,s, s,-s,s, s,s,s, -s,s,s], [0,0,1] );
   face( [-s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s], [0,0,-1] );
   face( [-s,s,-s, -s,s,s, s,s,s, s,s,-s], [0,1,0] );
   face( [-s,-s,-s, s,-s,-s, s,-s,s, -s,-s,s], [0,-1,0] );
   face( [s,-s,-s, s,s,-s, s,s,s, s,-s,s], [1,0,0] );
   face( [-s,-s,-s, -s,-s,s, -s,s,s, -s,s,-s], [-1,0,0] );
   return {
      vertexPositions: new Float32Array(coords),
      vertexNormals: new Float32Array(normals),
      vertexTextureCoords: new Float32Array(texCoords),
      indices: new Uint16Array(indices)
   }
}

//read text file function from MP3 website----------------------------------------------------------
function readTextFile(file, callbackFunction)
{
    console.log("reading "+ file);
    var rawFile = new XMLHttpRequest();
    var allText = [];
    rawFile.open("GET", file, true);
    
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                callbackFunction(rawFile.responseText);
//                console.log("Got text file!");
                //call start function here to make sure run program after reading text file done
                start();
            }
        }
    }
    rawFile.send(null);
}

//extract data from obj file and divide them into proper array-----------------------------------------
function extractData(context) {
    var temp;
    var lines = context.trim().split("\n");
    for (var i = 0; i < lines.length; i++)
    {
        temp = lines[i].split(/\s+/);
        if (temp[0] == "v")
        {
            teapotVertices.push(parseFloat(temp[1]*2));
            teapotVertices.push(parseFloat(temp[2]*2));
            teapotVertices.push(parseFloat(temp[3]*2));
            texArray.push(parseFloat(temp[1]*2));
            texArray.push(parseFloat(temp[2]*2));
        }
        else if (temp[0] == "f")
        {
            teapotFaces.push(parseInt(temp[1])-1);
            teapotFaces.push(parseInt(temp[2])-1);
            teapotFaces.push(parseInt(temp[3])-1);
        }
    }
    calculateNormals();
    teapotModel.vertexPositions = new Float32Array(teapotVertices);
    teapotModel.indices = new Uint16Array(teapotFaces);
    teapotModel.vertexNormals = new Float32Array(teapotNormals);
    teapotModel.texture_coords = new Float32Array(texArray);
}

//calculate normal-------------------------------------------------------------------------------------
function calculateNormals() {
    for (var i = 0; i < teapotVertices.length; i++)
    {
        teapotNormals.push(0.0);
    }

    for (var i = 0; i < teapotFaces.length; i+=3)
    {
        // load the 3 vertices of a face
        var v_1 = vec3.fromValues(teapotVertices[3*teapotFaces[i]], teapotVertices[3*teapotFaces[i]+1], teapotVertices[3*teapotFaces[i]+2]);
        var v_2 = vec3.fromValues(teapotVertices[3*teapotFaces[i+1]], teapotVertices[3*teapotFaces[i+1]+1], teapotVertices[3*teapotFaces[i+1]+2]);
        var v_3 = vec3.fromValues(teapotVertices[3*teapotFaces[i+2]], teapotVertices[3*teapotFaces[i+2]+1], teapotVertices[3*teapotFaces[i+2]+2]);

        //calculate the normal for the face
        var e_1 = vec3.create(); 
        var e_2 = vec3.create();
        var normal = vec3.create();
        vec3.subtract(e_1, v_3, v_2);
        vec3.subtract(e_2, v_1, v_2);
        vec3.cross(normal, e_1, e_2);
        vec3.normalize(normal, normal);

        //assign this normal to all three vertices
        teapotNormals[3*teapotFaces[i]] += normal[0];
        teapotNormals[3*teapotFaces[i]+1] += normal[1];
        teapotNormals[3*teapotFaces[i]+2] += normal[2];
        teapotNormals[3*teapotFaces[i+1]] += normal[0];
        teapotNormals[3*teapotFaces[i+1]+1] += normal[1];
        teapotNormals[3*teapotFaces[i+1]+2] += normal[2];
        teapotNormals[3*teapotFaces[i+2]] += normal[0];
        teapotNormals[3*teapotFaces[i+2]+1] += normal[1];
        teapotNormals[3*teapotFaces[i+2]+2] += normal[2];
    }
}

//calculate tangent--------------------------------------------------------------------------------------
function calculateTangents(vs, tc, ind){
        var i;
        var tangents = [];
        for(i=0;i<vs.length/3; i++){
            tangents[i]=[0, 0, 0];
        }

        // Calculate tangents
        var a = [0, 0, 0], b = [0, 0, 0];
        var triTangent = [0, 0, 0];
        for(i = 0; i < ind.length; i+=3) {
            var i0 = ind[i+0];
            var i1 = ind[i+1];
            var i2 = ind[i+2];
            
            var pos0 = [ vs[i0 * 3], vs[i0 * 3 + 1], vs[i0 * 3 + 2] ];
            var pos1 = [ vs[i1 * 3], vs[i1 * 3 + 1], vs[i1 * 3 + 2] ];
            var pos2 = [ vs[i2 * 3], vs[i2 * 3 + 1], vs[i2 * 3 + 2] ];

            var tex0 = [ tc[i0 * 2], tc[i0 * 2 + 1] ];
            var tex1 = [ tc[i1 * 2], tc[i1 * 2 + 1] ];
            var tex2 = [ tc[i2 * 2], tc[i2 * 2 + 1] ];

            vec3.subtract(pos1, pos0, a);
            vec3.subtract(pos2, pos0, b);

            var c2c1t = tex1[0] - tex0[0];
            var c2c1b = tex1[1] - tex0[1];
            var c3c1t = tex2[0] - tex0[0];
            var c3c1b = tex2[0] - tex0[1];

            triTangent = [c3c1b * a[0] - c2c1b * b[0], c3c1b * a[1] - c2c1b * b[1], c3c1b * a[2] - c2c1b * b[2]];
    vec3.add(tangents[i0], triTangent);
                vec3.add(tangents[i1], triTangent);
                vec3.add(tangents[i2], triTangent);
        }

        // Normalize tangents
        var ts = [];
        for(i=0;i<tangents.length; i++){
            var tan = tangents[i];
            vec3.normalize(tan);
            ts.push(tan[0]);
            ts.push(tan[1]);
            ts.push(tan[2]);
        }
        
        return ts;
    }
    function CalTangent( index, position, normal, texcoord) {
        var  result=[];
        var tan1 = new Float32Array(position.length);
        var tan2 = new Float32Array(position.length);
        var triangleCount = index.length / 3;
        var vertexCount = position.length / 3;

        for (var a = 0; a < triangleCount; a++) {
            var i1 = index[a * 3];
            var i2 = index[a * 3 + 1];
            var i3 = index[a * 3 + 2];

            var vo1 = i1 * 3, to = i1 * 2;
            var v1x = position[vo1];
            var v1y = position[vo1 + 1];
            var v1z = position[vo1 + 2];
            var w1x = texcoord[to];
            var w1y = texcoord[to + 1];

            var vo2 = i2 * 3;
            to = i2 * 2;
            var v2x = position[vo2];
            var v2y = position[vo2 + 1];
            var v2z = position[vo2 + 2];
            var w2x = texcoord[to];
            var w2y = texcoord[to + 1];

            var vo3 = i3 * 3;
            to = i3 * 2;
            var v3x = position[vo3];
            var v3y = position[vo3 + 1];
            var v3z = position[vo3 + 2];
            var w3x = texcoord[to];
            var w3y = texcoord[to + 1];


            var x1 = v2x - v1x;
            var x2 = v3x - v1x;
            var y1 = v2y - v1y;
            var y2 = v3y - v1y;
            var z1 = v2z - v1z;
            var z2 = v3z - v1z;

            var s1 = w2x - w1x;
            var s2 = w3x - w1x;
            var t1 = w2y - w1y;
            var t2 = w3y - w1y;

            var r = 1 / (s1 * t2 - s2 * t1);
            var sdirx = (t2 * x1 - t1 * x2) * r;
            var sdiry = (t2 * y1 - t1 * y2) * r;
            var sdirz = (t2 * z1 - t1 * z2) * r;

            var tdirx = (s1 * x2 - s2 * x1) * r;
            var tdiry = (s1 * y2 - s2 * y1) * r;
            var tdirz = (s1 * z2 - s2 * z1) * r;

            tan1[vo1] += sdirx;
            tan1[vo1 + 1] += sdiry;
            tan1[vo1 + 2] += sdirz;

            tan1[vo2] += sdirx;
            tan1[vo2 + 1] += sdiry;
            tan1[vo2 + 2] += sdirz;

            tan1[vo3] += sdirx;
            tan1[vo3 + 1] += sdiry;
            tan1[vo3 + 2] += sdirz;

            tan2[vo1] += tdirx;
            tan2[vo1 + 1] += tdiry;
            tan2[vo1 + 2] += tdirz;

            tan2[vo2] += tdirx;
            tan2[vo2 + 1] += tdiry;
            tan2[vo2 + 2] += tdirz;

            tan2[vo3] += tdirx;
            tan2[vo3 + 1] += tdiry;
            tan2[vo3 + 2] += tdirz;
        }

        for (a = 0; a < vertexCount; a++) {
            var vo = a * 3;
            var nx = normal[vo], ny = normal[vo + 1], nz = normal[vo + 2], tan1x = tan1[vo], tan1y = tan1[vo + 1], tan1z = tan1[vo + 2], tan2x = tan2[vo], tan2y = tan2[vo + 1], tan2z = tan2[vo + 2];

            var ndott = nx * tan1x + ny * tan1y + nz * tan1z;

            // Gram-Schmidt orthogonalize
            var rx = tan1x - nx * ndott;
            var ry = tan1y - ny * ndott;
            var rz = tan1z - nz * ndott;

            var len = rx * rx + ry * ry + rz * rz;
            if (len > 0) {
                len = 1 / Math.sqrt(len);
                rx = rx * len;
                ry = ry * len;
                rz = rz * len;
            }

            result[a * 3] = rx;
            result[a * 3 + 1] = ry;
            result[a * 3 + 2] = rz;
            //result[a * 4 + 3] = 0.0; // TODO: Handedness
         }
    return result;
    }