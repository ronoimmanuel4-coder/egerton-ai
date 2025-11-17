import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPanel({ position }) {
  const groupRef = useRef();
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m your Egerton AI Study Partner. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'I understand you need help with that topic. Let me provide you with some resources and explanations...'
      }]);
      setIsTyping(false);
    }, 1500);
  };
  
  return (
    <group ref={groupRef} position={position}>
      <RoundedBox args={[4, 5, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color="#00a651"
          transparent
          opacity={0.15}
          roughness={0.3}
          metalness={0.7}
          emissive="#00a651"
          emissiveIntensity={0.2}
        />
      </RoundedBox>
      
      {/* Glass effect overlay */}
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
          className="bg-black/80 backdrop-blur-xl rounded-2xl border border-egerton-green/30 p-4 shadow-2xl"
          style={{ width: '380px', height: '480px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-egerton-green/20">
            <div className="w-10 h-10 rounded-full bg-egerton-green/20 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Tutor</h3>
              <p className="text-xs text-gray-400">Online • Ready to help</p>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-egerton-green text-white rounded-br-none'
                        : 'bg-white/10 text-white rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 px-4 py-2 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-egerton-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-egerton-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-egerton-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-egerton-green/50"
            />
            <button
              onClick={handleSend}
              className="w-10 h-10 bg-egerton-green rounded-full flex items-center justify-center hover:bg-egerton-dark-green transition-all"
            >
              <span className="text-lg">→</span>
            </button>
          </div>
        </motion.div>
      </Html>
    </group>
  );
}
