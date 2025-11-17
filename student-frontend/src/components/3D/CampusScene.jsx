import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Cloud, Stars } from '@react-three/drei';
import * as THREE from 'three';

export default function CampusScene() {
  return (
    <>
      {/* Sky and atmosphere */}
      <color attach="background" args={['#0a0a1a']} />
      <fog attach="fog" args={['#0a0a1a', 10, 50]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color="#d2ac67" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#00a651" />
      <spotLight
        position={[-10, 10, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.5}
        color="#ed1c24"
      />
      
      {/* Stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Campus ground */}
      <Ground />
      
      {/* Buildings */}
      <Building position={[-8, 0, -5]} height={4} color="#00a651" label="Science Block" />
      <Building position={[8, 0, -5]} height={3.5} color="#d2ac67" label="Library" />
      <Building position={[-4, 0, -10]} height={5} color="#007624" label="Admin" />
      <Building position={[4, 0, -10]} height={2.5} color="#ed1c24" label="Student Center" />
      <Building position={[0, 0, -15]} height={6} color="#00a651" label="Lecture Halls" />
      
      {/* Trees */}
      <Trees />
      
      {/* Clouds */}
      <Cloud position={[-10, 8, -20]} speed={0.2} opacity={0.3} />
      <Cloud position={[15, 10, -25]} speed={0.3} opacity={0.2} />
      <Cloud position={[0, 12, -30]} speed={0.1} opacity={0.4} />
      
      {/* Particle effects */}
      <ParticleField />
    </>
  );
}

function Ground() {
  return (
    <>
      {/* Main ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0f2718" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Grass patches */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#1a4d2e"
          roughness={1}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Pathways */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -5]}>
        <planeGeometry args={[2, 50]} />
        <meshStandardMaterial color="#4a5568" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[50, 2]} />
        <meshStandardMaterial color="#4a5568" roughness={0.9} />
      </mesh>
    </>
  );
}

function Building({ position, height, color, label }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      // Subtle glow pulse
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 + 0.3;
      ref.current.children[0].material.emissiveIntensity = pulse;
    }
  });
  
  return (
    <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.1}>
      <group ref={ref} position={position}>
        {/* Main building */}
        <mesh position={[0, height / 2, 0]} castShadow>
          <boxGeometry args={[3, height, 3]} />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            metalness={0.3}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Roof */}
        <mesh position={[0, height + 0.3, 0]}>
          <boxGeometry args={[3.2, 0.2, 3.2]} />
          <meshStandardMaterial color="#2d3748" roughness={0.8} />
        </mesh>
        
        {/* Windows */}
        {Array.from({ length: Math.floor(height) }).map((_, i) => (
          <Window key={i} position={[0, i * 1.5 + 1, 1.51]} />
        ))}
        
        {/* Glowing sign */}
        <mesh position={[0, height + 0.8, 0]}>
          <planeGeometry args={[2, 0.3]} />
          <meshBasicMaterial color="#00a651" transparent opacity={0.6} />
        </mesh>
      </group>
    </Float>
  );
}

function Window({ position }) {
  const ref = useRef();
  const glowing = Math.random() > 0.3;
  
  useFrame((state) => {
    if (ref.current && glowing) {
      const flicker = Math.random() > 0.95 ? 0.2 : 1;
      ref.current.material.opacity = 0.8 * flicker;
    }
  });
  
  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[0.4, 0.6]} />
      <meshBasicMaterial
        color={glowing ? '#ffd700' : '#333'}
        transparent
        opacity={glowing ? 0.8 : 0.3}
      />
    </mesh>
  );
}

function Trees() {
  const positions = useMemo(() => {
    const temp = [];
    // Random tree positions around campus
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const radius = 12 + Math.random() * 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      temp.push([x, 0, z]);
    }
    return temp;
  }, []);
  
  return (
    <>
      {positions.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}
    </>
  );
}

function Tree({ position }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color="#3d2817" roughness={1} />
      </mesh>
      
      {/* Foliage */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#1a4d2e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[0.6, 1.2, 8]} />
        <meshStandardMaterial color="#27663f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <coneGeometry args={[0.4, 0.9, 8]} />
        <meshStandardMaterial color="#34804d" roughness={0.9} />
      </mesh>
    </group>
  );
}

function ParticleField() {
  const particlesRef = useRef();
  const count = 1000;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const color1 = new THREE.Color('#00a651');
    const color2 = new THREE.Color('#d2ac67');
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      
      const mixColor = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixColor.r;
      colors[i * 3 + 1] = mixColor.g;
      colors[i * 3 + 2] = mixColor.b;
    }
    
    return { positions, colors };
  }, []);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
