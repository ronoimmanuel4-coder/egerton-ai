import { Suspense, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Environment, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { featureMap } from '../data/features';
import FloatingOrb from '../components/3D/FloatingOrb';

export default function FeatureDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const feature = featureMap[slug];
  
  const gradientClass = useMemo(() => {
    switch (feature?.color) {
      case 'egerton-red':
        return 'from-egerton-red via-egerton-gold to-egerton-green';
      case 'egerton-gold':
        return 'from-egerton-gold via-egerton-green to-egerton-red';
      case 'egerton-dark-green':
        return 'from-egerton-dark-green via-egerton-green to-egerton-gold';
      default:
        return 'from-egerton-green via-egerton-gold to-egerton-red';
    }
  }, [feature?.color]);
  
  if (!feature) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 text-center">
        <h1 className="text-5xl font-black mb-6">Feature not found</h1>
        <p className="text-lg text-gray-400 mb-8">
          We couldn't locate the feature you were looking for.
        </p>
        <button
          onClick={() => navigate('/features')}
          className="px-6 py-3 bg-egerton-green text-white font-semibold rounded-full hover:scale-105 transition"
        >
          Back to Features
        </button>
      </div>
    );
  }
  
  return (
    <div className="relative w-full min-h-screen">
      <div className="fixed inset-0 z-0">
        <Canvas>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={60} />
            <color attach="background" args={["#00040d"]} />
            <Stars radius={120} depth={80} count={2600} factor={4} fade />
            <ambientLight intensity={0.25} />
            <pointLight position={[6, 8, 4]} intensity={0.8} color="#d2ac67" />
            <FloatingOrb position={[0, 1.5, -4]} scale={0.9} isActive name={`${slug}-orb`} />
            <FloatingOrb position={[-4, -1.5, -5]} scale={0.45} name={`${slug}-orb-secondary`} />
            <Environment preset="night" />
            <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.25} />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="relative z-10 pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/features')}
            className="mb-10 inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <span className="text-xl">←</span>
            Back to all features
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-effect border border-white/10 rounded-3xl p-10 backdrop-blur-xl"
          >
            <div className="flex flex-wrap gap-6 items-start">
              <div className="text-6xl">{feature.icon}</div>
              <div className="flex-1 min-w-[250px]">
                <p className="uppercase tracking-[0.3em] text-sm text-gray-400 mb-4">Signature capability</p>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                  {feature.title}
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {feature.summary}
                </p>
              </div>
              <div className={`px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r ${gradientClass} text-white shadow-lg`}>Egerton Exclusive</div>
            </div>
            
            <div className="mt-10 grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Why students love it</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {feature.description}
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Quick facts</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {feature.metrics.map((metric) => (
                    <div key={metric.label} className="glass-effect border border-white/10 rounded-2xl px-4 py-5 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">{metric.label}</p>
                      <p className="text-xl font-bold text-egerton-gold">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-12 grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Key Highlights</h3>
                <ul className="space-y-3 text-gray-300">
                  {feature.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-egerton-green mt-1">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">How it works</h3>
                <ol className="space-y-3 text-gray-300 list-decimal list-inside">
                  {feature.workflow.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-egerton-green via-egerton-gold to-egerton-red text-white hover:scale-105 transition"
              >
                Launch in Dashboard
              </button>
              <button
                onClick={() => navigate(`/contact?feature=${feature.slug}`)}
                className="px-6 py-3 rounded-full font-semibold border border-white/20 text-white hover:bg-white/10 transition"
              >
                Request demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
