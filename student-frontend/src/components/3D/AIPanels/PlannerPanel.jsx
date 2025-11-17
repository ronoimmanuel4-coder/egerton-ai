import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { motion } from 'framer-motion';

export default function PlannerPanel({ position }) {
  const groupRef = useRef();
  const [events, setEvents] = useState([
    { id: 1, title: 'Math Assignment Due', date: '2024-01-15', time: '23:59', color: '#00a651' },
    { id: 2, title: 'Physics Lecture', date: '2024-01-16', time: '10:00', color: '#d2ac67' },
    { id: 3, title: 'Study Group', date: '2024-01-16', time: '15:00', color: '#ed1c24' },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + 1) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + 1) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <RoundedBox args={[4, 5, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color="#d2ac67"
          transparent
          opacity={0.15}
          roughness={0.3}
          metalness={0.7}
          emissive="#d2ac67"
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
          className="bg-black/80 backdrop-blur-xl rounded-2xl border border-egerton-gold/30 p-4 shadow-2xl"
          style={{ width: '380px', height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-egerton-gold/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-egerton-gold/20 flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Study Planner</h3>
                <p className="text-xs text-gray-400">Organize your schedule</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-8 h-8 bg-egerton-gold/20 rounded-full flex items-center justify-center text-egerton-gold hover:bg-egerton-gold/30 transition-all"
            >
              +
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="mb-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-gray-500 font-semibold">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i - 2;
                const isToday = day === 15;
                const hasEvent = [15, 16, 20].includes(day);
                
                return (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center text-xs rounded-lg ${
                      day < 1 || day > 31
                        ? 'text-gray-700'
                        : isToday
                        ? 'bg-egerton-gold text-black font-bold'
                        : hasEvent
                        ? 'bg-egerton-green/20 text-white'
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    {day > 0 && day <= 31 ? day : ''}
                    {hasEvent && <div className="absolute bottom-0 w-1 h-1 bg-egerton-green rounded-full"></div>}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Events List */}
          <div className="space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '180px' }}>
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-egerton-gold/30 transition-all cursor-pointer"
              >
                <div className="w-1 h-12 rounded-full" style={{ backgroundColor: event.color }}></div>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">{event.title}</h4>
                  <p className="text-xs text-gray-400">{event.date} at {event.time}</p>
                </div>
                <button className="text-gray-500 hover:text-red-400 transition-all">×</button>
              </motion.div>
            ))}
          </div>
          
          {/* Add Event Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-egerton-gold/10 rounded-lg border border-egerton-gold/30"
            >
              <input
                type="text"
                placeholder="Event title"
                className="w-full px-3 py-2 mb-2 bg-white/5 border border-white/10 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-egerton-gold/50"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-egerton-gold/50"
                />
                <button className="px-4 py-2 bg-egerton-gold text-black text-sm font-semibold rounded hover:opacity-80 transition-all">
                  Add
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Html>
    </group>
  );
}
