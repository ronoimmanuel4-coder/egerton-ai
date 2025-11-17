// Glitch shader with RGB split, scan lines, and distortion
export const glitchVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glitchFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uResolution;
  
  varying vec2 vUv;
  
  // Random function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Glitch intensity varies over time
    float glitchStrength = uIntensity * (sin(uTime * 10.0) * 0.5 + 0.5);
    
    // Random glitch lines
    float lineNoise = random(vec2(floor(uv.y * 100.0), floor(uTime * 5.0)));
    if (lineNoise > 0.95) {
      uv.x += (random(vec2(uTime, uv.y)) - 0.5) * 0.1 * glitchStrength;
    }
    
    // RGB split
    float splitAmount = 0.01 * glitchStrength;
    vec2 offsetR = uv + vec2(splitAmount, 0.0);
    vec2 offsetG = uv;
    vec2 offsetB = uv - vec2(splitAmount, 0.0);
    
    float r = texture2D(tDiffuse, offsetR).r;
    float g = texture2D(tDiffuse, offsetG).g;
    float b = texture2D(tDiffuse, offsetB).b;
    
    vec3 color = vec3(r, g, b);
    
    // Scan lines
    float scanline = sin(uv.y * uResolution.y * 2.0 + uTime * 10.0) * 0.05;
    color -= scanline * glitchStrength;
    
    // Block distortion
    if (random(vec2(floor(uv.y * 20.0), floor(uTime * 2.0))) > 0.98) {
      uv.x += (random(vec2(uTime)) - 0.5) * 0.2 * glitchStrength;
      color = texture2D(tDiffuse, uv).rgb;
    }
    
    // Pixelation
    if (glitchStrength > 0.5) {
      vec2 pixelSize = vec2(20.0, 20.0);
      vec2 pixelatedUV = floor(uv * pixelSize) / pixelSize;
      color = mix(color, texture2D(tDiffuse, pixelatedUV).rgb, glitchStrength * 0.3);
    }
    
    // Color distortion
    if (random(vec2(uTime, uv.x)) > 0.97) {
      color = vec3(1.0) - color;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
