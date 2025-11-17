import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MorphingGeometry({ 
  position = [0, 0, 0], 
  scale = 1,
  color = '#00a651',
  speed = 1
}) {
  const meshRef = useRef();
  const geometryRef = useRef();
  
  // Create base geometries for morphing
  const createGeometries = () => {
    const geo1 = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);
    const geo2 = new THREE.SphereGeometry(0.7, 32, 32);
    const geo3 = new THREE.TorusGeometry(0.6, 0.3, 32, 32);
    const geo4 = new THREE.OctahedronGeometry(0.8, 3);
    
    return [geo1, geo2, geo3, geo4];
  };
  
  const geometries = createGeometries();
  
  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current) return;
    
    const time = state.clock.elapsedTime * speed;
    
    // Cycle through geometries
    const geometryIndex = Math.floor(time / 3) % geometries.length;
    const nextIndex = (geometryIndex + 1) % geometries.length;
    const mixFactor = (time % 3) / 3;
    
    // Get position attributes
    const currentGeo = geometries[geometryIndex];
    const nextGeo = geometries[nextIndex];
    
    const currentPos = currentGeo.attributes.position.array;
    const nextPos = nextGeo.attributes.position.array;
    const targetPos = geometryRef.current.attributes.position.array;
    
    // Morph between geometries
    for (let i = 0; i < targetPos.length; i += 3) {
      const currentIndex = i % currentPos.length;
      const nextIndexPos = i % nextPos.length;
      
      targetPos[i] = THREE.MathUtils.lerp(
        currentPos[currentIndex],
        nextPos[nextIndexPos],
        mixFactor
      );
      targetPos[i + 1] = THREE.MathUtils.lerp(
        currentPos[currentIndex + 1],
        nextPos[nextIndexPos + 1],
        mixFactor
      );
      targetPos[i + 2] = THREE.MathUtils.lerp(
        currentPos[currentIndex + 2],
        nextPos[nextIndexPos + 2],
        mixFactor
      );
    }
    
    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
    
    // Rotation animation
    meshRef.current.rotation.x += 0.005;
    meshRef.current.rotation.y += 0.007;
    
    // Floating animation
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.2;
  });
  
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <bufferGeometry ref={geometryRef} attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={geometries[0].attributes.position.count}
          array={new Float32Array(geometries[0].attributes.position.array)}
          itemSize={3}
        />
      </bufferGeometry>
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}
