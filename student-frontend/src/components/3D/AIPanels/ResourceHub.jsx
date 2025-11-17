import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { motion } from 'framer-motion';

export default function ResourceHub({ position }) {
  const groupRef = useRef();
  const [resources, setResources] = useState([
    { id: 1, title: 'Calculus I Textbook', type: 'PDF', size: '12.5 MB', color: '#00a651', icon: '📕' },
    { id: 2, title: 'Physics Notes', type: 'PDF', size: '8.2 MB', color: '#d2ac67', icon: '📘' },
    { id: 3, title: 'Chemistry Lab Manual', type: 'PDF', size: '15.8 MB', color: '#ed1c24', icon: '📗' },
    { id: 4, title: 'Programming Guide', type: 'PDF', size: '20.1 MB', color: '#007624', icon: '📙' },
    { id: 5, title: 'Statistics Handbook', type: 'PDF', size: '9.7 MB', color: '#bcbec1', icon: '📔' },
  ]);
  
  const [selectedBook, setSelectedBook] = useState(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + 2) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + 2) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <RoundedBox args={[4, 5, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color="#ed1c24"
          transparent
          opacity={0.15}
          roughness={0.3}
          metalness={0.7}
          emissive="#ed1c24"
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
      
      <Html
        transform
        distanceFactor={5}
        position={[0, 0, 0.2]}
        style={{ width: '380px', pointerEvents: 'auto' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/80 backdrop-blur-xl rounded-2xl border border-egerton-red/30 p-4 shadow-2xl"
          style={{ width: '380px', height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-egerton-red/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-egerton-red/20 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Resource Hub</h3>
                <p className="text-xs text-gray-400">{resources.length} resources</p>
              </div>
            </div>
            <button className="w-8 h-8 bg-egerton-red/20 rounded-full flex items-center justify-center text-egerton-red hover:bg-egerton-red/30 transition-all">
              <span className="text-sm">⟳</span>
            </button>
          </div>
          
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:border-egerton-red/50"
            />
          </div>
          
          {/* 3D Bookshelf View */}
          <div className="mb-4 relative h-32 bg-gradient-to-b from-white/5 to-transparent rounded-lg border border-white/10 overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-center gap-2 px-4 pb-4">
              {resources.map((resource, i) => (
                <motion.div
                  key={resource.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10, scale: 1.1 }}
                  onClick={() => setSelectedBook(resource)}
                  className="cursor-pointer relative"
                >
                  <div
                    className="w-12 h-20 rounded-sm shadow-lg flex items-center justify-center text-2xl transform hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: resource.color,
                      transform: `rotate(${(i - 2) * 3}deg)`,
                    }}
                  >
                    {resource.icon}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Resources List */}
          <div className="space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '220px' }}>
            {resources.map((resource) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 5 }}
                onClick={() => setSelectedBook(resource)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedBook?.id === resource.id
                    ? 'bg-egerton-red/20 border-egerton-red/50'
                    : 'bg-white/5 border-white/10 hover:border-egerton-red/30'
                }`}
              >
                <div className="text-3xl">{resource.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">{resource.title}</h4>
                  <p className="text-xs text-gray-400">{resource.type} • {resource.size}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 bg-egerton-green/20 rounded-full flex items-center justify-center text-egerton-green hover:bg-egerton-green/30 transition-all text-xs">
                    ⬇
                  </button>
                  <button className="w-8 h-8 bg-egerton-gold/20 rounded-full flex items-center justify-center text-egerton-gold hover:bg-egerton-gold/30 transition-all text-xs">
                    👁
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Upload Button */}
          <button className="w-full mt-4 py-2 bg-egerton-red/20 border border-egerton-red/30 rounded-lg text-egerton-red font-semibold hover:bg-egerton-red/30 transition-all">
            + Upload Resource
          </button>
        </motion.div>
      </Html>
    </group>
  );
}
