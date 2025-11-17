import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox, Torus } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

export default function ProgressRing({ position }) {
  const groupRef = useRef();
  const progressData = [
    { label: 'Completed', value: 75, color: '#00a651' },
    { label: 'In Progress', value: 15, color: '#d2ac67' },
    { label: 'Pending', value: 10, color: '#ed1c24' },
  ];
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + 3) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + 3) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <RoundedBox args={[4, 5, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color="#007624"
          transparent
          opacity={0.15}
          roughness={0.3}
          metalness={0.7}
          emissive="#007624"
          emissiveIntensity={0.2}
        />
      </RoundedBox>
      
      <RoundedBox args={[3.9, 4.9, 0.15]} radius={0.1} smoothness={4} position={[0, 0, 0.1]}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          roughness={0.1}
          metalness={0}
          transmission={0.9}
          thickness={0.5}
        />
      </RoundedBox>
      
      {/* 3D Progress Donut Chart */}
      <group position={[0, 1, 0.5]}>
        <ProgressDonut data={progressData} />
      </group>
      
      <Html
        transform
        distanceFactor={5}
        position={[0, -1.5, 0.2]}
        style={{ width: '380px', pointerEvents: 'auto' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/80 backdrop-blur-xl rounded-2xl border border-egerton-dark-green/30 p-4 shadow-2xl"
          style={{ width: '380px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-egerton-dark-green/20">
            <div className="w-10 h-10 rounded-full bg-egerton-dark-green/20 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Progress Ring</h3>
              <p className="text-xs text-gray-400">Your learning journey</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {progressData.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 rounded-lg p-3 border border-white/10 text-center"
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: item.color }}
                >
                  {item.value}%
                </div>
                <div className="text-xs text-gray-400">{item.label}</div>
              </motion.div>
            ))}
          </div>
          
          {/* Recent Activities */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white mb-2">Recent Activity</h4>
            {[
              { text: 'Completed Math Quiz', time: '2 hours ago', icon: '✅' },
              { text: 'Started Physics Module', time: '5 hours ago', icon: '🚀' },
              { text: 'Uploaded Chemistry Notes', time: 'Yesterday', icon: '📝' },
            ].map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
              >
                <span className="text-xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Html>
    </group>
  );
}

function ProgressDonut({ data }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });
  
  let currentAngle = 0;
  
  return (
    <group ref={groupRef}>
      {data.map((segment, i) => {
        const startAngle = currentAngle;
        const angle = (segment.value / 100) * Math.PI * 2;
        currentAngle += angle;
        
        return (
          <ProgressSegment
            key={i}
            startAngle={startAngle}
            angle={angle}
            color={segment.color}
            delay={i * 0.2}
          />
        );
      })}
      
      {/* Center glow */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#00a651" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function ProgressSegment({ startAngle, angle, color, delay }) {
  const segmentRef = useRef();
  
  useFrame((state) => {
    if (segmentRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.1;
      segmentRef.current.scale.set(pulse, pulse, pulse);
      
      // Glow effect
      segmentRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.3;
    }
  });
  
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 1.5;
    const innerRadius = 0.9;
    const segments = 32;
    
    // Outer arc
    for (let i = 0; i <= segments; i++) {
      const theta = startAngle + (angle * i) / segments;
      const x = Math.cos(theta) * outerRadius;
      const y = Math.sin(theta) * outerRadius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    
    // Inner arc (reverse)
    for (let i = segments; i >= 0; i--) {
      const theta = startAngle + (angle * i) / segments;
      const x = Math.cos(theta) * innerRadius;
      const y = Math.sin(theta) * innerRadius;
      shape.lineTo(x, y);
    }
    
    shape.closePath();
    
    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [startAngle, angle]);
  
  return (
    <mesh ref={segmentRef} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.7}
      />
    </mesh>
  );
}
