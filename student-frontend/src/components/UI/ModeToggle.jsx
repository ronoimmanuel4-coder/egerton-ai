import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';

export default function ModeToggle({ position = [0, 0, 0] }) {
  const groupRef = useRef();
  const sunRef = useRef();
  const moonRef = useRef();
  const { darkMode, toggleDarkMode } = useStore();
  
  useFrame((state) => {
    if (groupRef.current) {
      // Orbit animation
      const time = state.clock.elapsedTime;
      
      if (sunRef.current) {
        sunRef.current.position.x = Math.cos(time) * 0.8;
        sunRef.current.position.y = Math.sin(time) * 0.8;
        sunRef.current.rotation.y = time;
      }
      
      if (moonRef.current) {
        moonRef.current.position.x = Math.cos(time + Math.PI) * 0.8;
        moonRef.current.position.y = Math.sin(time + Math.PI) * 0.8;
        moonRef.current.rotation.y = time;
      }
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Track */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 16, 100]} />
        <meshStandardMaterial
          color={darkMode ? '#00a651' : '#d2ac67'}
          emissive={darkMode ? '#00a651' : '#d2ac67'}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Sun */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={darkMode ? 0.3 : 1}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>
      
      {/* Moon */}
      <mesh ref={moonRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color="#c0c0c0"
          emissive="#c0c0c0"
          emissiveIntensity={darkMode ? 1 : 0.3}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>
      
      {/* Interactive Button */}
      <Html
        transform
        distanceFactor={10}
        position={[0, -1.5, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            darkMode
              ? 'bg-gray-800 text-white border border-egerton-green'
              : 'bg-white text-black border border-egerton-gold'
          }`}
        >
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </motion.button>
      </Html>
    </group>
  );
}
