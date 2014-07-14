/*	Licensed under The MIT License http://en.wikipedia.org/wiki/MIT_License

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
	to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
	sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	*/

var PELINAL = { VERSION: 0.1 };
var PI_2 = Math.PI / 2;

PELINAL.Menu = function ( blockerId, instructionsId, controls ) {

	if ( controls  instanceof Object ) {
		this._controls = controls;
	} else {
		console.warn( "Must initialize menu with an existing controls object." );
	}

	this._hasPointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

	this._blockerElement = document.getElementById( blockerId );
	this._instructionsElement = document.getElementById( instructionsId );
	this._lockElement = document.body; // maybe customizable
	this._lockElement.requestPointerLock = this._lockElement.requestPointerLock || this._lockElement.mozRequestPointerLock || this._lockElement.webkitRequestPointerLock;

	if ( this._hasPointerLock ) {

		this._lockElement = document.body;
		document.addEventListener( 'pointerlockchange', this.pointerLockChange.bind( this ), false );
		document.addEventListener( 'mozpointerlockchange', this.pointerLockChange.bind( this ), false );
		document.addEventListener( 'webkitpointerlockchange', this.pointerLockChange.bind( this ), false );

		document.addEventListener( 'pointerlockerror', this.pointerLockError.bind( this ), false );
		document.addEventListener( 'mozpointerlockerror', this.pointerLockError.bind( this ), false );
		document.addEventListener( 'webkitpointerlockerror', this.pointerLockError.bind( this ), false );

		this._instructionsElement.addEventListener( 'click', this.pointerLockOn.bind( this ), false );

	} else {

		this._instructionsElement.innerHTML = 'Your browser doesn\'t seem to support the pointer lock API.&nbsp;'
			+ 'For the best experience, please enjoy with <a href="https://www.google.com/intl/en-US/chrome/browser/">Chrome</a>.';

	}
	//TODO - save/load, drag+drop events, file upload

}

PELINAL.Menu.prototype = {

	constructor: PELINAL.Menu,
	_lockElement: null, _hasPointerLock: false, _blockerElement: null, _instructionsElement: null,
	_controls: null,

	pointerLockOn: function ( event ) {

		this._instructionsElement.style.display = 'none';
		this._lockElement.requestPointerLock();

	},

	pointerLockChange: function ( event ) {

		if ( document.pointerLockElement === this._lockElement || document.mozPointerLockElement === this._lockElement || document.webkitPointerLockElement === this._lockElement ) {

			if ( this._controls.enable ) { this._controls.enable(); }
			this._blockerElement.style.display = 'none';

		} else {

			if ( this._controls.disable ) { this._controls.disable(); }

			this._blockerElement.style.display = '-webkit-box';
			this._blockerElement.style.display = '-moz-box';
			this._blockerElement.style.display = 'box';
			this._instructionsElement.style.display = '';

		}

	},

	pointerLockError: function ( event ) { this._instructionsElement.style.display = ''; }

}


PELINAL.FirstPersonControls = function ( camera ) {

	camera.rotation.set( 0, 0, 0 );
	camera.rotation.order = "YXZ";	// we'll never rotate around Z, so this keeps things very simple //todo: understand quaternions

	this._camera = camera;
	this._isEnabled = false;
	this._velocity = new THREE.Vector3( 0, 0, 0 );

	document.addEventListener( 'mousemove', this.onMouseMove.bind( this ), false );
	document.addEventListener( 'keydown', this.onKeyDown.bind( this ), false );
	document.addEventListener( 'keyup', this.onKeyUp.bind( this ), false );

}

PELINAL.FirstPersonControls.prototype = {

	constructor: PELINAL.FirstPersonControls,
	_camera: null, _velocity: null,
	_isEnabled: false, _isMovingForward: false, _isMovingLeft: false, _isMovingBackward: false, _isMovingRight: false,
	_friction: 10, _moveSpeed: 6400 * 4,
	_sensitivity: 0.002,
	_forwardKey: 87,		// w
	_leftKey: 65,			// a
	_backwardKey: 83,	// s
	_rightKey: 68,			// d


	update: function ( delta ) {

		if ( this._isEnabled === false ) { return; }
		// todo: will need to check collisions etc later
		this._velocity.x -= this._velocity.x * this._friction * delta;
		this._velocity.z -= this._velocity.z * this._friction * delta;


		if ( this._isMovingForward ) { this._velocity.z -= this._moveSpeed * delta; }
		if ( this._isMovingBackward ) { this._velocity.z += this._moveSpeed * delta; }

		if ( this._isMovingLeft ) { this._velocity.x -= this._moveSpeed * delta; }
		if ( this._isMovingRight ) { this._velocity.x += this._moveSpeed * delta; }
		
		this._camera.translateX( this._velocity.x * delta );
		this._camera.translateZ( this._velocity.z * delta );

	},
	
	enable: function () { this._isEnabled = true; },
	disable: function () { this._isEnabled = false; },

	onMouseMove: function ( event ) {

		if ( this._isEnabled === false ) { return; }

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		this._camera.rotation.y -= movementX * this._sensitivity;
		this._camera.rotation.x -= movementY * this._sensitivity;
		this._camera.rotation.x = Math.max( - PI_2, Math.min( PI_2, this._camera.rotation.x ) );	// clamp pitch to up/down vectors

	},

	onKeyDown: function ( event ) {

		switch( event.keyCode ) {

			case 87: // w
				this._isMovingForward = true;
				break;

			case 65: // a
				this._isMovingLeft = true;
				break;

			case 83: // s
				this._isMovingBackward = true;
				break;

			case 68: // d
				this._isMovingRight = true;
				break;

		}

	},

	onKeyUp: function ( event ) {

			switch( event.keyCode ) {

			case 87: // w
				this._isMovingForward = false;
				break;

			case 65: // a
				this._isMovingLeft = false;
				break;

			case 83: // s
				this._isMovingBackward = false;
				break;

			case 68: // d
				this._isMovingRight = false;
				break;

		}

	}

}


PELINAL.SkyBox = function ( renderer, camera, cloudTexturePath, cloudParticleTexturePaths, cloudParticleDensity, scene ) {

	this._renderer = renderer;
	this._scene = new THREE.Scene();
	this._camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 20 );
	this.proxyCamera = camera;	// use this camera's orientation for rendering
	
	// sun
	this._sunGeometry = new THREE.SphereGeometry( 0.25 );
	this._sunMesh = new THREE.Mesh( this._sunGeometry, new THREE.MeshBasicMaterial({
		depthTest: false,
		depthWrite: false
	}));
	this._sunMesh.position.set( 5, 5, 0 );
	this._scene.add( this._sunMesh );
	
	// distant clouds
	this._cloudGeometry = new THREE.Geometry();
	var radius = 8;
	var canter = 0;
	var height = .9;
	var loci = 16;
	var uvs = [];
	
	for ( var i = 0; i < loci; ++i ) {
		// leading edge
		var angle = i * 2 * Math.PI / loci;
		this._cloudGeometry.vertices.push( new THREE.Vector3( Math.cos( angle ) * radius, 0, Math.sin( angle ) * radius ) );
		this._cloudGeometry.vertices.push( new THREE.Vector3( Math.cos( angle ) * radius, height, Math.sin( angle ) * radius ) );
		// cantered edge
		var angle = ( i - 1.5 ) * 2 * Math.PI / loci;
		this._cloudGeometry.vertices.push( new THREE.Vector3( 
			Math.cos( angle ) * ( radius - canter ), 
			0, 
			Math.sin( angle ) * ( radius - canter )
		) );
		this._cloudGeometry.vertices.push( new THREE.Vector3( 
			Math.cos( angle ) * ( radius - canter ), 
			height, 
			Math.sin( angle ) * ( radius - canter )
		) );
		
		var index = 4 * i;
		this._cloudGeometry.faces.push( new THREE.Face3( index + 2,	index + 1,  index, new THREE.Vector3( Math.cos( angle ), 0, Math.sin( angle ) ) ) );
		this._cloudGeometry.faces.push( new THREE.Face3( index + 3, index + 1, index + 2, new THREE.Vector3( Math.cos( angle ), 0, Math.sin( angle ) ) ) );		
		uvs.push( [ new THREE.Vector2( 1, 0 ), new THREE.Vector2( 0, 1 ), new THREE.Vector2( 0, 0 ) ] );
		uvs.push( [ new THREE.Vector2( 1, 1 ), new THREE.Vector2( 0, 1 ), new THREE.Vector2( 1, 0 ) ] );
	}
	this._cloudGeometry.faceVertexUvs[0] = uvs;
	this._cloudGeometry.verticesNeedUpdate = true;
	this._cloudGeometry.elementsNeedUpdate = true;
	this._cloudGeometry.uvsNeedUpdate = true;	
	
	this._cloudTexture = THREE.ImageUtils.loadTexture( cloudTexturePath, THREE.UVMapping );
	this._cloudMaterial = new THREE.MeshLambertMaterial({
		shading: THREE.FlatShading,
		transparent: true,
		blending: THREE.NormalBlending,		
		opacity: 1.0,
		alphaTest: 0.0,
		emissive: new THREE.Color( 0xFFFFFF ),
		fog: false,
		map: this._cloudTexture,
		depthTest: false,
		depthWrite: false,
		side: THREE.BackSide
	});
	
	this._cloudMesh = new THREE.Mesh( this._cloudGeometry, this._cloudMaterial );
	this._cloudMesh.translateY( -0.25 );
	this._cloudMesh.scale.x = 1.25;
	
	this._scene.add( this._cloudMesh );
	
	// free cloud particles		
	for ( var i = 0; i < cloudParticleTexturePaths.length; ++i ) {
	
		var texture = THREE.ImageUtils.loadTexture( cloudParticleTexturePaths[i], THREE.UVMapping );;
		this._cloudParticleTextures.push( texture );
		
	}
	
	// make a bouquet of cloud quads from materials
	for ( var i = 0; i < cloudParticleDensity; ++i ) {
	
		var group = new THREE.Object3D();
		group.position = new THREE.Vector3( Math.random() * 20 - 10, Math.random() * 6 + 2, Math.random() * 20 - 10 );
	
		for ( var j = 0; j < this._cloudParticleTextures.length; ++j ) {
			
			var scale = Math.random() + 1;
			var cloud = new THREE.Mesh( new THREE.PlaneGeometry( scale, scale ), new THREE.MeshLambertMaterial({
				shading: THREE.FlatShading,
				transparent: true,
				blending: THREE.NormalBlending,		
				opacity: 1.0,
				//alphaTest: 0.3,
				emissive: new THREE.Color( 0xFFFFFF ),
				fog: false,
				map: this._cloudParticleTextures[j],
				depthTest: false,
				depthWrite: false
			}));
			
			group.add( cloud );
			// jitter within group
			//cloud.position.x = Math.random() * 2 - 1;
			cloud.position.y = Math.random() * - 0.5;
			cloud.position.z = Math.random() * - 0.5;
			
		}
		
		group.lookAt( new THREE.Vector3( 0, 0, 0 ) );
		this._cloudGroupObjects.push( group );
		this._scene.add( group );
	}
	
};

PELINAL.SkyBox.prototype = {

	constructor: PELINAL.SkyBox,
	_renderer: null, _scene: null, _camera: null,
	_mesh: null, _geometry: null, _material: null, _texture: null,
	_cloudGeometry: null, _cloudTexture: null, _cloudMaterial: null,
	_cloudGroupObjects: [], _cloudParticleTextures: [], _cloudParticleMaterials: [],
	_timeOfDay: 0, _sunGeometry: null, _sunMesh: null,

	_respawnCloud: function ( object ) {
		
		// reinitialize a cloud near the -x horizon	
		object.position.x = -10;
		object.position.y = Math.random() * 6 + 2;
		object.position.z = Math.random() * 20 - 10;
		
		for ( var i = 0; i < object.children.length; ++i ) {
		
			object.children[i].material.opacity = 0;
			object.children[i].scale = Math.random() + 1;
			object.children[i].position.x = Math.random() * 2 - 1;
			object.children[i].position.y = Math.random() * 2 - 1;
			object.children[i].position.z = Math.random() * 2 - 1;
		
		}
	
	},


	proxyCamera: null,

	animate: function ( delta ) {
		
		for ( var i = 0; i < this._cloudGroupObjects.length; ++i ) {
		
			this._cloudGroupObjects[i].position.x += delta * .5;
			
			if ( this._cloudGroupObjects[i].position.x > 10 ) {
				
				this._respawnCloud( this._cloudGroupObjects[i] );
				
			}
			
			this._cloudGroupObjects[i].position.y = 2 + 0.5 / (1 + Math.pow( this._cloudGroupObjects[i].position.x, 2 ) );
			this._cloudGroupObjects[i].position.z += delta * .05 * Math.cos( new THREE.Vector3( 1, 0, 0 ).angleTo( new THREE.Vector3( 0, 0, this._cloudGroupObjects[i].position.z ) ) );
			
			this._cloudGroupObjects[i].lookAt( new THREE.Vector3( 0, 0 , 0 ) );
			
			 this._cloudGroupObjects[i].children[0].material.opacity = 2 / ( Math.abs( this._cloudGroupObjects[i].position.x ) + 1 )
			 this._cloudGroupObjects[i].children[1].material.opacity = 2 / ( Math.abs( this._cloudGroupObjects[i].position.x ) + 1 )
			 this._cloudGroupObjects[i].children[2].material.opacity = 2 / ( Math.abs( this._cloudGroupObjects[i].position.x ) + 1 )
			
			
		}
		
	},
	
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
	for( var j = 0; j < 64; j++ ) {	// todo: vertices per LOD ring; 64 seems good though

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
	this._lockWorkers();

};

PELINAL.Ocean.AnimateWorker = { /* injected worker */ };
PELINAL.Ocean.InjectDependencies = function () {
	// inject worker thread code into DOM; by injecting we can keep our worker code packaged with the library
	PELINAL.Ocean.InjectionContext = function ( message ) {
		/*		worker payload format:
				{
					time: 0,
					frequency: 0,
					objects: [	
					
						{  x: 0, y: 0, z: 0 }, 
						{  x: 1, y: 1, z: 1 }
						
					]
				}																*/	
		onmessage = function ( event ) {
		
			var payload = JSON.parse( event.data );
			var length = payload.objects.length;
			
			for ( var i = 0; i < length; ++i ) {
			
				payload.objects[i].y = 10 + payload.amplitude * ( Math.sin( payload.objects[i].x * payload.frequency - payload.time ) + Math.sin( payload.objects[i].z * payload.frequency - payload.time ) );
				
			}
		
			postMessage( payload );	// todo: may need to tie guids to these positions
		
		}
		
	};

	PELINAL.Ocean.AnimateWorkerScript = document.createElement( "script" );
	PELINAL.Ocean.AnimateWorkerScript.type = "text/js-worker";							// make sure Javascript engine doesn't execute our worker script
	PELINAL.Ocean.WorkerCtx = PELINAL.Ocean.InjectionContext.toString();
	PELINAL.Ocean.WorkerCtx = PELINAL.Ocean.WorkerCtx.substring( PELINAL.Ocean.WorkerCtx.indexOf( '{' ) + 1, PELINAL.Ocean.WorkerCtx.lastIndexOf( '}' ) );
	PELINAL.Ocean.AnimateWorkerScript.appendChild( document.createTextNode( PELINAL.Ocean.WorkerCtx ) );
	document.body.appendChild( PELINAL.Ocean.AnimateWorkerScript );

	PELINAL.Ocean.AnimateWorkerScriptBlob = new Blob( [ PELINAL.Ocean.AnimateWorkerScript.textContent ], { type: "text/javascript" });	// supply correct MIME type
	
	PELINAL.Ocean.AnimateWorker = new Worker( window.URL.createObjectURL( PELINAL.Ocean.AnimateWorkerScriptBlob ) );
	
	delete PELINAL.Ocean.InjectionContext;	// clean up our proxy objects, script has been injected into worker singleton
	delete PELINAL.Ocean.AnimateWorkerScript;
	delete PELINAL.Ocean.WorkerCtx;
	delete PELINAL.Ocean.AnimateWorkerScriptBlob;

}();
delete PELINAL.Ocean.InjectDependencies;

PELINAL.Ocean.prototype = {

	constructor: PELINAL.Ocean,
	_mesh: null, _geometry: null, _material: null, _uniforms: null, _texture: null,
	_amplitude: 0, _frequency: 0, _phase: 0, _time: 0,
	_animateWorker: PELINAL.Ocean.AnimateWorker,	// worker singleton
	
	floatingObjects: [],

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

		// set up payload for animation worker thread
		var payload = {
			time: this._uniforms.time.value,
			amplitude: this._amplitude,
			frequency: this._frequency,
			objects: []
		};	
		for( var i = 0; i < this.floatingObjects.length; ++i ) {
		
			if ( !this.floatingObjects[i] instanceof THREE.Camera ) { 
				payload.objects.push( this.floatingObjects[i].position );
			}
			else { 
				var cam = this.floatingObjects[i];	// calc cam in main thread, any waits are too jarring
				cam.position.y = 300 + payload.amplitude * ( Math.sin( cam.position.x * payload.frequency - payload.time ) + Math.sin( cam.position.z * payload.frequency - payload.time ) );
			
			}
			
		
		}
		this._animateWorker.postMessage( JSON.stringify( payload ) );

	},
	_receiveWorkerMessage: function ( payload ) {
	
		// let's just pray these arrays stay in synch, ha! (may need something smarter)
		for( var i = 0; i < payload.data.objects.length; ++i ) {
		
			this.floatingObjects[i].position.y = payload.data.objects[i].y;
					
		}
	
	},
	
	_lockWorkers: function () {
		
		PELINAL.Ocean.AnimateWorker.onmessage = this._receiveWorkerMessage.bind( this );	// take control of worker singleton
		
	},	

	scroll: function ( position ) {

		this._uniforms.rephase.value = new THREE.Vector2( position.x, position.z );
		this._mesh.position.x = position.x;
		this._mesh.position.z = position.z;

	}

};