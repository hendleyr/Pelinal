varying vec3 vLightFront;
varying vec3 position;
uniform sampler2D map;
const float scale = 1.0;

void main() {

	//vec4 texelColor = texture2D( map, vUv );
	gl_FragColor = gl_FragColor * texelColor;

	gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

}


