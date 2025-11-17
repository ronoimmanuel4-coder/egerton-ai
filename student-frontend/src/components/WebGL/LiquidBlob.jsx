import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { liquidVertexShader, liquidFragmentShader } from '../../shaders/liquidShader';

export default function LiquidBlob({ 
  position = [0, 0, 0], 
  scale = 1, 
  intensity = 0.3,
  colors = ['#00a651', '#d2ac67', '#ed1c24']
}) {
  const meshRef = useRef();
  const mousePos = useRef({ x: 0, y: 0 });
  
  // Convert hex colors to RGB
  const rgbColors = useMemo(() => {
    return colors.map(color => {
      const c = new THREE.Color(color);
      return new THREE.Vector3(c.r, c.g, c.b);
    });
  }, [colors]);
  
  // Shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uIntensity: { value: intensity },
    uColor1: { value: rgbColors[0] },
    uColor2: { value: rgbColors[1] },
    uColor3: { value: rgbColors[2] },
    uOpacity: { value: 0.9 },
  }), [intensity, rgbColors]);
  
  // Mouse tracking
  useMemo(() => {
    const handleMouseMove = (event) => {
      mousePos.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Animation loop
  useFrame((state) => {
    if (meshRef.current) {
      // Update time
      uniforms.uTime.value = state.clock.elapsedTime;
      
      // Smooth mouse position
      uniforms.uMouse.value.lerp(
        new THREE.Vector2(mousePos.current.x, mousePos.current.y),
        0.05
      );
      
      // Gentle rotation
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      meshRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      {/* High-resolution sphere for smooth morphing */}
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        vertexShader={liquidVertexShader}
        fragmentShader={liquidFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
