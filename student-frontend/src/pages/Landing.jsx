import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CampusScene from '../components/3D/CampusScene';
import FloatingOrb from '../components/3D/FloatingOrb';
import ModeToggle from '../components/UI/ModeToggle';
import { useStore } from '../lib/store';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const navigate = useNavigate();
  const scrollRef = useRef();
  const cameraRef = useRef();
  const { showEasterEgg, resetLionClick } = useStore();
  
  useEffect(() => {
    // Camera animation on scroll
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scrollRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          if (cameraRef.current) {
            cameraRef.current.position.z = 10 - self.progress * 15;
            cameraRef.current.position.y = 5 - self.progress * 3;
          }
        },
      });
    });
    
    return () => {
      ctx.revert();
      resetLionClick();
    };
  }, [resetLionClick]);
  
  return (
    <div ref={scrollRef} className="relative w-full" style={{ height: '300vh' }}>
      {/* Fixed Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 5, 10]} fov={60} />
            
            {/* Scene */}
            <CampusScene />
            
            {/* Main AI Orb */}
            <FloatingOrb position={[0, 3, 0]} scale={1.5} isActive={true} name="ai-orb" />
            
            {/* Hero Text 3D - Temporarily disabled until fonts are added */}
            {/* 
            <Center position={[0, 6, -2]}>
              <Text3DTitle text="AI" />
            </Center>
            
            <Center position={[0, 4.5, -2]}>
              <Text3DSubtitle text="POWERED LEARNING" />
            </Center>
            */}
            
            {/* Mode Toggle */}
            <ModeToggle position={[-6, 2, 0]} />
            
            {/* Easter Egg: Maize Farm */}
            {showEasterEgg && <MaizeFarm position={[8, 0, 2]} />}
            
            {/* Lighting */}
            <Environment preset="night" />
            
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Content Overlays */}
      <div className="relative z-10 pointer-events-none">
        {/* Hero Section */}
        <div className="h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-center pointer-events-auto"
          >
            <h1 className="text-6xl md:text-8xl font-black mb-4 text-gradient">
              AI Study Partner
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 tracking-wider">
              For Every Egertonian
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="btn-primary text-lg"
              >
                Get Started →
              </button>
              <button
                onClick={() => navigate('/features')}
                className="btn-secondary text-lg"
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Features Section */}
        <div className="h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 pointer-events-auto"
          >
            <FeatureCard
              icon="🧠"
              title="AI Tutor"
              description="24/7 personalized learning assistance powered by advanced AI"
            />
            <FeatureCard
              icon="📊"
              title="Smart Analytics"
              description="Track your progress with intelligent insights and predictions"
            />
            <FeatureCard
              icon="🎯"
              title="Exam Prediction"
              description="AI-powered exam predictions based on lecturer patterns"
            />
          </motion.div>
        </div>
        
        {/* CTA Section */}
        <div className="h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center pointer-events-auto"
          >
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Ready to Transform
              <br />
              <span className="text-gradient">Your Learning?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of Egerton students already using AI to excel in their studies
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-12 py-4 bg-gradient-to-r from-egerton-green via-egerton-gold to-egerton-red text-white text-xl font-bold rounded-full hover:scale-105 transition-all shadow-2xl"
            >
              Start Learning Now
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Text3D components commented out until font files are added
// To enable: Download fonts from https://github.com/mrdoob/three.js/tree/master/examples/fonts
// Place in /public/fonts/ directory
/*
function Text3DTitle({ text }) {
  const ref = useRef();
  
  return (
    <Text3D
      ref={ref}
      font="/fonts/helvetiker_bold.typeface.json"
      size={1.5}
      height={0.3}
      curveSegments={12}
      bevelEnabled
      bevelThickness={0.02}
      bevelSize={0.02}
      bevelOffset={0}
      bevelSegments={5}
    >
      {text}
      <meshStandardMaterial
        color="#d2ac67"
        emissive="#d2ac67"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </Text3D>
  );
}

function Text3DSubtitle({ text }) {
  return (
    <Text3D
      font="/fonts/helvetiker_regular.typeface.json"
      size={0.4}
      height={0.1}
      curveSegments={12}
      bevelEnabled
      bevelThickness={0.01}
      bevelSize={0.01}
    >
      {text}
      <meshStandardMaterial
        color="#00a651"
        emissive="#00a651"
        emissiveIntensity={0.3}
        metalness={0.6}
        roughness={0.4}
      />
    </Text3D>
  );
}
*/

function MaizeFarm({ position }) {
  const groupRef = useRef();
  
  useEffect(() => {
    if (groupRef.current) {
      gsap.from(groupRef.current.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 2,
        ease: 'elastic.out(1, 0.5)',
      });
    }
  }, []);
  
  return (
    <group ref={groupRef} position={position}>
      {/* Create a 3x3 grid of maize plants */}
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * 0.8 - 0.8;
        const z = row * 0.8 - 0.8;
        
        return <MaizePlant key={i} position={[x, 0, z]} delay={i * 0.1} />;
      })}
      
      {/* Sign */}
      <mesh position={[0, 1, -2]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2, 0.5]} />
        <meshStandardMaterial color="#d2ac67" emissive="#d2ac67" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function MaizePlant({ position, delay }) {
  const ref = useRef();
  
  useEffect(() => {
    if (ref.current) {
      gsap.from(ref.current.position, {
        y: -2,
        duration: 1,
        delay,
        ease: 'bounce.out',
      });
    }
  }, [delay]);
  
  return (
    <group ref={ref} position={position}>
      {/* Stalk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1, 8]} />
        <meshStandardMaterial color="#7cb342" roughness={0.8} />
      </mesh>
      
      {/* Corn */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#fdd835" roughness={0.6} />
      </mesh>
      
      {/* Leaves */}
      <mesh position={[0.15, 0.7, 0]} rotation={[0, 0, 0.5]}>
        <planeGeometry args={[0.3, 0.6]} />
        <meshStandardMaterial color="#8bc34a" side={2} roughness={0.9} />
      </mesh>
      <mesh position={[-0.15, 0.7, 0]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[0.3, 0.6]} />
        <meshStandardMaterial color="#8bc34a" side={2} roughness={0.9} />
      </mesh>
    </group>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      className="glass-effect p-6 rounded-2xl"
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
}
