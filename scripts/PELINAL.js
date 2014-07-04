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
	_friction: 10, _moveSpeed: 400,
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
			
				payload.objects[i].y = 10 + payload.amplitude * Math.sin( payload.objects[i].x * payload.frequency - payload.time ) + Math.sin( payload.objects[i].z * payload.frequency - payload.time );
			
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
		
			payload.objects.push( this.floatingObjects[i].position );
		
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