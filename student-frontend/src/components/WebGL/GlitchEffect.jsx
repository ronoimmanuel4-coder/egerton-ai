import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { glitchVertexShader, glitchFragmentShader } from '../../shaders/glitchShader';
import * as THREE from 'three';

extend({ ShaderPass });

export default function GlitchEffect({ intensity = 0.3 }) {
  const glitchRef = useRef();
  
  const shader = useMemo(() => ({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader: glitchVertexShader,
    fragmentShader: glitchFragmentShader,
  }), [intensity]);
  
  useFrame((state) => {
    if (glitchRef.current) {
      glitchRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  return <shaderPass ref={glitchRef} args={[shader]} />;
}
