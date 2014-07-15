/*	Licensed under The MIT License http://en.wikipedia.org/wiki/MIT_License

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
	to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
	sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	*/

PELINAL.ShaderLib = {
	Ocean : {
		vertexShader:
		[
			"uniform vec2 rephase;",
			"uniform float amplitude;",
			"uniform float frequency;",
			"uniform float time;",
			"uniform sampler2D map;",
			"varying vec2 vUv;",
			"varying vec3 vViewPosition;",
			"varying vec3 vNormal;",
			"#if MAX_SPOT_LIGHTS > 0",
			"	varying vec3 vWorldPosition;",
			"#endif",

			"void main() {",
			"	//world space -> tex coords",
			"	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			"	vUv = vec2(worldPosition.x, worldPosition.z);",

			"	vec4 wavePosition = vec4(worldPosition);",
			"	wavePosition.y = amplitude * ( sin( wavePosition.x * frequency - time ) + sin( wavePosition.z * frequency - time ) );",

			"	vec3 objectNormal = (cross( vec3(0, amplitude * frequency * cos(time - frequency * wavePosition.z), 1), vec3(1, amplitude * frequency * cos(time - frequency * wavePosition.x), 0) ) );",
			"	objectNormal = normalize( objectNormal );",
			"	vec3 transformedNormal = normalMatrix * objectNormal;",
			"	vNormal = normalize( transformedNormal );",

			"	vec4 mvPosition = modelViewMatrix * vec4( position.x, wavePosition.y, position.z, 1.0 );",
			"	gl_Position = projectionMatrix * mvPosition;",
			"	vViewPosition = -mvPosition.xyz;",
			

			"	#if MAX_SPOT_LIGHTS > 0",
					"vWorldPosition = worldPosition.xyz;",
			"	#endif",
			"}"
		].join( "\n" ),

		fragmentShader:
		[
			"uniform vec3 diffuse;",
			"uniform float opacity;",
			"uniform vec3 ambient;",
			"uniform vec3 emissive;",
			"uniform vec3 specular;",
			"uniform float shininess;",
			"uniform vec3 ambientLightColor;",
			"#if MAX_DIR_LIGHTS > 0",
			"	uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];",
			"	uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];",
			"#endif",
			"#if MAX_HEMI_LIGHTS > 0",
			"	uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];",
			"	uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];",
			"	uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];",
			"#endif",
			"#if MAX_POINT_LIGHTS > 0",
			"	uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];",
			"	uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];",
			"	uniform float pointLightDistance[ MAX_POINT_LIGHTS ];",
			"#endif",
			"#if MAX_SPOT_LIGHTS > 0",
			"	uniform vec3 spotLightColor[ MAX_SPOT_LIGHTS ];",
			"	uniform vec3 spotLightPosition[ MAX_SPOT_LIGHTS ];",
			"	uniform vec3 spotLightDirection[ MAX_SPOT_LIGHTS ];",
			"	uniform float spotLightAngleCos[ MAX_SPOT_LIGHTS ];",
			"	uniform float spotLightExponent[ MAX_SPOT_LIGHTS ];",
			"	uniform float spotLightDistance[ MAX_SPOT_LIGHTS ];",
			"#endif",
			"#if MAX_SPOT_LIGHTS > 0",
			"	varying vec3 vWorldPosition;",
			"#endif",
			"varying vec3 vViewPosition;",
			"varying vec3 vNormal;",

			"uniform float time;",
			"uniform sampler2D map;",
			"varying vec2 vUv;",

			"void main() {",
			"	gl_FragColor = vec4( vec3( 1.0 ), opacity );",
			"	vec2 uv = vec2(vUv.x + time*300.0, vUv.y);",
			"	uv = fract(uv/3000.0);",

			"	vec4 texelColor = texture2D( map, uv );",
			"	gl_FragColor = gl_FragColor * texelColor;",

			"	float specularStrength = 1.0;",

			"	vec3 normal = normalize( vNormal );",
			"	vec3 viewPosition = normalize( vViewPosition );",

			"	#if MAX_POINT_LIGHTS > 0",
			"		vec3 pointDiffuse  = vec3( 0.0 );",
			"		vec3 pointSpecular = vec3( 0.0 );",
			"		for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",
			"			vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
			"			vec3 lVector = lPosition.xyz + vViewPosition.xyz;",
			"			float lDistance = 1.0;",
			"			if ( pointLightDistance[ i ] > 0.0 )",
			"				lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );",
			"			lVector = normalize( lVector );",
			"			float dotProduct = dot( normal, lVector );",
			"			#ifdef WRAP_AROUND",
			"				float pointDiffuseWeightFull = max( dotProduct, 0.0 );",
			"				float pointDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );",
			"				vec3 pointDiffuseWeight = mix( vec3( pointDiffuseWeightFull ), vec3( pointDiffuseWeightHalf ), wrapRGB );",
			"			#else",
			"				float pointDiffuseWeight = max( dotProduct, 0.0 );",
			"			#endif",
			"			pointDiffuse  += diffuse * pointLightColor[ i ] * pointDiffuseWeight * lDistance;",
			"			vec3 pointHalfVector = normalize( lVector + viewPosition );",
			"			float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );",
			"			float pointSpecularWeight = specularStrength * max( pow( pointDotNormalHalf, shininess ), 0.0 );",
			"			float specularNormalization = ( shininess + 2.0001 ) / 8.0;",
			"			vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, pointHalfVector ), 0.0 ), 5.0 );",
			"			pointSpecular += schlick * pointLightColor[ i ] * pointSpecularWeight * pointDiffuseWeight * lDistance * specularNormalization;",
			"		}",
			"	#endif",
			"	#if MAX_SPOT_LIGHTS > 0",
			"		vec3 spotDiffuse  = vec3( 0.0 );",
			"		vec3 spotSpecular = vec3( 0.0 );",
			"		for ( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {",
			"			vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );",
			"			vec3 lVector = lPosition.xyz + vViewPosition.xyz;",
			"			float lDistance = 1.0;",
			"			if ( spotLightDistance[ i ] > 0.0 )",
			"				lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );",
			"			lVector = normalize( lVector );",
			"			float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - vWorldPosition ) );",
			"			if ( spotEffect > spotLightAngleCos[ i ] ) {",
			"				spotEffect = max( pow( spotEffect, spotLightExponent[ i ] ), 0.0 );",
			"				float dotProduct = dot( normal, lVector );",
			"				#ifdef WRAP_AROUND",
			"					float spotDiffuseWeightFull = max( dotProduct, 0.0 );",
			"					float spotDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );",
			"					vec3 spotDiffuseWeight = mix( vec3( spotDiffuseWeightFull ), vec3( spotDiffuseWeightHalf ), wrapRGB );",
			"				#else",
			"					float spotDiffuseWeight = max( dotProduct, 0.0 );",
			"				#endif",
			"				spotDiffuse += diffuse * spotLightColor[ i ] * spotDiffuseWeight * lDistance * spotEffect;",
			"				vec3 spotHalfVector = normalize( lVector + viewPosition );",
			"				float spotDotNormalHalf = max( dot( normal, spotHalfVector ), 0.0 );",
			"				float spotSpecularWeight = specularStrength * max( pow( spotDotNormalHalf, shininess ), 0.0 );",
			"				float specularNormalization = ( shininess + 2.0001 ) / 8.0;",
			"				vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, spotHalfVector ), 0.0 ), 5.0 );",
			"				spotSpecular += schlick * spotLightColor[ i ] * spotSpecularWeight * spotDiffuseWeight * lDistance * specularNormalization * spotEffect;",
			"			}",
			"		}",
			"	#endif",
			"	#if MAX_DIR_LIGHTS > 0",
			"		vec3 dirDiffuse  = vec3( 0.0 );",
			"		vec3 dirSpecular = vec3( 0.0 );",
			"		for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {",
			"			vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
			"			vec3 dirVector = normalize( lDirection.xyz );",
			"			float dotProduct = dot( normal, dirVector );",
			"			#ifdef WRAP_AROUND",
			"				float dirDiffuseWeightFull = max( dotProduct, 0.0 );",
			"				float dirDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );",
			"				vec3 dirDiffuseWeight = mix( vec3( dirDiffuseWeightFull ), vec3( dirDiffuseWeightHalf ), wrapRGB );",
			"			#else",
			"				float dirDiffuseWeight = max( dotProduct, 0.0 );",
			"			#endif",
			"			dirDiffuse  += diffuse * directionalLightColor[ i ] * dirDiffuseWeight;",
			"			vec3 dirHalfVector = normalize( dirVector + viewPosition );",
			"			float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );",
			"			float dirSpecularWeight = specularStrength * max( pow( dirDotNormalHalf, shininess ), 0.0 );",
			"			float specularNormalization = ( shininess + 2.0001 ) / 8.0;",
			"			vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );",
			"			dirSpecular += schlick * directionalLightColor[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;",
			"		}",
			"	#endif",
			"	#if MAX_HEMI_LIGHTS > 0",
			"		vec3 hemiDiffuse  = vec3( 0.0 );",
			"		vec3 hemiSpecular = vec3( 0.0 );",
			"		for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",
			"			vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );",
			"			vec3 lVector = normalize( lDirection.xyz );",
			"			float dotProduct = dot( normal, lVector );",
			"			float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",
			"			vec3 hemiColor = mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );",
			"			hemiDiffuse += diffuse * hemiColor;",
			"			vec3 hemiHalfVectorSky = normalize( lVector + viewPosition );",
			"			float hemiDotNormalHalfSky = 0.5 * dot( normal, hemiHalfVectorSky ) + 0.5;",
			"			float hemiSpecularWeightSky = specularStrength * max( pow( hemiDotNormalHalfSky, shininess ), 0.0 );",
			"			vec3 lVectorGround = -lVector;",
			"			vec3 hemiHalfVectorGround = normalize( lVectorGround + viewPosition );",
			"			float hemiDotNormalHalfGround = 0.5 * dot( normal, hemiHalfVectorGround ) + 0.5;",
			"			float hemiSpecularWeightGround = specularStrength * max( pow( hemiDotNormalHalfGround, shininess ), 0.0 );",
			"			float dotProductGround = dot( normal, lVectorGround );",
			"			float specularNormalization = ( shininess + 2.0001 ) / 8.0;",
			"			vec3 schlickSky = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, hemiHalfVectorSky ), 0.0 ), 5.0 );",
			"			vec3 schlickGround = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVectorGround, hemiHalfVectorGround ), 0.0 ), 5.0 );",
			"			hemiSpecular += hemiColor * specularNormalization * ( schlickSky * hemiSpecularWeightSky * max( dotProduct, 0.0 ) + schlickGround * hemiSpecularWeightGround * max( dotProductGround, 0.0 ) );",
			"		}",
			"	#endif",

			"	vec3 totalDiffuse = vec3( 0.0 );",
			"	vec3 totalSpecular = vec3( 0.0 );",
			"	#if MAX_DIR_LIGHTS > 0",
			"		totalDiffuse += dirDiffuse;",
			"		totalSpecular += dirSpecular;",
			"	#endif",
			"	#if MAX_HEMI_LIGHTS > 0",
			"		totalDiffuse += hemiDiffuse;",
			"		totalSpecular += hemiSpecular;",
			"	#endif",
			"	#if MAX_POINT_LIGHTS > 0",
			"		totalDiffuse += pointDiffuse;",
			"		totalSpecular += pointSpecular;",
			"	#endif",
			"	#if MAX_SPOT_LIGHTS > 0",
			"		totalDiffuse += spotDiffuse;",
			"		totalSpecular += spotSpecular;",
			"	#endif",			
			"	totalDiffuse = floor( totalDiffuse * 10.0 ) * 0.1;",	// cel-shading. don't think i want this on ocean...
			"		gl_FragColor.xyz = gl_FragColor.xyz * ( emissive + totalDiffuse + ambientLightColor * ambient + totalSpecular );",
			"}"
		].join( "\n" )
	},
	
	Landmass: {
		vertexShader: [
			//attribute vec3 position;		// typical attributes done for us by three.js
			//attribute mat4 modelMatrix;
			//attribute mat4 modelViewMatrix
			//attribute mat4 projectionMatrix
			//attribute mat3 normalMatrix
			//attribute vec3 normal;
			"uniform sampler2D cliffMap;",
			"uniform sampler2D sandMap;",
			"uniform sampler2D grassMap;",
			"varying vec3 vNormal;",
			"varying vec3 vViewPosition;",
			"varying vec3 vWorldPosition;",
			
			"void main() {",
			"	//world space -> tex coords",
			"	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			"	vNormal = normal;",

			"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
			"	vViewPosition = -1.0 * vec3( position );",			

			"	vWorldPosition = worldPosition.xyz;",
			"}"
		].join( "\n" ),
		fragmentShader:
		[
			"uniform sampler2D cliffMap;",
			"uniform sampler2D sandMap;",
			"uniform sampler2D grassMap;",
			"varying vec3 vNormal;",
			"varying vec3 vViewPosition;",
			"varying vec3 vWorldPosition;",
			
			"void main() {",
			"	vec2 xyUv = vec2( vWorldPosition.x, vWorldPosition.y );",
			"	vec2 xzUv = vec2( vWorldPosition.x, vWorldPosition.z );",
			"	vec2 yzUv = vec2( vWorldPosition.z, vWorldPosition.y );",	// note!
			
			"	vec3 trip = abs( normalize( vNormal ) );",
			"	trip = ( trip - vec3( 0.0, 0.2, 0.0 ) ) * 7.0;", 
			"	trip.x = max( trip.x, 0.0 );",
			"	trip.y = max( trip.y, 0.0 );",
			"	trip.z = max( trip.z, 0.0 );",
			"	trip /= ( trip.x + trip.y + trip.z );",
			
			"	vec2 xy = fract(xyUv/5000.0);",
			"	vec2 xz = fract(xzUv/500.0);",
			"	vec2 yz = fract(yzUv/5000.0);",
			"	gl_FragColor = ( trip.x * texture2D( cliffMap, yz ) )",
			"		+ ( mix( trip.y * texture2D( sandMap, xz ), trip.y * texture2D( grassMap, xz ), min( 1.0, vWorldPosition.y / 2400.0 ) ) );",	// todo; this fades from sand to grass as you go up. want something more generalizable/looks better
			"		+ ( trip.z * texture2D( cliffMap, xy ) );",
			"}"
		].join( "\n" )
	}
};