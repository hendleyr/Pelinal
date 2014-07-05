if (!Detector.webgl) {

	Detector.addGetWebGLMessage();
	document.getElementById( 'container' ).innerHTML = "";

}

var container, stats;
var camera, controls, scene, renderer;
var mesh, texture;
var boat;
var skybox, ocean;
var directionalLight, sunHelper, sun;

var clock = new THREE.Clock( true );
var animation, toonMesh;
var menu;

init();
animate();

function init() {

	//container = document.getElementById( 'container' );
	renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
	//renderer.setClearColor( 0x42b2da );
	renderer.setClearColor( 0x18406b );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;
	//container.innerHTML = "";
	document.body.appendChild( renderer.domElement );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	document.body.appendChild( stats.domElement );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 33690 );
	camera.position.y =	2250;

	scene = new THREE.Scene();

	controls = new PELINAL.FirstPersonControls( camera );	
	menu = new PELINAL.Menu( 'blocker', 'instructions', controls );

	var ambientLight = new THREE.AmbientLight( 0x202020 ); // soft white light
	scene.add( ambientLight );
	
	directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
	directionalLight.position = new THREE.Vector3( 15000, 15000, 0.0 );
	sunHelper = new THREE.DirectionalLightHelper( directionalLight, 500 );
	
	scene.add( directionalLight );
	//scene.add( sunHelper );
	
	var sunGeometry = new THREE.SphereGeometry( 250 );
	//sunGeometry.position = directionalLight.position;
	sun = new THREE.Mesh(sunGeometry, new THREE.MeshBasicMaterial() );
	sun.position = directionalLight.position;	
	scene.add( sun );
	
	texture = THREE.ImageUtils.loadTexture("textures/sand.png");
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(16, 16);
	texture.needsUpdate = true;

	//SKYBOX and WATER
	//skybox = new PELINAL.SkyBox( renderer, camera, "textures/mountains.png", "textures/water1024.png" );
	skybox = new PELINAL.SkyBox( renderer, camera, "textures/distantCloud.png", [ "textures/cloud1.png", "textures/cloud2.png", "textures/cloud3.png" ], 2000);
	ocean = new PELINAL.Ocean( renderer, camera, 500, 0.0002, "textures/water1024.png" );
	scene.add( ocean._mesh );

	//BOAT
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {

		console.log( item, loaded, total );

	};
	
	var loader = new THREE.OBJLoader( manager );
	loader.load( 'models/boat.obj', function ( object ) {
		boat = object;
		object.traverse( function ( child ) {

		} );

		object.position.y = 80;
		scene.add( object );
		ocean.floatObject( boat );

	});

	window.addEventListener('resize', onWindowResize, false);
	// ocean.floatObject( camera );
	
	
	//
	var testLoader = new THREE.JSONLoader();
	
	testLoader.load('models/toon/toon.js', function ( geometry, materials ) {
		var material;
		toonMesh = new THREE.SkinnedMesh( geometry, new THREE.MeshFaceMaterial( materials ) );
		
		toonMesh.position.set( 800, 560, 1400 );
		
		material = toonMesh.material.materials;
		
		for ( var i = 0; i < materials.length; ++i ) {
			var mat = materials[i];
			mat.skinning = true;
		}
		
		scene.add( toonMesh );
		THREE.AnimationHandler.add( toonMesh.geometry.animations[0] );
		animation = new THREE.Animation( toonMesh, 'toonAnimation', THREE.AnimationHandler.CATMULLROM );
		
		animation.play();
	});
	//
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

	controls.handleResize();

}

function generateHeight(width, height) {

	var size = width * height, data = new Float32Array(size),
	perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

	for (var i = 0; i < size; i++) {

		data[i] = 0

	}

	for (var j = 0; j < 4; j++) {

		for (var i = 0; i < size; i++) {

			var x = i % width, y = ~~(i / width);
			data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);


		}

		quality *= 5;

	}

	return data;

}

function animate() {

	requestAnimationFrame(animate);
	if ( animation ) {
		THREE.AnimationHandler.update( .4 );
		//just for fun...
		toonMesh.position.y = boat.position.y + 480;
		toonMesh.lookAt( new THREE.Vector3( camera.position.x - toonMesh.position.x, toonMesh.position.y, camera.position.z - toonMesh.position.z ) );
	}
	
	render();
	stats.update();
	
}

function render() {

	var delta = clock.getDelta();
	controls.update( delta );	
	
	ocean.scroll( camera.position );
	ocean.animate( delta );
	skybox.animate( delta );
	skybox.render();
	renderer.render(scene, camera, null, false);
	
}