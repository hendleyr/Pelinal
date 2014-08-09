/*	Licensed under The MIT License http://en.wikipedia.org/wiki/MIT_License

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
	to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
	sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	*/

var PELINAL = { VERSION: 0.11 };
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

	setControls: function ( controls ) { this._controls = controls;	},
	
	pointerLockOn: function ( event ) {

		this._instructionsElement.style.display = 'none';
		this._lockElement.requestPointerLock();

	},

	pointerLockChange: function ( event ) {

		if ( document.pointerLockElement === this._lockElement || document.mozPointerLockElement === this._lockElement || document.webkitPointerLockElement === this._lockElement ) {

			if ( this._controls && this._controls.enable ) { this._controls.enable(); }
			this._blockerElement.style.display = 'none';

		} else {

			if ( this._controls && this._controls.disable ) { this._controls.disable(); }

			this._blockerElement.style.display = '-webkit-box';
			this._blockerElement.style.display = '-moz-box';
			this._blockerElement.style.display = 'box';
			this._instructionsElement.style.display = '';

		}

	},

	pointerLockError: function ( event ) { this._instructionsElement.style.display = ''; }

}


PELINAL.Player = function ( scene, camera, modelPath, pos ) {

	// MISC
	var cap1 = new THREE.SphereGeometry( 0.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2 );
	cap1.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );
	var cap2 = new THREE.SphereGeometry( 0.5, 8, 8, 0, Math.PI * 2, -Math.PI, Math.PI / 2 );
	cap2.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -0.5, 0 ) );
	var capsule = new THREE.CylinderGeometry( 0.5, 0.5, 1, 8, 1, true );
	capsule.merge( cap1 );
	capsule.merge( cap2 );
	this._physicsMesh = new Physijs.CapsuleMesh(
		capsule,
		Physijs.createMaterial( new THREE.MeshLambertMaterial( { wireframe: true } ) ),
		//new THREE.MeshLambertMaterial({ wireframe: true })
		this._mass
	);

	this._physicsMesh.position = pos;	
	this._physicsMesh.__dirtyPosition = true;
	this.position = this._physicsMesh.position;
	
	scene.add( this._physicsMesh );
	this._physicsMesh.mass = this._mass;
	// this._physicsMesh.setAngularFactor( { x: 0, y: 1, z: 0 } );
	
	// PLAYER MODEL
	modelPath = modelPath || 'models/toon/toon.js';
	this._scene = scene;
	this._camera = camera;
	new THREE.JSONLoader().load( modelPath, this._load.bind( this ) );
	
	// CONTROLS
	//this._cameraControls = new PELINAL.FirstPersonCameraControls( this._camera );
	this._cameraControls = new PELINAL.OrbitCameraControls( this._camera, this.position, this, document.body, scene );
	this._playerControls = new PELINAL.KeyboardControls();

},

PELINAL.Player.prototype = {

	constructor: PELINAL.Player,
	position: new THREE.Vector3(),
	_physicsMesh: null,
	_mass: 75,
	_mesh: null, _isLoaded: false,
	_scene: null,
	_camera: null,
	_cameraControls: null, 	//
	_playerControls: null,
	_velocity: new THREE.Vector3(),
	_friction: 10,
	_maxSpeed: 15,	// we want to do this in a physics tick callback
	_impulse: 10,
	_jumpImpulse: 50,
	
	/*			ORBIT CAM 		*/
	_cameraBody: null, 
	_idealCamPlacement: new THREE.Vector3(), _placementImpulse: new THREE.Vector3(),
	_lookVector: new THREE.Vector3( -1, 0, 0 ),
	_offset: new THREE.Vector3( 1, 0, 0 ),  _slideIn: 0,
	_quat: null, _quatInverse: null,
	_containerElement: null, _isEnabled: false,
	_xSensitivity: -0.002, _ySensitivity: -0.002,
	_pitch: 0, _minPitch: Math.PI / 16, _maxPitch: Math.PI - Math.PI / 16, _pitchDelta: 0,
	_yaw: 0, _yawDelta: 0,
	_zoom: 10, _offsetMin: 3, _offsetMax: 10,
	/*			/ORBIT CAM 	*/
	
	/*			ANIMATIONS	-- looks like these are exported alphabetically!	*/
	_backDodgeAnim: null, _bowAnim: null, _jumpAnim: null, _saluteAnim: null, _sprintAnim: null, _swordMoves1Anim: null, _waveAnim: null,
	/*			/ANIMATIONS																				*/
	_loaded: false,
	
	load: function ( geometry, materials ) {

		// MESH
		this._mesh = new THREE.SkinnedMesh( geometry, new THREE.MeshFaceMaterial( materials ) );
		this._mesh.position.y = -1;// model coords origin at feet; this will center model inside capsule
		this._scene.add( this._mesh );
		this._physicsMesh.add( this._mesh );
		
		// ANIMATIONS
		// enable skinning on all materials
		this._materials = this._mesh.material.materials;
		for ( var i = 0; i < materials.length; ++i ) {
			var mat = materials[i];
			mat.skinning = true;
		}
		
		for ( var i = 0; i < geometry.animations.length; ++i ) {
			THREE.AnimationHandler.add( geometry.animations[i] );
		}
		this._configAnimations();
		
		this._loaded = true;
		this._scene.simulate();
		
	},
	
	_physicsSetup: function ( a, b, c, d ) { 
		this._cameraBody.setDamping( .9995, .9995 );
		this._cameraBody.setPerObjectGravity( { x:0, y:0, z:0 } );
		this._cameraBody.setCcdMotionThreshold( 0.1 );
		this._cameraBody.setCcdSweptSphereRadius( 0.5 );
		
		this._cameraBody.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
			
			// `this` has collided with `other_object` with an impact speed of `relative_velocity` and a rotational force of `relative_rotation` and at normal `contact_normal`
			if ( other_object === this._physicsMesh ) { 
				return false; 
			}	else { 
				this._slideIn += 0.1;
			}
			
		}.bind( this ) );
		
		this._cameraBody.position.copy( this._camera.position );
		this._fixCameraPlacement();
		this._cameraBody.__dirtyPosition = true;
	},
	
	configAnimations: function () {
		
		this._backDodgeAnim = new THREE.Animation( this._mesh, this._mesh.geometry.animations[0].name, THREE.AnimationHandler.CATMULLROM );
		this._backDodgeAnim.loop = false;
		this._backDodgeAnim.timeScale = 40;
		
		this._bowAnim = new THREE.Animation( this._mesh, this._mesh.geometry.animations[1].name, THREE.AnimationHandler.CATMULLROM );
		this._bowAnim.loop = false;
		this._bowAnim.timeScale = 40;
		
		this._jumpAnim = new THREE.Animation( this._mesh, "Jump", THREE.AnimationHandler.CATMULLROM );
		this._jumpAnim.loop = false;
		this._jumpAnim.timeScale = 40;
		
		this._saluteAnim = new THREE.Animation( this._mesh, this._mesh.geometry.animations[3].name, THREE.AnimationHandler.CATMULLROM );
		this._saluteAnim.loop = false;
		this._saluteAnim.timeScale = 40;
		
		this._sprintAnim = new THREE.Animation( this._mesh, this._mesh.geometry.animations[4].name, THREE.AnimationHandler.CATMULLROM );
		this._sprintAnim.loop = true;
		this._sprintAnim.timeScale = 40;
		
		this._swordMoves1Anim = new THREE.Animation( this._mesh, this._mesh.geometry.animations[5].name, THREE.AnimationHandler.CATMULLROM );
		this._swordMoves1Anim.loop = false;
		this._swordMoves1Anim.timeScale = 40;
		
		this._waveAnim = new THREE.Animation( this._mesh, this._mesh.geometry.animations[6].name, THREE.AnimationHandler.CATMULLROM );
		this._waveAnim.loop = false;
		this._waveAnim.timeScale = 40;
		
	},
	
	animate: function ( delta ) {
		// everything currently handled by animation handler singleton
	},
	
	update: function ( delta ) {
		if ( !this._loaded ) { return; }
	
		if ( this._playerControls.moveForward ) {
			this._physicsMesh.applyCentralImpulse( new THREE.Vector3( this._cameraControls._lookVector.x, 0, this._cameraControls._lookVector.z ).normalize().multiplyScalar( -this._impulse ), { x:0, y:0, z:0 } );
			// todo gradually redirect momentum to match look vector
			
			// rotate mesh gradually to match look vector
			this._mesh.quaternion.slerp( this._cameraControls._quat, delta / 200 );
			
		}
		if ( this._playerControls.moveBackWard ) {
			// todo gradually redirect momentum to match look vector
			this._physicsMesh.applyCentralImpulse( new THREE.Vector3( this._cameraControls._lookVector.x, 0, this._cameraControls._lookVector.z ).normalize().multiplyScalar( this._impulse ), { x:0, y:0, z:0 } );
		}
		if ( this._playerControls.moveLeft ) { 
			this._physicsMesh.applyCentralImpulse( new THREE.Vector3().crossVectors( this._camera.up,  this._cameraControls._lookVector ).normalize().multiplyScalar( -this._impulse ), { x:0, y:0, z:0 } );
		}
		if ( this._playerControls.moveRight ) { 
			this._physicsMesh.applyCentralImpulse( new THREE.Vector3().crossVectors( this._camera.up,  this._cameraControls._lookVector ).normalize().multiplyScalar( this._impulse ), { x:0, y:0, z:0 } );
		}
		
		if ( this._playerControls.jump ) {
			if ( this._physicsMesh._physijs.touches[0] ) {
				// is touching the ground (or at least one thing), so we can jump
				this._physicsMesh.applyCentralImpulse( new THREE.Vector3( 0, 1, 0).multiplyScalar( this._jumpImpulse ), { x:0, y:0, z:0 } );
				this._jumpAnim.play( 5 );	// todo: need logic for blending into animation
			}
		}
		
		if ( this._playerControls.bow ) {
			this._bowAnim.play();
		}
		if ( this._playerControls.wave ) {
			this._waveAnim.play();
		}
		
		if ( 		!this._playerControls.moveForward 
			&& 	!this._playerControls.moveBackWard 
			&& 	!this._playerControls.moveLeft 
			&& 	!this._playerControls.moveRight 
			&& 	!this._playerControls.jump 
			&& 	this._physicsMesh._physijs.touches[0] 	) {
			// we're not trying to move, so plant your feet (if on the ground) and resist movement a good amount
			this._physicsMesh.setDamping( .985, .985 );	// todo: might want less aggressive damping
		}
		else {
			this._physicsMesh.setDamping( .25, .25 );	// todo: not sure about these values
		}
		
		// todo: tweak orbit camera for more smoothness, check for camera collisions
		this._cameraControls.update( delta );		
		
	},
	
	updateCamera: function ( delta ) {
	
	}
	
	_fixCamera: function ( delta ) {
	
	}
},


PELINAL.KeyboardControls = function () {
	
	document.addEventListener( 'keydown', this.onKeyDown.bind( this ), false );
	document.addEventListener( 'keyup', this.onKeyUp.bind( this ), false );
	
},

PELINAL.KeyboardControls.prototype = {
	
	constructor: PELINAL.KeyboardControls,
	_isEnabled: true,
	_forwardKey: 87,		// w
	_leftKey: 65,			// a
	_backwardKey: 83,	// s
	_rightKey: 68,			// d
	_jumpKey: 32,			// space
	moveForward: false, moveBackWard: false, moveLeft: false, moveRight: false, jump: false,
	bow: false, wave: false,
	
	update: function ( delta ) {	},
	enable: function () { this._isEnabled = true; },
	disable: function () { this._isEnabled = false; },
	
	onKeyDown: function ( event ) {
	
		// console.log( event.keyCode );		
		if ( this._isEnabled === false ) { return; }
		switch ( event.keyCode ) {

			case this._forwardKey: // w
				this.moveForward = true;
				break;

			case this._leftKey: // a
				this.moveLeft = true;
				break;

			case this._backwardKey: // s
				this.moveBackWard = true;
				break;

			case this._rightKey: // d
				this.moveRight = true;
				break;
				
			case this._jumpKey:
				this.jump = true;
				break;
				
			case 82:
				this.wave = true;
				break;
				
			case 70:
				this.bow = true;
				break;

		}

	},

	onKeyUp: function ( event ) {

			switch ( event.keyCode ) {

			case this._forwardKey: // w
				this.moveForward = false;
				break;

			case this._leftKey: // a
				this.moveLeft = false;
				break;

			case this._backwardKey: // s
				this.moveBackWard = false;
				break;

			case this._rightKey: // d
				this.moveRight = false;
				break;
				
			case this._jumpKey:
				this.jump = false;
				break;
				
			case 82:
				this.wave = false;
				break;
				
			case 70:
				this.bow = false;
				break;

		}

	}

},


PELINAL.OrbitCameraControls = function ( camera, target, player, containerElement, scene ) {

	this._camera = camera;
	this._scene = scene;
	this._player = player;
	
	this._quat = new THREE.Quaternion().setFromUnitVectors( camera.up, new THREE.Vector3( 0, 1, 0 ) );
	this._target = target;
	this._containerElement = containerElement;
	this._isEnabled = false;
	
	this._cameraBody = new Physijs.SphereMesh(
		new THREE.SphereGeometry(2),
		Physijs.createMaterial( new THREE.MeshLambertMaterial( { wireframe: true, side: THREE.DoubleSide } ), 0, 1 ),
		0.1
	);
	this._cameraBody.addEventListener( 'ready', this._cameraPhysicsSetup.bind( this ) );
	this._cameraBody.mass = 1;
	
	// this._cameraBody.position = this._camera.position;
	scene.add( this._cameraBody );
	
	this._cameraBody.position.copy( this._camera.position );
	// this._cameraBody.position = this._camera.position;
	scene.add( this._cameraBody );
	
	document.addEventListener( 'mousemove', this.onMouseMove.bind( this ), false );
	document.addEventListener( 'mousewheel', this.onMouseWheel.bind( this ), false );
	
	this.update();
},

PELINAL.OrbitCameraControls.prototype = {

	constructor: PELINAL.OrbitCameraControls,
	_player: null,
	_camera: null, _cameraBody: null, 
	_idealCamPlacement: new THREE.Vector3(), _placementImpulse: new THREE.Vector3(),
	_target: new THREE.Vector3(),
	
	_offset: new THREE.Vector3( 1, 0, 0 ),  _slideIn: 0,
	
	_lookVector: new THREE.Vector3( -1, 0, 0 ),
	_scene: null, _octree: null,
	
	_quat: null, _quatInverse: null,
	_containerElement: null, _isEnabled: false,
	_xSensitivity: -0.002, _ySensitivity: -0.002,
	_pitch: 0, _minPitch: Math.PI / 16, _maxPitch: Math.PI - Math.PI / 16, _pitchDelta: 0,
	_yaw: 0, _yawDelta: 0,
	_zoom: 10, _offsetMin: 3, _offsetMax: 10,
	
	_cameraPhysicsSetup: function ( a, b, c, d ) { 
		this._cameraBody.setDamping( .9995, .9995 );
		this._cameraBody.setPerObjectGravity( { x:0, y:0, z:0 } );
		// this._cameraBody.setAngularFactor( { x:0, y:0, z:0 } );
		this._cameraBody.setCcdMotionThreshold( 0.1 );
		this._cameraBody.setCcdSweptSphereRadius( 0.5 );
		
		this._cameraBody.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
			
			// `this` has collided with `other_object` with an impact speed of `relative_velocity` and a rotational force of `relative_rotation` and at normal `contact_normal`
			if ( other_object === this._player._physicsMesh ) { 
				return false; 
			}	else { 
				this._slideIn += 0.1;
			}
			
		}.bind( this ) );
		
		// this._cameraBody.setLinearFactor( { x:0, y:0, z:0 } );
		this._cameraBody.position.copy( this._camera.position );
		this._fixPlacement();
		this._cameraBody.__dirtyPosition = true;
	},
	
	update: function ( delta ) {
	
		// start sliding the camera back out if it's no longer pressed against something
		if ( this._cameraBody._physijs.touches[0] != 1 ) { 
			this._slideIn = Math.max( 0, this._slideIn - 0.1 );
		}
	
		// calculate an intended destination for the camera
		if ( this._isEnabled === false ) { return; }
		this._cameraBody.setLinearVelocity( {x:0, y:0, z:0 } );
		// find camera's offset from target
		this._offset.subVectors( this._camera.position, this._target );
		this._lookVector = this._lookVector.copy( this._offset ).normalize();
		this._quat.setFromAxisAngle( this._camera.up, this._yaw + Math.PI );
		
		this._yaw = Math.atan2( this._offset.x, this._offset.z );
		this._pitch = Math.atan2( Math.sqrt( this._offset.x * this._offset.x + this._offset.z * this._offset.z ), this._offset.y );

		this._yaw += this._yawDelta;
		this._pitch += this._pitchDelta;
		
		// clamp pitch between our defined min and max angles
		this._pitch = Math.max( this._minPitch, Math.min( this._maxPitch, this._pitch ) );
				
		var offsetRadius = this._offset.length() - this._slideIn; //* this._zoom;
		offsetRadius = Math.max( this._offsetMin, Math.min( this._offsetMax, offsetRadius ) );
		
		this._offset.x = offsetRadius * Math.sin( this._pitch ) * Math.sin( this._yaw );
		this._offset.y = offsetRadius * Math.cos( this._pitch );
		this._offset.z = offsetRadius * Math.sin( this._pitch ) * Math.cos( this._yaw );
			
		this._idealCamPlacement.addVectors( this._offset, this._target );
		
		if ( this._placementFail ) {
			this._fixPlacement();	//todo: failure conditions; send out a ray every X seconds and see if we can hit player
		}
		
		// this._placementImpulse.subVectors( this._idealCamPlacement, this._camera.position ).multiplyScalar( 1 );
		this._placementImpulse.subVectors( this._idealCamPlacement, this._cameraBody.position );
		this._camera.position = this._idealCamPlacement;
		// now nudge our camera body towards the ideal spot; nudge a lot if its far, nearly 0 if its near
		var force = this._placementImpulse.lengthSq();
		this._cameraBody.applyCentralImpulse( this._placementImpulse.normalize().multiplyScalar( force * 50 ) );
		//this._camera.position = this._idealCamPlacement;
		// this._cameraBody.position.lerp( this._idealCamPlacement, 0.25 );
		// this._cameraBody.position.lerp( this._idealCamPlacement, 0.75 );
		
		// this._cameraBody.setLinearVelocity( this._placementImpulse.multiplyScalar( 100 ) );
		// this._cameraBody.applyCentralForce( this._placementImpulse.normalize().multiplyScalar( 1000 ) );
		
		// this._cameraBody.position = this._idealCamPlacement;
		this._camera.position.lerp( this._cameraBody.position, 0.5 );
		// this._camera.position = this._cameraBody.position;
		
		// this._cameraBody.position.copy( this._camera.position );
		// this._cameraBody.position = this._camera.position;
		// this._cameraBody.__dirtyPosition = true;
		
		this._camera.lookAt( this._target );
		this._yawDelta = 0;
		this._pitchDelta = 0;
		
	},
	
	_fixPlacement: function ( delta ) {
		// it may be that sometimes our cam gets stuck behind something or fails otherise; this is a last resort
		this._camera.position.set( this._target.x, this._target.y + this._offsetMin, this._target.z);
		this._cameraBody.setAngularVelocity( { x:0, y:0, z:0 } );
		this._cameraBody.setLinearVelocity( { x:0, y:0, z:0 } );
		this._cameraBody.position.copy( this._camera.position );
		// this._cameraBody.position = this._camera.position;
		this._cameraBody.__dirtyPosition = true;
	},
	
	onMouseMove: function ( event ) {
		
		if ( this._isEnabled === false ) { return; }

		this._yawDelta = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		this._pitchDelta = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
				
		this._yawDelta *= this._xSensitivity;
		this._pitchDelta *= this._ySensitivity;
	
	},
	
	onMouseWheel: function ( event ) {
		
		if ( this._isEnabled === false ) { return; }
		
		event.preventDefault();
		event.stopPropagation();
		//todo
	},	
	
	enable: function () { this._isEnabled = true; },
	disable: function () { this._isEnabled = false; },
},


PELINAL.FirstPersonCameraControls = function ( camera ) {

	camera.rotation.set( 0, 0, 0 );
	camera.rotation.order = "YXZ";	// we'll never rotate around Z, so this keeps things very simple //todo: quaternion cam for oculus

	this._camera = camera;
	this._isEnabled = false;

	document.addEventListener( 'mousemove', this.onMouseMove.bind( this ), false );	
	
}

PELINAL.FirstPersonCameraControls.prototype = {

	constructor: PELINAL.FirstPersonCameraControls,
	_camera: null, _velocity: null,
	_isEnabled: false,
	_sensitivity: 0.002,

	update: function ( delta ) {	},
	
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
		fogColor: { type: "c", value: new THREE.Color( 0xD1DCFF ) },
		fogDensity: { type: "f", value: 0.00000 }
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