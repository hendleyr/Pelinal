if (!Detector.webgl) {

	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = "";

}

var container, stats;
var camera, controls, scene, renderer;
var mesh, texture;
var boat;
var skybox, ocean;
var directionalLight;

var worldWidth = 256, worldDepth = 256,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

var clock = new THREE.Clock(true);

init();
animate();

function init() {

	container = document.getElementById('container');
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0xbfd1e5);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	container.innerHTML = "";
	container.appendChild(renderer.domElement);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 39690);

	scene = new THREE.Scene();

	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = 1000;
	controls.lookSpeed = 0.1;

	data = generateHeight(worldWidth, worldDepth);

	camera.position.y = data[worldHalfWidth + worldHalfDepth * worldWidth] + 500;

	var geometry = new THREE.PlaneGeometry(15000, 15000, worldWidth - 1, worldDepth - 1);
	geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

	for (var i = 0, l = geometry.vertices.length; i < l; i++) {

		geometry.vertices[i].y = data[i] * 10;

	}
	//compute normals
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	for (var i = 0, l = geometry.vertices.length; i < l; i++) {

		geometry.vertices[i].y = data[i] * 10;

	}
	//var ambientLight = new THREE.AmbientLight( 0x202020 ); // soft white light
	//scene.add( ambientLight );
	
	directionalLight = new THREE.DirectionalLight(0xffffff, 1.00);	
	directionalLight.position = new THREE.Vector3(0.8, 0.3, 0).normalize();
	scene.add(directionalLight);

	texture = THREE.ImageUtils.loadTexture("textures/sand.png");
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(16, 16);
	texture.needsUpdate = true;

	mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ map: texture, wrapAround: true, wrapRPG: 0xFF0000 }));
	//scene.add(mesh);

	//SKYBOX and WATER
	skybox = new PELINAL.SkyBox( renderer, camera, "textures/mountains.png" );
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

	} );

	window.addEventListener('resize', onWindowResize, false);

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
	render();
	stats.update();
	
}

function render() {
	var delta = clock.getDelta();
	controls.update( delta );	
	
	ocean.animate( delta );
	skybox.render();	
	renderer.render(scene, camera, null, false);
	
}