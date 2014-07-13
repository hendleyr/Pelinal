/*	Licensed under The MIT License http://en.wikipedia.org/wiki/MIT_License

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
	to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
	sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	*/

PELINAL.PerlinNoise = function ( seedValue ) {
	// Perlin noise based on Stefan Gustavson's implementation
	this._perm = new Array( 512 );
	this._gradP = new Array( 512 );
	
	this._seed( seedValue || 0 );
	
};

PELINAL.PerlinNoise.prototype = {
	// Perlin noise based on Stefan Gustavson's implementation
	constructor: PELINAL.PerlinNoise,
	
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
		
		val = Math.floor( val );
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


PELINAL.Landmass = function ( position ) {

	var _detail = 128; var landmassX = 33690; var _landmassZ = 33690;
	var _siteCount = 20; 
	var _downShift = 1.5; var _turbulenceAmp = 800; var _turbulenceFreq = 2000;
	
	this._perlin = new PELINAL.PerlinNoise( position.x );
	var voronoi = new Voronoi( position.x );
		
	var sites = [];
	for ( var i = 0; i < _siteCount; ++i ) {
	
		sites.push( { x: Math.random() * _detail, y: Math.random() * _detail } );
	
	}
	// voronoi polygonization is unnecessary?
	// this._diagram = voronoi.compute( sites, {xl: 0, xr: 100, yt: 0, yb: 100 } );
	this._geometry = new THREE.PlaneGeometry( landmassX, _landmassZ, _detail, _detail );
	this._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	
	var heights = new Array( _detail * _detail );
	for ( var i = 0; i < heights.length; ++i ) {
	
		var indexX = i % _detail;
		var indexY = ~~ ( i / _detail );
		var coordX =  indexX ;
		var coordY =  indexY ;
		
		// calculate voronoi height contribution
		var c1Distance = Math.pow( coordX - sites[0].x, 2 ) + Math.pow( coordY - sites[0].y, 2 );
		var c2Distance = Math.pow( coordX - sites[0].x, 2 ) + Math.pow( coordY - sites[0].y, 2 );
		for ( var j = 0; j < sites.length; ++j ) {
			
			var testDistance = this._quickDistance( coordX, coordY, sites[j] );						
			if ( testDistance < c1Distance ) {
				c2Distance = c1Distance;
				c1Distance = testDistance;
			}
		
		}
		var h = ( ( c2Distance - c1Distance ) / _downShift );
		heights[i] = h;
	}
	
	var vertices = this._geometry.vertices.length;
	for ( var k = 0; k < vertices; ++k ) {	
		this._geometry.vertices[k].y = heights[k];
		this._geometry.vertices[k].y+= 200 * this._perlin.perlin2( this._geometry.vertices[k].x / 2000, this._geometry.vertices[k].z / 2000 );
		// this._geometry.vertices[k].y+= 100 * this._perlin.perlin2( this._geometry.vertices[k].x / 100, this._geometry.vertices[k].z / 100 );
		this._geometry.vertices[k].y+= 20 * this._perlin.perlin2( this._geometry.vertices[k].x / 20, this._geometry.vertices[k].z / 20 );
		
		// funky test: clamp heights to regular intervals
		// this._geometry.vertices[k].y = ~~ ( this._geometry.vertices[k].y  / 400 ) * 400;
		
		// perturb straight lines		
		this._geometry.vertices[k].x +=  ( Math.random() * 0.5 + 0.5 ) * _turbulenceAmp * this._perlin.perlin2( this._geometry.vertices[k].x / _turbulenceFreq, this._geometry.vertices[k].z / _turbulenceFreq );
		this._geometry.vertices[k].z +=  ( Math.random() * 0.5 + 0.5 ) * _turbulenceAmp * this._perlin.perlin2( this._geometry.vertices[k].x / _turbulenceFreq, this._geometry.vertices[k].z / _turbulenceFreq );
		
	}
	this._geometry.computeFaceNormals();
	this._geometry.computeVertexNormals();
	this._mesh = new THREE.Mesh( this._geometry, new THREE.MeshLambertMaterial({ 
		color: new THREE.Color( 0xccffaa )
		//wireframe: true
	 }));
	
}

PELINAL.Landmass.prototype = {

	constructor: PELINAL.Landmass,
	_perlin: null, _diagram: null,
	_mesh: null, _geometry: null, position: null,
	
	_quickDistance: function ( x, y, voronoiSite ) {
		
		return Math.pow( x - voronoiSite.x, 2 ) + Math.pow( y - voronoiSite.y, 2 );
		
	}

}