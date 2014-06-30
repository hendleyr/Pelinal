var PELINAL = { VERSION: 1.0 };

PELINAL.SkyBox = function ( renderer, camera, texturePath, floorTexturePath ) {
	
	this._renderer = renderer;
	this._scene = new THREE.Scene();
	this._camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 3 );
	this._camera.position.y = 0.1;
	
	if ( floorTexturePath ) {
		this._floorGeometry = new THREE.PlaneGeometry(6, 6);
		this._floorGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
		this._floorGeometry.elementsNeedUpdate = true;
		this._floorGeometry.verticesNeedUpdate = true;
		
		this._floorTexture = THREE.ImageUtils.loadTexture(floorTexturePath, THREE.UVMapping);
		this._floorTexture.wrapS = THREE.RepeatWrapping;
		this._floorTexture.wrapT = THREE.RepeatWrapping;
		this._floorTexture.repeat.set( 10, 10 );
		this._floorMaterial = new THREE.MeshLambertMaterial({
			emissive: new THREE.Color( 0x0067aa ),
			//wireframe: true,
			map: this._floorTexture,
			depthTest: false,
			depthWrite: false,
			side: THREE.DoubleSide
		});
		this._floorMesh = new THREE.Mesh( this._floorGeometry, this._floorMaterial );
		this._scene.add( this._floorMesh );
		//this._scene.add ( new THREE.DirectionalLight( 0xffffff, 1.0 ) )
	}
	
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

	for ( var i = 0; i < 64; i++ ) {
	
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
	this._texture.premultiplyAlpha = true;		// may require tweaking
	this._texture.wrapS = THREE.RepeatWrapping;
	this._texture.wrapT = THREE.RepeatWrapping;
	this._texture.offset = 1.0;
	this._texture.minFilter = THREE.NearestFilter;
	this._texture.magFilter = THREE.NearestFilter;
	
	//UNIFORMS
	this._rephase = new THREE.Vector2( camera.position.x, camera.position.z );
	this._amplitude = amplitude;
	this._frequency = frequency;
	this._uniforms = THREE.UniformsUtils.merge( [ THREE.UniformsLib.lights, {
		rephase: { type: "v2", value: this._rephase },
		amplitude: { type: "f", value: this._amplitude },
		frequency: { type: "f", value: this._frequency },
		time: { type: "f", value: 1.0 },
		diffuse: { type: "c", value: new THREE.Color( 0x0067aa ) },
		opacity: { type: "f", value: 1.0 },
		ambient: { type: "c", value: new THREE.Color( 0x0067aa ) },
		emissive: { type: "c", value: new THREE.Color( 0x000000 ) },
		specular: { type: "c", value: new THREE.Color( 0xffffff ) },
		shininess: { type: "f", value: 5 },
	 } ] );
	this._uniforms.map = { type: "t", value: this._texture };	//workaround for texture id lost in uniforms merge
	 
	//MATERIAL
	this._material = new THREE.ShaderMaterial({
		//transparent: true,
		//blending: THREE.SubtractiveBlending,
		//blendEquation: THREE.AddEquation,
		//blendSrc: THREE.SrcAlphaFactor,
		//blendDst: THREE.OneMinusSrcAlphaFactor,
		skinning: false,
		morphTargets: false,
		morphNormals: false,
		fog: false,
		lights: true,
		uniforms: this._uniforms,
		//shading: THREE.SmoothShading, // todo
		//depthTest: true,
		//depthWrite: true,
		vertexShader: PELINAL.ShaderLib.Ocean.vertexShader,
		fragmentShader: PELINAL.ShaderLib.Ocean.fragmentShader
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
			
				object3d.position.y = 160 + this._amplitude * 
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
		
	},
	
	scroll: function ( position ) {
		
		this._uniforms.rephase.value = new THREE.Vector2( position.x, position.z );
		this._mesh.position.x = position.x;
		this._mesh.position.z = position.z;
		
	}

};