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
var directionalLight, ambientLight;

var clock = new THREE.Clock( true );
var animation, toonMesh;
var menu;

init();
animate();

function init() {
	
	renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
	// renderer.setClearColor( 0xffffff );
	// renderer.setClearColor( 0x42b2da );
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
	scene.setGravity(new THREE.Vector3( 0, -9.81, 0 ));
	scene.addEventListener(
		'update',
		function() {
			scene.simulate( undefined, 2 );
			phys_stats.update();
		}
	);
	scene.fog = new THREE.FogExp2( 0x18406b, 0.00001 );

	ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add( ambientLight );
	
	directionalLight = new THREE.DirectionalLight( 0xffffaa, 1.0 );
	directionalLight.position = new THREE.Vector3( 15000, 15000, 0.0 );
	scene.add( directionalLight );
	//sunHelper = new THREE.DirectionalLightHelper( directionalLight, 500 );	

	//SKYBOX and WATER
	skybox = new PELINAL.SkyBox( renderer, camera, "textures/distantCloud.png", [ "textures/cloud1.png", "textures/cloud2.png", "textures/cloud3.png" ], 25, scene );
	ocean = new PELINAL.Ocean( renderer, camera, 50, 0.0002, "textures/water1024.png" );
	scene.add( ocean._mesh );

	//TEST LANDMASS
	landmass = new PELINAL.Landmass( new THREE.Vector3( 0, 0, 0 ), "textures/cliffFace.png", "textures/stonyShore.png", "textures/grass.png", scene );
	scene.add( landmass._mesh );
	
	var coord = Math.ceil( Math.random() * landmass._geometry.vertices.length );
	
	player = new PELINAL.Player( scene, camera, null, new THREE.Vector3( landmass._geometry.vertices[coord].x, landmass._geometry.vertices[coord].y + 1.5, landmass._geometry.vertices[coord].z ) );
	menu = new PELINAL.Menu( 'blocker', 'instructions', player._cameraControls );	
		
	// player.setSceneGraph( landmass.octree );
	
	//BOAT
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {

		console.log( item, loaded, total );

	};
	
	var loader = new THREE.OBJLoader( manager );

	window.addEventListener('resize', onWindowResize, false);
	// ocean.floatObject( camera );
	update();
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

function update () {

	
	setTimeout( update, 16 ); // update logic a little faster than 60fps
	ocean.scroll( camera.position );
	player.update( 16 );

}

function animate() {

	requestAnimationFrame(animate);
	var delta = clock.getDelta();
	THREE.AnimationHandler.update( delta );
	
	// player.update(  );
	render( delta );
	render_stats.update();
	
}

function render( delta ) {

	ocean.animate( delta );
	skybox.animate( delta );
	skybox.render();
	renderer.render(scene, camera, null, false);
	
}