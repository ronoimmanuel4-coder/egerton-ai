import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export default function FloatingOrb({ position = [0, 0, 0], scale = 1, isActive = false, name = 'floating-orb' }) {
  const orbRef = useRef();
  const glowRef = useRef();
  
  // Create pulsing animation
  useFrame((state) => {
    if (orbRef.current) {
      const time = state.clock.elapsedTime;
      
      // Gentle floating motion
      orbRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.3;
      
      // Rotation
      orbRef.current.rotation.x = time * 0.2;
      orbRef.current.rotation.y = time * 0.3;
      
      // Pulsing scale
      const pulseScale = isActive ? 1 + Math.sin(time * 2) * 0.1 : 1 + Math.sin(time) * 0.05;
      orbRef.current.scale.set(scale * pulseScale, scale * pulseScale, scale * pulseScale);
    }
    
    // Glow effect
    if (glowRef.current) {
      const time = state.clock.elapsedTime;
      glowRef.current.material.opacity = 0.2 + Math.sin(time * 1.5) * 0.1;
    }
  });
  
  // Create particle field around orb
  const particles = useMemo(() => {
    const temp = [];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.5 + Math.random() * 0.5;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      temp.push({ position: [x, y, z], delay: Math.random() * 2 });
    }
    
    return temp;
  }, []);
  
  return (
    <group position={position} name={name}>
      {/* Main orb */}
      <Sphere ref={orbRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#00a651"
          attach="material"
          distort={0.3}
          speed={isActive ? 3 : 1.5}
          roughness={0.1}
          metalness={0.8}
          emissive="#00a651"
          emissiveIntensity={isActive ? 0.8 : 0.4}
        />
      </Sphere>
      
      {/* Outer glow */}
      <Sphere ref={glowRef} args={[1.3, 32, 32]}>
        <meshBasicMaterial
          color="#00a651"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Particle field */}
      {particles.map((particle, i) => (
        <Particle key={i} position={particle.position} delay={particle.delay} />
      ))}
      
      {/* Energy rings when active */}
      {isActive && (
        <>
          <EnergyRing radius={1.5} speed={1} />
          <EnergyRing radius={1.8} speed={-0.8} />
          <EnergyRing radius={2.1} speed={1.2} />
        </>
      )}
    </group>
  );
}

function Particle({ position, delay }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime + delay;
      ref.current.material.opacity = 0.3 + Math.sin(time * 2) * 0.2;
    }
  });
  
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color="#d2ac67" transparent opacity={0.5} />
    </mesh>
  );
}

function EnergyRing({ radius, speed }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * speed;
      ref.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });
  
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.05, 64]} />
      <meshBasicMaterial color="#00a651" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}
