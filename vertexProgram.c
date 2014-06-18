"
  //stock three.js attributes
attribute vec3 position; 		//the vertex itself
//attribute vec3 normal;		//the normal at the current vertex
//attribute vec2 uv; 			//the texture coord
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix; 		//object-to-world matrix
uniform mat4 viewMatrix;		//world-to-camera matrix
uniform mat4 modelViewMatrix;	//object-to-camera matrix

uniform float amplitude;
uniform float frequency;
uniform float time;
uniform sampler2D map;
varying vec3 vColor;

void main() {
  //vColor = color;
	vec4 mvPosition = vec4(position, 1.0);
	
	//waterGeometry.vertices[i].y = amp * Math.sin(vert.x * 0.0002  - t);
	//waterGeometry.vertices[i].y += amp * Math.sin(vert.z * 0.0002  - t)
	
	mvPosition.y = amplitude * sin(position.x * frequency - time);
	mvPosition.y = amplitude * sin(position.z * frequency - time);
	
	mvPosition = modelViewMatrix * mvPosition;
	gl_Position = projectionMatrix * mvPosition;
	
	//vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
}"