import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import FloatingOrb from '../components/3D/FloatingOrb';
import { features } from '../data/features';

export default function Features() {
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
            <pointLight position={[10, 10, 10]} intensity={0.5} color="#00a651" />
            
            <FloatingOrb position={[0, 0, -3]} scale={0.8} />
            <FloatingOrb position={[-5, 2, -5]} scale={0.4} />
            <FloatingOrb position={[5, -2, -4]} scale={0.5} />
            
            <Environment preset="night" />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
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
            <h1 className="text-5xl md:text-7xl font-black mb-6 text-gradient">
              Powerful Features
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything you need to excel in your studies at Egerton University, powered by cutting-edge AI technology
            </p>
          </motion.div>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                to={`/features/${feature.slug}`}
                key={feature.slug}
                className="focus:outline-none"
              >
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="glass-effect p-8 rounded-2xl border border-white/10 hover:border-egerton-green/50 transition-all"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className={`text-2xl font-bold text-${feature.color} mb-3`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.summary}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-egerton-gold font-semibold">
                    Explore feature →
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
          
          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <div className="glass-effect inline-block px-12 py-8 rounded-3xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-gray-400 mb-6 max-w-2xl">
                Join thousands of Egerton students already using AI to transform their learning experience
              </p>
              <a
                href="/auth"
                className="inline-block px-8 py-4 bg-gradient-to-r from-egerton-green via-egerton-gold to-egerton-red text-white font-bold rounded-full hover:scale-105 transition-all shadow-2xl"
              >
                Start Your Journey →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
