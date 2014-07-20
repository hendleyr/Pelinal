/*	Licensed under The MIT License http://en.wikipedia.org/wiki/MIT_License

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
	to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
	sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	*/

PELINAL.PerlinGenerator = function ( seedValue ) {
	// Perlin noise based on Stefan Gustavson's implementation
	this._perm = new Array( 512 );
	this._gradP = new Array( 512 );
	
	this._seed( seedValue || 0 );
	
};

PELINAL.PerlinGenerator.prototype = {
	// Perlin noise based on Stefan Gustavson's implementation
	constructor: PELINAL.PerlinGenerator,
	
	// cube and midpoints gradients
	_grad3 : [	{ x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: -1, y: -1, z: 0 },
						{ x: 1, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: -1 },
						{ x: 0, y: 1, z: 1 }, { x: 0, y: -1, z: 1 }, { x: 0, y: 1, z: -1 }, { x: 0, y: -1, z: -1 }	],	
	_p: [	151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
				8,99,37,240,21,10,23,190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
				35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,
				134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
				55,46,245,40,244,102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,
				18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,
				226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,
				17,182,189,28,42,223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,
				167, 43,172,9,129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,
				246,97,228,251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,
				14,239,107,49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127,4,
				150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180	],
	_perm: [], _gradP: [],
	
	_seed: function ( val ) {
	
		if ( val > 0 && val < 1 ) {
			// scale val up
			val *= 65536;
		
		}
		
		//val = Math.floor( val );
		val = ~~ val;
		if ( val < 256 ) {
		
			val |= val << 8;
		
		}
		
		for ( var i = 0; i < 256; ++i ) {
		
			var v;
			if ( i & 1 ) {
				v = this._p[i] ^ ( val & 255 );
			} else {
				v = this._p[i] ^ ( ( val >> 8 ) & 255 );
			}
			
			this._perm[i] = this._perm[ i + 256 ] = v;
			this._gradP[i] = this._gradP[ i + 256 ] = this._grad3[ v % 12 ];
		
		}
	
	},
	
	perlin2: function ( x, y ) {
	
		var cellX = Math.floor( x );
		var cellY = Math.floor( y );
		
		var unitX = x - cellX;
		var unitY = y - cellY;
	
		cellX = cellX & 255;
		cellY = cellY & 255;
		
		var n00 = this._dot2( this._gradP[ cellX + this._perm[ cellY ] ],  unitX, unitY );
		var n01 = this._dot2( this._gradP[ cellX + this._perm[ cellY + 1] ],  unitX, unitY - 1 );
		var n10 = this._dot2( this._gradP[ cellX + 1 + this._perm[ cellY ] ],  unitX - 1, unitY );
		var n11 = this._dot2( this._gradP[ cellX + 1 + this._perm[ cellY + 1] ], unitX - 1, unitY - 1 );
				
		var fadeCurve = this._fade( unitX );
		
		return this._lerp( 
			this._lerp( n00, n10, fadeCurve ), 
			this._lerp( n01, n11, fadeCurve ),
			this._fade( unitY )
		);
	
	},
	
	_dot2: function ( gradient, x, y ) {
	
		return gradient.x * x + gradient.y * y;
	
	},
	
	_fade: function ( t ) {
		
		return t * t * t * ( t * ( t * 6 - 15 ) + 10 );
	
	},
	
	_lerp: function ( a, b, t ) {
	
		return ( 1 - t ) * a + t * b;
	
	}

};


PELINAL.FortuneVoronoi = function ( sites, xLeft, xRight, yTop, yBottom ) {

	this._voronoi = new Voronoi();
	this._diagram = this._voronoi.compute( sites, { xl: xLeft, xr: xRight, yt: yTop, yb: yBottom } );
	
};

PELINAL.FortuneVoronoi.prototype = {
	
	constructor: PELINAL.FortuneVoronoi,
	_voronoi: null, _diagram: null
	
}


PELINAL.Landmass = function ( position, cliffTexturePath, sandTexturePath, grassTexturePath, scene ) {
	// TEXTURES
	this._cliffTexture = THREE.ImageUtils.loadTexture( cliffTexturePath );
	this._cliffTexture.wrapS = THREE.RepeatWrapping;
	this._cliffTexture.wrapT = THREE.RepeatWrapping;
	this._cliffTexture.minFilter = THREE.NearestFilter;
	this._cliffTexture.magFilter = THREE.NearestFilter;
	
	this._sandTexture = THREE.ImageUtils.loadTexture( sandTexturePath );
	this._sandTexture.wrapS = THREE.RepeatWrapping;
	this._sandTexture.wrapT = THREE.RepeatWrapping;
	this._sandTexture.minFilter = THREE.NearestFilter;
	this._sandTexture.magFilter = THREE.NearestFilter;
	
	this._grassTexture = THREE.ImageUtils.loadTexture( grassTexturePath );
	this._grassTexture.wrapS = THREE.RepeatWrapping;
	this._grassTexture.wrapT = THREE.RepeatWrapping;
	this._grassTexture.minFilter = THREE.NearestFilter;
	this._grassTexture.magFilter = THREE.NearestFilter;

	// UNIFORMS
	this._uniforms = THREE.UniformsUtils.merge( [ THREE.UniformsLib.lights, {
		diffuse: { type: "c", value: new THREE.Color( 0x0067aa ) },
		// opacity: { type: "f", value: 1.0 },
		ambient: { type: "c", value: new THREE.Color( 0x0067aa ) },
		emissive: { type: "c", value: new THREE.Color( 0xffffff ) },
		specular: { type: "c", value: new THREE.Color( 0xffffff ) },
		shininess: { type: "f", value: 5 },
	 } ] );
	this._uniforms.cliffMap = { type: "t", value: this._cliffTexture };	//workaround for texture id lost in uniforms merge
	this._uniforms.sandMap = { type: "t", value: this._sandTexture };	//workaround for texture id lost in uniforms merge
	this._uniforms.grassMap = { type: "t", value: this._grassTexture };	//workaround for texture id lost in uniforms merge
	
	// MATERIAL
	this._material = Physijs.createMaterial(
		new THREE.ShaderMaterial({
			skinning: false,
			morphTargets: false,
			morphNormals: false,
			fog: false,
			lights: true,
			uniforms: this._uniforms,
			//shading: THREE.SmoothShading, // todo
			depthTest: true,
			depthWrite: true,
			vertexShader: PELINAL.ShaderLib.Landmass.vertexShader,
			fragmentShader: PELINAL.ShaderLib.Landmass.fragmentShader
		 }),
		0.9, // friction
		0.01 // restitution
	);

	// ad hoc tweakabe settings
	var _detail = 128; var landmassX = 33690; var _landmassZ = 33690;
	var _siteCount = 10;
	var _perlinFrequencies = [ 2, 4, 8 ];
	var _stepArity = 2;
	var _turbulenceAmp = 800; var _turbulenceFreq = 2000;
	
	this._perlin = new PELINAL.PerlinGenerator( position.x );
	
	this._geometry = new THREE.PlaneGeometry( landmassX, _landmassZ, _detail - 1, _detail - 1 );	
	this._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	
	var voronoiHeightMap = this._generateVoronoi( _detail, _siteCount );
	var perlinHeightMap = this._generatePerlin( _detail, _perlinFrequencies );
	
	// combine heightmaps
	var combinedHeightMap = new Float32Array( _detail * _detail );
	for ( var i = 0; i < combinedHeightMap.length; ++i ) {	// todo: heuristic for combining voronoi and perlin?
		combinedHeightMap[i] = ( voronoiHeightMap[i] * 4 / 5) + ( perlinHeightMap[i] * 1 / 5 );
		// combinedHeightMap[i] = ( voronoiHeightMap[i] * 2 / 3 ) + ( perlinHeightMap[i] * 1 / 3 );
	}
	this._normalizeHeightMap( combinedHeightMap );
	//todo: erosion
	this._stepWiseClampHeightMap( combinedHeightMap, _stepArity );
	this._tuckHeightMap( combinedHeightMap, _detail, 60 );
	// this._convoluteHeightMap( combinedHeightMap, _detail, 0.25 ); //todo: my convolution filter sucks	
	
	var vertices = this._geometry.vertices.length; var fk = [];
	for ( var k = 0; k < vertices; ++k ) {
		this._geometry.vertices[k].y = 10000 * combinedHeightMap[k];
		
		// perturb straight lines. somewhat artificial
		this._geometry.vertices[k].x +=  ( Math.random() * 0.5 + 0.5 ) * _turbulenceAmp * this._perlin.perlin2( this._geometry.vertices[k].x / _turbulenceFreq, this._geometry.vertices[k].z / _turbulenceFreq );
		this._geometry.vertices[k].z +=  ( Math.random() * 0.5 + 0.5 ) * _turbulenceAmp * this._perlin.perlin2( this._geometry.vertices[k].x / _turbulenceFreq, this._geometry.vertices[k].z / _turbulenceFreq );
		
	}
	
	this._geometry.computeFaceNormals();
	this._geometry.computeVertexNormals();
	this._mesh = new Physijs.HeightfieldMesh( this._geometry, this._material, 0 ); // mass 0
	
	// this.octree = new THREE.Octree({
		// scene: scene,
		// undeferred: true,
		// set the max depth of tree
		// depthMax: 4,
		// max number of objects before nodes split or merge
		// objectsThreshold: 512,
		// percent between 0 and 1 that nodes will overlap each other
		// helps insert objects that lie over more than one node
		// overlapPct: 0.1
	// });
	// this.octree.add( this._mesh, { useFaces: true } );
	// this.octree.update();
	
}

PELINAL.Landmass.prototype = {

	constructor: PELINAL.Landmass,
	_perlin: null, _diagram: null,
	_mesh: null, _geometry: null, position: null,
	_material: null, _uniforms: null, _cliffTexture: null, _sandTexture: null,
	
	fnFixPhysijs: function () {
	
		for ( var i = 0; i < this._geometry.length; ++i ) {
	
			var temp = this._geometry.vertices[i].y;
			this._geometry.vertices[i].y = this._geometry.vertices[i].z;
			this._geometry.vertices[i].z = temp;
		
		}
		this._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
		this._geometry.verticesNeedUpdate = true;
	
	},
	
	// octree: null,
	
	_quickDistance: function ( x, y, site ) {
		
		return Math.pow( x - site.x, 2 ) + Math.pow( y - site.y, 2 );
		
	},
	
	_normalizeHeightMap: function ( heightMap ) {
	
		var maxHeight = 0;
		var rounds = heightMap.length;
		for ( var i = 0; i < rounds; ++i ) {
			if ( Math.abs( heightMap[i] ) > maxHeight ) { 
				maxHeight = Math.abs( heightMap[i] ); 
			}
		}
		for ( var i = 0; i < rounds; ++i ) {
			heightMap[i] /= maxHeight;
		}
	
	},	
	
	_stepWiseClampHeightMap: function ( heightMap, stepArity ) {
		//todo: heuristic for deciding step heights?
		var rounds = heightMap.length;
		for ( var i = 0; i < rounds; ++i ) {
			// height map must be normalized to [ -1, 1 ] 
			heightMap[i] = ~~ ( heightMap[i] * 100 / stepArity ) * stepArity / 100;
		
		}
	
	},
	
	_tuckHeightMap: function ( heightMap, detail, tuckRadius ) {
		// fades edges/corners to a base height if outside a certain radius
		var rounds = heightMap.length;
		var radius = detail / 2;
		for ( var i = 0; i < rounds; ++i ) {
		
			var x = i % detail - radius;
			var y = ~~ ( i / detail ) - radius;
			var d = Math.sqrt( Math.pow( x, 2 ) + Math.pow( y, 2 ) );
			
			if ( d > tuckRadius ) {
			
				// var newHeight = ( heightMap[i] * Math.max( 0, ( radius - d ) ) / radius ) - 0.1 * ( d - tuckRadius ) / radius;
				heightMap[i] = ( heightMap[i] * Math.max( 0, ( radius - d ) ) / radius );
				heightMap[i] -= 0.1 * ( d - tuckRadius ) / tuckRadius ;
					
			}
			else {
				
				heightMap[i] -= 0.1 * ( d - tuckRadius ) / tuckRadius ;
				
			}
		
		}
	
	},
	
	_convoluteHeightMap: function ( heightMap, detail, strength ) {
		
		// for each point in heightMap, displace it along x and y by some value from a continuous function ( let's try perlin )
		var rounds = heightMap.length;
		for ( var i = 0; i < rounds; ++i ) {
		
			var x = i % detail;
			var y = ~~ ( i / detail );
			var delta = strength * this._perlin.perlin2( x - 0.5, y - 0.5 );
			var dx = ( x + delta );// * detail;
			var dy = ( y + delta );// * detail;
			
			var xMin = ~~ dx;
			var xMax = xMin + 1;
			var xFrac = dx - xMin;
			
			var yMin = ~~ dy;
			var yMax = yMin + 1;
			var yFrac = dy - yMin;
			
			var lowMix =  ( 1 - xFrac ) * heightMap[ ( xMin & 127 ) + ( yMin & 127 ) * detail ] + xFrac * heightMap[ ( xMax & 127 ) + ( yMin & detail ) ];
			var highMix = ( 1 - xFrac ) * heightMap[ ( xMin & 127 ) + ( yMax & 127 ) * detail ] + xFrac * heightMap[ ( xMax & 127 ) + ( yMax & detail ) ];
			var centroidMix = ( 1 - yFrac ) * lowMix + yFrac * highMix;
		
			heightMap[i] = centroidMix;
			// ( 1 - t ) * a + t * b;
			
			//var mix = 0.5 * heightMap[i] + 0.5 * heightMap[target];
		
			// var temp = heightMap[ target ];
			// heightMap[ target ] = heightMap[i];
			// heightMap[i] = temp;
			// heightMap[i] = mix;
		
		}
		// return heightMap;
		
	},
	
	_generateVoronoi: function ( detail, siteCount ) {

		// must generate at least two sites
		var sites = [];
		for ( var i = 0; i < siteCount; ++i ) {
		
			sites.push( { x: Math.random() * detail * 0.8 + ( 0.2 * detail ), y: Math.random() * detail * 0.8 + ( 0.2 * detail ) } );
		
		}
		
		var sampleCount = detail * detail;
		var voronoiHeightMap = new Float32Array( sampleCount );
		for ( var i = 0; i < sampleCount; ++i ) {
		
			var x = i % detail;
			var y = ~~ ( i / detail );
			
			// calculate voronoi height contribution
			var c1Distance = Math.pow( x - sites[0].x, 2 ) + Math.pow( y - sites[0].y, 2 );
			var c2Distance = Math.pow( x - sites[1].x, 2 ) + Math.pow( y - sites[1].y, 2 );
			
			for ( var j = 1; j < sites.length; ++j ) {
				// we can skip first iteration because c1 and c2 were preloaded
				var testDistance = this._quickDistance( x, y, sites[j] );
				if ( testDistance < c1Distance ) {
					c2Distance = c1Distance;
					c1Distance = testDistance;
				}
				else if ( testDistance < c2Distance && testDistance > c1Distance ) {
					c2Distance = testDistance;
				}
			
			}
			
			voronoiHeightMap[i] = ( c2Distance - c1Distance );
			
		}
		
		this._normalizeHeightMap( voronoiHeightMap );
		return voronoiHeightMap;
	
	},
	
	_generatePerlin: function ( detail, frequencies ) {
	
		var sampleCount = detail * detail;
		var perlinHeightMap = new Float32Array( sampleCount );
		var frequencyRounds = frequencies.length;
		
		for ( var i = 0; i < sampleCount; ++i ) {
		
			var x = ( i % detail ) + 0.5;
			var y = ~~ ( i / detail ) + 0.5;
		
			for ( var j = 0; j < frequencyRounds; ++j ) {
			
				perlinHeightMap[i] += frequencies[j] * this._perlin.perlin2( x / frequencies[j] / 2, y / frequencies[j] / 2 );
				
			}
		
		}
		
		this._normalizeHeightMap( perlinHeightMap );
		return perlinHeightMap;
	
	},
	
	_cleanup: function () {
	
		delete this._perlin;
	
	}

}