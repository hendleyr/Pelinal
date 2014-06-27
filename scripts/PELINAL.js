var PELINAL = { VERSION: 1.0 };

PELINAL.SkyBox = function ( renderer, camera, texturePath ) {
	
	this._renderer = renderer;
	this._scene = new THREE.Scene();
	this._camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 3 );
	
	this._geometry = new THREE.BoxGeometry( 4, 1, 4 );	// todo: custom skybox geometry
	this._geometry.faces.splice( 4,4 );
	this._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );
	this._geometry.elementsNeedUpdate = true;
	this._geometry.verticesNeedUpdate = true;
	
	this._texture = THREE.ImageUtils.loadTexture(texturePath, THREE.UVMapping);
	this._texture.premultiplyAlpha = true;	// only for PNG
	
	this._material = new THREE.MeshLambertMaterial({
		shading: THREE.FlatShading,
		transparent: true,
		emissive: new THREE.Color( 0xffffff ),
		fog: false,
		map: this._texture,
		depthTest: false,
		depthWrite: false,
		side: THREE.BackSide
	});	
	
	this._mesh = new THREE.Mesh( this._geometry, this._material );
	this._scene.add( this._mesh );
	
	this.proxyCamera = camera;	// use this camera's orientation for rendering
	return this;
	
};

PELINAL.SkyBox.prototype = {

	constructor: PELINAL.SkyBox,
	_renderer: null, _scene: null, _camera: null, 
	_mesh: null, _geometry: null, _material: null, _texture: null, 
	
	proxyCamera: null,
	
	render: function () {
	
		// render scene to default render target (null) with proxy camera and clear color buffer (should always be rendered first)
		this._camera.setRotationFromQuaternion(this.proxyCamera.quaternion);	//three.67
		this._renderer.render( this._scene, this._camera, null, true );
	
	}
	
};


PELINAL.Ocean = function ( renderer, camera, amplitude, frequency, texturePath ) {

	//GEOMETRY
	// tabulated radii for successive LOD rings
	var radii = [ 0, 10, 40, 90, 160, 250, 360, 490, 640, 810, 1000, 1210, 1440, 1690, 1960, 2250, 2560, 2890, 3240, 3610, 4000, 4410, 4840, 5290, 
	5760, 6250, 6760, 7290, 7840, 8410, 9000, 9610, 10240, 10890, 11560, 12250, 12960, 13690, 14440, 15210, 16000, 16810, 17640, 18490, 19360, 
	20250, 21160, 22090, 23040, 24010, 25000, 26010, 27040, 28090, 29160, 30250, 31360, 32490, 33640, 34810, 36000, 37210, 38440, 39690 ];
	
	this._geometry = new THREE.Geometry();
	for( var j = 0; j < 64; j++ ) {	// todo: vertices per LOD ring... 64 seems good though
		
		for ( var i = 0; i < 64; i++ ) {
		
			var angle = ( i * Math.PI * 2.0 ) / 64.0;	// walk along LOD ring's edge until you meet this angle
			var dX = Math.cos( angle );
			var dY = Math.sin( angle );
			
			var vertex = new THREE.Vector3( dX * radii[ j ], 0, dY * radii[ j ] );
			this._geometry.vertices.push( vertex );
			
		}
		
	}

	for ( var i = 0; i < 64+1; i++ ) {
	
		for( var j = 0; j < 64-1; j++ ) {
		
			// walk indices through vertex array
			var index = [	j * 64 + ( i % 64 ), 
									( j+1 ) * 64 + ( i % 64 ), 
									( j+1 ) * 64 + ( ( i+1 ) % 64), 
									j * 64 + ( ( i + 1 ) % 64 )	];
			
			var faceL = new THREE.Face3( index[ 2 ], index[ 1 ], index[ 0 ], new THREE.Vector3( 0,1,0 ) );
			var faceR = new THREE.Face3( index[ 3 ], index[ 2 ], index[ 0 ], new THREE.Vector3( 0,1,0 ) );
			
			this._geometry.faces.push( faceL );
			this._geometry.faces.push( faceR );
			
		}
		
	}	
	this._geometry.elementsNeedUpdate = true;
	this._geometry.verticesNeedUpdate = true;
	
	//TEXTURE
	this._texture = THREE.ImageUtils.loadTexture( texturePath );
	this._texture.premultiplyAlpha = false;		// may require tweaking
	this._texture.wrapS = THREE.RepeatWrapping;
	this._texture.wrapT = THREE.RepeatWrapping;
	this._texture.offset = 1.0;
	this._texture.minFilter = THREE.NearestFilter;
	this._texture.magFilter = THREE.NearestFilter;
	
	//UNIFORMS
	this._amplitude = amplitude;
	this._frequency = frequency;
	this._uniforms = {
		amplitude: { type: "f", value: this._amplitude },
		frequency: { type: "f", value: this._frequency },
		time: { type: "f", value: 1.0 },
		wave: { type: "t", value: this._texture }
	 };
	 
	 //MATERIAL
	 this._material = new THREE.ShaderMaterial({
		uniforms: this._uniforms,
		shading: THREE.SmoothShading, // todo
		depthTest: true,
		depthWrite: true,
		vertexShader:
			[ 	"uniform float amplitude;",
				"uniform float frequency;",
				"uniform float time;",
				"uniform sampler2D wave;",
				//"varying vec3 vColor;",
				"varying vec4 wvLightFront;",
				"varying vec3 triplaneNormal;",
				"varying vec2 xzUv;",

				"void main() {",
				"vec3 lightVector = normalize( vec3( 0.8, .3, 0.0 ) );",
				"vec4 lightColor = vec4( 0.0,0.2,0.5,1.0 );",
				//triplanar mapping
				"xzUv = vec2(position.x, position.z);",
								
				"wvLightFront = vec4(1,1,1,1);",
				"vec4 mvPosition = vec4(position, 1.0);",
				"mvPosition.y = amplitude * ( sin( position.x * frequency - time ) + sin( position.z * frequency - time ) );",
				"triplaneNormal = (cross( vec3(1, amplitude * frequency * cos(time - frequency * mvPosition.x), 0),",
				"							vec3(0, amplitude * frequency * cos(time - frequency * mvPosition.z), 1)));",
				"triplaneNormal = normalize(triplaneNormal);",
				"wvLightFront = -dot( lightVector, normalize(triplaneNormal )) * lightColor;",	// * 
				"mvPosition = modelViewMatrix * mvPosition;",
				"gl_Position = projectionMatrix * mvPosition;",
				"}"
			].join("\n"),
		fragmentShader: 
			[	"uniform float time;",
				"uniform sampler2D wave;",
				"varying vec4 wvLightFront;",
				"varying vec3 triplaneNormal;",
				"varying vec2 xzUv;",
				
				"void main() {",
				//"	gl_FragColor =  wvLightFront;",		//simple shading				
				
				"vec2 xz = vec2(xzUv.x + time*300.0, xzUv.y);",
				"xz = fract(xz/5000.0);",
								"gl_FragColor = ( texture2D( wave, xz ) ) * wvLightFront * vec4(2.8,2.8,2.8,1);",
				// "gl_FragColor = (trip.x * texture2D(wave, yz))",		//dead 3planar mapping
				// "		+ (trip.y * texture2D(wave, xz));",
				// "		+ (trip.z * texture2D(wave, xy));",
				"}"	
			].join("\n")
	 });
	
	//MESH
	this._mesh = new THREE.Mesh( this._geometry, this._material );
	
	this.floatingObjects = [];
	return this;
	
};

PELINAL.Ocean.prototype = {
	
	constructor: PELINAL.Ocean,
	_mesh: null, _geometry: null, _material: null, _uniforms: null, _texture: null, 
	_amplitude: 0, _frequency: 0, _phase: 0, _time: 0,
	
	floatingObjects: null,

	floatObject: function ( object3d ) {
	
		this.floatingObjects.push( object3d );
	
	},
	unfloatObject: function ( object3d ) {
	
		var index = this.floatingObjects.indexOf( object3d );
		if ( index === -1 ) {
			console.log( "Can't unfloat object; not found.", object3d );
		}
		else {
			this.floatingObjects.splice( index, 1 );
		}
	
	},
	
	animate: function ( delta ) {
		
		this._uniforms.time.value += 0.8 * delta;
		
		//displace floating objects
		this.floatingObjects.forEach( function ( object3d ) {
			if ( object3d instanceof THREE.Camera ) {
			
				object3d.position.y = 80 + this._amplitude * 
					( Math.sin( object3d.position.x * this._frequency - this._uniforms.time.value ) 
					+ Math.sin( object3d.position.z * this._frequency - this._uniforms.time.value ) );
					
			}
			else if ( object3d instanceof THREE.Object3D ) {
				//todo... would be nice to tilt based on wave normal
				object3d.position.y = 10 + this._amplitude * 
					( Math.sin( object3d.position.x * this._frequency - this._uniforms.time.value ) 
					+ Math.sin( object3d.position.z * this._frequency - this._uniforms.time.value ) );
					
			}
		}, this );
		
	}

};