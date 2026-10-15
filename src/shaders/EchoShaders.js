import * as THREE from 'three';

/**
 * Iridescent Crystal PBR Shader with thin-film interference simulation
 */
export const CrystalShader = {
  uniforms: {
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color(0x0a0c1a) },
    uIridescenceA: { value: new THREE.Color(0x00f0ff) },
    uIridescenceB: { value: new THREE.Color(0xd946ef) }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = viewMatrix * worldPos;
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uIridescenceA;
    uniform vec3 uIridescenceB;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel edge lighting
      float fresnel = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
      float thinFilm = sin(fresnel * 7.0 + uTime * 1.5) * 0.5 + 0.5;

      vec3 colorShift = mix(uIridescenceA, uIridescenceB, thinFilm);
      vec3 finalColor = mix(uBaseColor, colorShift, pow(fresnel, 2.0) * 1.4);

      // Specular crystal glint
      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.7));
      vec3 halfVec = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfVec), 0.0), 32.0);

      finalColor += vec3(spec * 0.8);

      gl_FragColor = vec4(finalColor, 0.88);
    }
  `
};

/**
 * Spacetime Distortion Field Shader (Surrounds frozen Echo Sphere)
 */
export const SpacetimeDistortionShader = {
  uniforms: {
    uTime: { value: 0 },
    uDistortionIntensity: { value: 1.0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vViewDir = normalize(cameraPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uDistortionIntensity;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewDir;

    void main() {
      float fresnel = 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
      float wave = sin(vUv.y * 30.0 - uTime * 6.0) * 0.5 + 0.5;
      float rip = sin((vUv.x + vUv.y) * 40.0 + uTime * 4.0) * 0.5 + 0.5;

      vec3 cyanGlow = vec3(0.0, 0.94, 1.0);
      vec3 purpleGlow = vec3(0.85, 0.27, 0.94);

      vec3 haloColor = mix(cyanGlow, purpleGlow, wave);
      float alpha = (pow(fresnel, 2.5) * 0.8 + wave * rip * 0.25) * uDistortionIntensity;

      gl_FragColor = vec4(haloColor, alpha);
    }
  `
};

/**
 * Defying Gravity: Non-Newtonian Fluid Flow Shader
 */
export const NonNewtonianFluidShader = {
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // Flow animation along the tube UV
      float flow = sin((vUv.x * 20.0) - (uTime * 5.0)) * 0.5 + 0.5;
      float pulse = cos((vUv.y * 10.0) + (uTime * 3.0)) * 0.5 + 0.5;

      vec3 fluidColor = mix(vec3(0.0, 0.9, 1.0), vec3(0.7, 0.0, 1.0), flow);
      float edge = pow(1.0 - abs(vNormal.z), 1.5);

      gl_FragColor = vec4(fluidColor + edge * 0.5, 0.85 + pulse * 0.15);
    }
  `
};
