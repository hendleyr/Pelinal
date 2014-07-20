/*	Licensed under The MIT License http://en.wikipedia.org/wiki/MIT_License

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
	to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
	sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	*/

if (!Detector.webgl) {

	Detector.addGetWebGLMessage();
	document.getElementById( 'container' ).innerHTML = "";

}

Physijs.scripts.worker = './scripts/lib/physijs_worker.js';
Physijs.scripts.ammo = './ammo.js';

var container, render_stats, phys_stats;
var camera, controls, scene, renderer;
var landmass;
var mesh, texture;
var boat;
var player;
var skybox, ocean;
var directionalLight;

var clock = new THREE.Clock( true );
var animation, toonMesh;
var menu;

init();
animate();

function init() {
	
	renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
	//renderer.setClearColor( 0x42b2da );
	renderer.setClearColor( 0x18406b );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;
	document.body.appendChild( renderer.domElement );

	render_stats = new Stats();
	render_stats.domElement.style.position = 'absolute';
	render_stats.domElement.style.top = '0px';
	document.body.appendChild( render_stats.domElement );
	phys_stats = new Stats();
	phys_stats.domElement.style.position = 'absolute';
	phys_stats.domElement.style.top = '50px';
	phys_stats.domElement.style.zIndex = 100;
	document.body.appendChild( phys_stats.domElement );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 33690 );
	camera.position.z = 500;

	scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });	//new THREE.Scene();	
	scene.setGravity(new THREE.Vector3( 0, -700, 0 ));
	scene.addEventListener(
		'update',
		function() {
			scene.simulate( undefined, 2 );
			phys_stats.update();
		}
	);
	
	player = new PELINAL.Player( scene, camera, null, new THREE.Vector3( 0, 3500, 0 ) );
		
	menu = new PELINAL.Menu( 'blocker', 'instructions', player._cameraControls );

	var ambientLight = new THREE.AmbientLight( 0x202020 ); // soft white light
	scene.add( ambientLight );
	
	directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
	directionalLight.position = new THREE.Vector3( 15000, 15000, 0.0 );
	//sunHelper = new THREE.DirectionalLightHelper( directionalLight, 500 );
	
	scene.add( directionalLight );
	
	texture = THREE.ImageUtils.loadTexture( "textures/sand.png" );
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 16, 16 );
	texture.needsUpdate = true;

	//SKYBOX and WATER
	skybox = new PELINAL.SkyBox( renderer, camera, "textures/distantCloud.png", [ "textures/cloud1.png", "textures/cloud2.png", "textures/cloud3.png" ], 25, scene );
	ocean = new PELINAL.Ocean( renderer, camera, 50, 0.0002, "textures/water1024.png" );
	scene.add( ocean._mesh );

	//TEST LANDMASS
	landmass = new PELINAL.Landmass( new THREE.Vector3( 0, 0, 0 ), "textures/cliffFace.png", "textures/stonyShore.png", "textures/grass.png", scene );
	scene.add( landmass._mesh );
	// player.setSceneGraph( landmass.octree );
	
	//BOAT
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {

		console.log( item, loaded, total );

	};
	
	var loader = new THREE.OBJLoader( manager );
	// loader.load( 'models/boat.obj', function ( object ) {
		// boat = object;
		// object.traverse( function ( child ) {

		// } );

		// object.position.y = 80;
		// scene.add( object );
		// ocean.floatObject( boat );

	// });

	window.addEventListener('resize', onWindowResize, false);
	// ocean.floatObject( camera );
	
	// var testLoader = new THREE.JSONLoader();
	
	// testLoader.load('models/toon/toon.js', function ( geometry, materials ) {
		// var material;
		// toonMesh = new THREE.SkinnedMesh( geometry, new THREE.MeshFaceMaterial( materials ) );
		
		// toonMesh.position.set( 800, 560, 1400 );
		
		// material = toonMesh.material.materials;
		
		// for ( var i = 0; i < materials.length; ++i ) {
			// var mat = materials[i];
			// mat.skinning = true;
		// }
		
		// scene.add( toonMesh );
		// THREE.AnimationHandler.add( toonMesh.geometry.animations[0] );
		// THREE.AnimationHandler.add( toonMesh.geometry.animations[1] );
		// animation = new THREE.Animation( toonMesh, 'SwordMoves1', THREE.AnimationHandler.CATMULLROM );
		
		// var waveAnimation = new THREE.Animation( toonMesh, 'toonAnimation', THREE.AnimationHandler.CATMULLROM );
		
		// animation.play();
	// });
	//
	
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

	requestAnimationFrame(animate);
	// if ( animation ) {
		// THREE.AnimationHandler.update( .4 );
		//just for fun!
		// toonMesh.position.y = boat.position.y + 480;
		// toonMesh.lookAt( new THREE.Vector3( camera.position.x - toonMesh.position.x, toonMesh.position.y, camera.position.z - toonMesh.position.z ) );
	// }
	player.update( clock.getDelta() );
	render();
	render_stats.update();
	
}

function render() {

	var delta = clock.getDelta();
	// controls.update( delta );	
	
	ocean.scroll( camera.position );
	ocean.animate( delta );
	skybox.animate( delta );
	skybox.render();
	renderer.render(scene, camera, null, false);
	
}