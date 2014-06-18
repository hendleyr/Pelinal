if (!Detector.webgl) {

	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = "";

}

var container, stats;
var camera, controls, scene, renderer;
var mesh, texture;
var boat;
var skyboxCamera, skyboxScene;
var waterCamera, waterScene, waterGeometry, waterTexture, waterMesh;
var waterUniforms;
var directionalLight;

var worldWidth = 256, worldDepth = 256,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

var clock = new THREE.Clock(true);

init();
animate();

function init() {

	container = document.getElementById('container');

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

	// SKYBOX and WATER
	initSkybox();
	initWater();

	//BOAT
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {

		console.log( item, loaded, total );

	};
	var loader = new THREE.OBJLoader( manager );
	loader.load( 'models/boat.obj', function ( object ) {
		boat = object;
		object.traverse( function ( child ) {

			// if ( child instanceof THREE.Mesh ) {

				// child.material.map = texture;

			// }

		} );

		object.position.y = 80;
		scene.add( object );

	} );

	window.addEventListener('resize', onWindowResize, false);

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

function initSkybox() {
	skyboxCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3);
	skyboxCamera.quaternion = camera.quaternion;
	skyboxScene = new THREE.Scene();

	skyboxGeometry = new THREE.BoxGeometry(4, 1, 4);
	skyboxGeometry.faces.splice(4,4);
	skyboxGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
	skyboxGeometry.elementsNeedUpdate = true;
	skyboxGeometry.verticesNeedUpdate = true;

	skyboxTexture = THREE.ImageUtils.loadTexture("textures/mountains.png", THREE.UVMapping);
	skyboxTexture.premultiplyAlpha = true;
	//skyboxTexture.generateMipmaps = false;

	skyboxMesh = new THREE.Mesh(skyboxGeometry, new THREE.MeshLambertMaterial({
		shading: THREE.FlatShading,
		transparent: true,
		emissive: new THREE.Color(0xffffff),
		fog: false,
		map: skyboxTexture,
		depthTest: false,
		depthWrite: false,
		side: THREE.BackSide
	}));
	skyboxScene.add(skyboxMesh);
}

function initWater() {
	 waterUniforms = {
		amplitude: { type: "f", value: 500.0 },
		frequency: { type: "f", value: 0.0002 },
		time: { type: "f", value: 1.0 },
		map: { type: "t", value: THREE.ImageUtils.loadTexture( "textures/water1024.png" ) }
	 };

	// var waterTexture = THREE.ImageUtils.loadTexture("textures/water1024.png");
	// waterTexture.premultiplyAlpha = false;
	// waterTexture.wrapS = THREE.RepeatWrapping;
	// waterTexture.wrapT = THREE.RepeatWrapping;
	// waterTexture.repeat.x = 32;
	// waterTexture.repeat.y = 32;
	//waterTexture.generateMipmaps = false;
	//waterTexture.minFilter = THREE.NearestFilter;
	//waterTexture.magFilter = THREE.NearestFilter;
	
	//GEOMETRY
	var radii = [0, 10, 40, 90, 160, 250, 360, 490, 640, 810, 1000, 1210, 1440, 1690, 1960, 2250, 2560, 2890, 3240, 3610, 4000, 4410, 4840, 5290, 5760, 6250, 6760, 7290, 7840, 8410, 9000, 9610, 10240, 10890, 11560, 12250, 12960, 13690, 14440, 15210, 16000, 16810, 17640, 18490, 19360, 20250, 21160, 22090, 23040, 24010, 25000, 26010, 27040, 28090, 29160, 30250, 31360, 32490, 33640, 34810, 36000, 37210, 38440, 39690];

	waterGeometry = new THREE.Geometry();
	
	for(var j = 0; j < 64; j++) {	//orig. 512
		for (var i = 0; i < 64; i++) {
			var A = (i*Math.PI*2.0)/64.0;
			var dX = Math.cos(A), dY = Math.sin(A);
			
			waterGeometry.vertices.push(new THREE.Vector3(dX*radii[j], 0, dY*radii[j]));
		}
	}

	for (var i = 0; i < 64+1; i++) {
		for(j = 0; j < 64-1; j++) {
			var Ind = [j*64+(i%64), (j+1)*64+(i%64), (j+1)*64+((i+1)%64), (j)*64+((i+1)%64)];
			
			waterGeometry.faces.push(new THREE.Face3(Ind[2], Ind[1], Ind[0], new THREE.Vector3(0,1,0)));
			waterGeometry.faces.push(new THREE.Face3(Ind[3], Ind[2], Ind[0], new THREE.Vector3(0,1,0)));
			
		}
	}
	waterGeometry.elementsNeedUpdate = true;
	waterGeometry.verticesNeedUpdate = true;

	waterMesh = new THREE.Mesh(waterGeometry, new THREE.ShaderMaterial({
		uniforms: waterUniforms,
		shading: THREE.SmoothShading,
		//color: new THREE.Color(0x0067aa),
		vertexShader: 
		[ 	"uniform float amplitude;",
			"uniform float frequency;",
			"uniform float time;",
			"uniform sampler2D map;",
			//"varying vec3 vColor;",
			"varying vec4 wvLightFront;",
			"varying vec3 triplaneNormal;",
			"varying vec2 xyUv;",
			"varying vec2 xzUv;",
			"varying vec2 yzUv;",

			"void main() {",
			//triplanar mapping
			"xyUv = vec2(position.x, position.y);",
			"xzUv = vec2(position.x, position.z);",
			"yzUv = vec2(position.y, position.z);",
			
			"	wvLightFront = vec4(1,1,1,1);",
			"	vec4 mvPosition = vec4(position, 1.0);",
			"	mvPosition.y = amplitude * ( sin( position.x * frequency - time ) + sin( position.z * frequency - time ) );",
			"	vec3 triplaneNormal = cross( vec3(1, amplitude * frequency * cos(time - frequency * mvPosition.x), 0),",
			"							vec3(0, amplitude * frequency * cos(time - frequency * mvPosition.z), 1));",
			"	normalize(triplaneNormal);",
			"	wvLightFront = -dot( normalize( vec3( 0.8, .3, 0.0 ) ), triplaneNormal ) * vec4( 0.0,0.2,0.5,1.0 );",
			"	mvPosition = modelViewMatrix * mvPosition;",
			"	gl_Position = projectionMatrix * mvPosition;",
			"}"
		].join("\n"),
		fragmentShader: 
		[	"uniform sampler2D map;",
			"varying vec4 wvLightFront;",
			"varying vec3 triplaneNormal;",
			"varying vec2 xyUv;",
			"varying vec2 xzUv;",
			"varying vec2 yzUv;",
			
			"void main() {",
			"	gl_FragColor =  wvLightFront;",
			"}"	
		].join("\n")
	}));

	scene.add(waterMesh);
}

function animate() {

	requestAnimationFrame(animate);
	render();
	stats.update();
	
}

function waveDisplacement() {

	var amp = 500;
	var t = waterUniforms.time.value;
	//var t = clock.elapsedTime;	
	
	// for( var i =0; i < waterGeometry.vertices.length; ++i) {
		// var vert = waterGeometry.vertices[i];
		// waterGeometry.vertices[i].y = amp * Math.sin(vert.x * 0.0002  - t);
		// waterGeometry.vertices[i].y += amp * Math.sin(vert.z * 0.0002  - t);
	// }
	
	// waterGeometry.computeFaceNormals();
	// waterGeometry.computeVertexNormals();	
	// waterGeometry.verticesNeedUpdate = true;
	// waterGeometry.normalsNeedUpdate = true;
	if( boat ) {	
		boat.position.y = waterUniforms.amplitude.value * 
			( Math.sin( boat.position.x * waterUniforms.frequency.value - t ) + Math.sin( boat.position.z * waterUniforms.frequency.value - t ) );
		// boat.position.y = amp * Math.sin(boat.position.x * waterUniforms.frequency - t);
		// boat.position.y = amp * Math.sin(boat.position.x * waterUniforms.frequency - t);
	}
}

function render() {
	var delta = clock.getDelta();
	skyboxCamera.setRotationFromQuaternion(camera.quaternion);	//three.67
	renderer.render(skyboxScene, skyboxCamera, null, true);
	controls.update(delta);
	waveDisplacement();
	renderer.render(scene, camera);
	waterUniforms.time.value += 0.8 * delta;
}