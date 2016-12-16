function Light(name){
	this.id = name;
	this.position = [0.0,0.0,0.0];
	this.ambient = [0.0,0.0,0.0,0.0];
	this.diffuse = [0.0,0.0,0.0,0.0];
	this.specular = [0.0,0.0,0.0,0.0];
}

Light.prototype.setPosition = function(p){
	this.position = p.slice(0);
}
Light.prototype.setDiffuse = function (d){
	this.diffuse = d.slice(0);
}

Light.prototype.setAmbient = function(a){
	this.ambient = a.slice(0);
}

Light.prototype.setSpecular = function(s){
	this.specular = s.slice(0);
}

Light.prototype.setProperty = function(pName, pValue){
	if(typeof pName == 'string'){
		if (pValue instanceof Array){
			this[pName] = pValue.slice(0);
		}
		else {
			this[pName] = pValue;
		}
	}
	else{
		throw 'The property name must be a string';
	}
}

var Lights = {
	list : [],
	add : function(light){
		if (!(light instanceof Light)){
			alert('the parameter is not a light');
			return;
		}
		this.list.push(light);
	},
	
	getArray: function(type){
		var a = [];
		for(var i = 0, max = this.list.length; i < max; i+=1){
			a = a.concat(this.list[i][type]);
		}
		return a;
	},

	get: function(idx){
		if ((typeof idx == 'number') && idx >= 0 && idx < this.list.length){
			return this.list[idx];
		}
		else if (typeof idx == 'string'){
			for(var i=0, max = this.list.length; i < max; i+=1){
				if (this.list[i].id == idx) return this.list[i];
			}
			throw 'Light ' + idx + ' does not exist';
		}
		else {
			throw 'Unknown parameter';
		}
	}
}