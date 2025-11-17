import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import FloatingOrb from '../components/3D/FloatingOrb';

export default function About() {
  const stats = [
    { value: '15K+', label: 'Students', icon: '👨‍🎓' },
    { value: '200+', label: 'Courses', icon: '📚' },
    { value: '95%', label: 'Success Rate', icon: '🎯' },
    { value: '50+', label: 'Years of Excellence', icon: '🏆' },
  ];
  
  const team = [
    { name: 'AI Research Lab', role: 'Core AI Development', icon: '🔬' },
    { name: 'Student Success Team', role: 'User Experience', icon: '🎓' },
    { name: 'Faculty Partnership', role: 'Content Curation', icon: '👩‍🏫' },
    { name: 'Innovation Hub', role: 'Technical Infrastructure', icon: '⚙️' },
  ];
  
  return (
    <div className="relative w-full min-h-screen">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <Canvas>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
            <color attach="background" args={['#000510']} />
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color="#d2ac67" />
            
            <FloatingOrb position={[0, 0, -3]} scale={1} />
            <FloatingOrb position={[-6, 3, -6]} scale={0.5} />
            <FloatingOrb position={[6, -3, -5]} scale={0.6} />
            
            <Environment preset="night" />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.2} />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Content */}
      <div className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              About <span className="text-gradient">Egerton AI</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Empowering Egerton University students with cutting-edge AI technology to unlock their full academic potential
            </p>
          </motion.div>
          
          {/* Mission Statement */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-effect p-12 rounded-3xl mb-20 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="text-6xl mb-6">🎓</div>
              <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                To revolutionize learning at Egerton University by providing every student with a personalized AI study partner. 
                We believe that with the right tools and support, every student can achieve academic excellence and reach their full potential.
              </p>
            </div>
          </motion.div>
          
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="glass-effect p-8 rounded-2xl text-center"
              >
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-4xl font-bold text-egerton-green mb-2">{stat.value}</div>
                <div className="text-gray-400 uppercase text-sm tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          
          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 mb-20 items-center"
          >
            <div className="glass-effect p-10 rounded-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">
                Born at Egerton, Built for Egertonians
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Egerton AI Study Partner was created in 2024 by students and faculty who understood the challenges 
                of modern education. We saw an opportunity to leverage artificial intelligence to create a more 
                personalized, effective, and accessible learning experience.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Today, we're proud to serve thousands of Egerton students across all faculties, helping them 
                achieve their academic goals and prepare for successful careers.
              </p>
            </div>
            
            <div className="glass-effect p-10 rounded-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">
                Our Values
              </h2>
              <ul className="space-y-3">
                {[
                  'Student Success First',
                  'Innovation in Education',
                  'Accessibility for All',
                  'Academic Integrity',
                  'Continuous Improvement',
                  'Community Collaboration'
                ].map((value, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <span className="text-egerton-green text-xl">✓</span>
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
          
          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-4xl font-bold text-center text-white mb-12">
              Powered by Collaboration
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="glass-effect p-6 rounded-2xl text-center"
                >
                  <div className="text-5xl mb-4">{member.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                  <p className="text-sm text-gray-400">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="glass-effect inline-block px-12 py-8 rounded-3xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Join the AI Revolution
              </h2>
              <p className="text-gray-400 mb-6 max-w-2xl">
                Be part of the future of education at Egerton University
              </p>
              <a
                href="/auth"
                className="inline-block px-8 py-4 bg-gradient-to-r from-egerton-green via-egerton-gold to-egerton-red text-white font-bold rounded-full hover:scale-105 transition-all shadow-2xl"
              >
                Get Started Today →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
