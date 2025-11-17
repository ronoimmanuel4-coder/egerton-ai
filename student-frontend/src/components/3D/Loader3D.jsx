import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import useLoaderController from '../../hooks/useLoaderController';

// 3D Maize Cob Mesh
function MaizeCob() {
  const meshRef = useRef();
  const particlesRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Rotate the cob
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    
    if (particlesRef.current) {
      // Orbit particles around cob
      particlesRef.current.rotation.y += 0.02;
      particlesRef.current.rotation.x += 0.005;
    }
  });
  
  // Create particle positions
  const particleCount = 50;
  const positions = new Float32Array(particleCount * 3);
  const radius = 2.5;
  
  for (let i = 0; i < particleCount; i++) {
    const theta = (i / particleCount) * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  
  return (
    <group>
      {/* Main Maize Cob */}
      <mesh ref={meshRef}>
        {/* Cob body - cylinder with bumpy surface */}
        <cylinderGeometry args={[0.4, 0.5, 2, 16, 8]} />
        <meshStandardMaterial
          color="#f4e4a6"
          roughness={0.6}
          metalness={0.1}
          emissive="#d4b896"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Kernel bumps on cob */}
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * Math.PI * 8;
        const y = (i % 10) * 0.2 - 1;
        const x = Math.cos(angle) * 0.45;
        const z = Math.sin(angle) * 0.45;
        
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#ffe66d"
              roughness={0.4}
              metalness={0.2}
            />
          </mesh>
        );
      })}
      
      {/* Glowing green particles orbiting */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color="#00a651"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      
      {/* Glow effect around particles */}
      <pointLight position={[0, 0, 0]} color="#00a651" intensity={1} distance={5} />
    </group>
  );
}

// Gold Progress Ring
function ProgressRing({ progress }) {
  const ringRef = useRef();
  
  useEffect(() => {
    if (ringRef.current) {
      // Update ring arc based on progress
      const angle = (progress / 100) * Math.PI * 2;
      ringRef.current.geometry.dispose();
      ringRef.current.geometry = new THREE.RingGeometry(2, 2.2, 64, 1, 0, angle);
    }
  }, [progress]);
  
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
      <ringGeometry args={[2, 2.2, 64, 1, 0, 0]} />
      <meshStandardMaterial
        color="#d2ac67"
        emissive="#d2ac67"
        emissiveIntensity={0.5}
        side={THREE.DoubleSide}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

// Ripple Dissolve Effect
function RippleDissolve({ active }) {
  const ripplesRef = useRef([]);
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current && active) {
      groupRef.current.children.forEach((ripple, i) => {
        const scale = 1 + state.clock.elapsedTime * 2 + i * 0.5;
        ripple.scale.set(scale, scale, 1);
        ripple.material.opacity = Math.max(0, 1 - scale / 10);
      });
    }
  });
  
  if (!active) return null;
  
  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0, -5]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial
            color="#00a651"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// 3D Scene for Loader
function LoaderScene({ progress, dissolving }) {
  return (
    <>
      {/* Camera and Lighting */}
      <perspectiveCamera position={[0, 0, 8]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#00a651" />
      
      {/* Main Elements */}
      <MaizeCob />
      <ProgressRing progress={progress} />
      <RippleDissolve active={dissolving} />
      
      {/* Environment */}
      <mesh position={[0, 0, -10]}>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} />
      </mesh>
    </>
  );
}

// Main Loader Component
export default function Loader3D({ onExitStart, onComplete }) {
  const { progress } = useProgress();
  const { displayProgress, canExit, dissolving } = useLoaderController({
    progress,
    minDuration: 5000,
    maxDuration: 10000,
    dissolveDuration: 1500,
    onExitStart,
    onComplete,
    enableLogging: false,
    logLabel: 'Loader3D',
  });
  
  return (
    <AnimatePresence>
      {!canExit || dissolving ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="fixed inset-0 z-50 bg-black"
        >
          {/* 3D Canvas */}
          <Canvas>
            <LoaderScene progress={progress} dissolving={dissolving} />
          </Canvas>
          
          {/* Progress Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Main Loading Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
                Awakening Egerton AI
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  …
                </motion.span>
              </h1>
              
              <p className="text-lg text-egerton-gold tracking-widest uppercase">
                Initializing 3D Experience
              </p>
            </motion.div>
            
            {/* Progress Percentage */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="text-8xl font-black text-egerton-green mb-2">
                {Math.round(displayProgress)}
                <span className="text-5xl">%</span>
              </div>
              
              {/* Progress Bar (2D backup) */}
              <div className="w-80 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-egerton-green via-egerton-gold to-egerton-green"
                  initial={{ width: '0%' }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <p className="text-sm text-white/50 mt-4 tracking-wider">
                {displayProgress < 30 && 'Loading 3D models...'}
                {displayProgress >= 30 && displayProgress < 60 && 'Preparing campus scene...'}
                {displayProgress >= 60 && displayProgress < 90 && 'Initializing AI systems...'}
                {displayProgress >= 90 && displayProgress < 100 && 'Almost there...'}
                {displayProgress === 100 && 'Ready! 🌽'}
              </p>
            </motion.div>
            
            {/* Egerton Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-8 text-center"
            >
              <p className="text-2xl font-black text-white">
                Egerton<span className="text-egerton-green">.</span>
              </p>
              <p className="text-xs text-white/50 tracking-widest uppercase mt-1">
                Sic Donec Fleat
              </p>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
