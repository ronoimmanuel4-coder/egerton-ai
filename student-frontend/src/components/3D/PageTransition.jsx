import { useRef, useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import * as THREE from 'three';
import { useStore } from '../../lib/store';

const TRANSITION_TIMINGS = {
  overlayFade: { duration: 0.6, ease: 'easeInOut' },
  vignette: { duration: 0.9, ease: 'easeInOut' },
  glow: { duration: 1, ease: [0.34, 1.56, 0.64, 1] },
  letterboxIn: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  letterboxOut: { duration: 0.6, ease: [0.55, 0.085, 0.68, 0.53] },
  particleExplode: { duration: 2.4, ease: 'power2.inOut' },
  particleReform: { duration: 1.8, ease: 'power2.out' },
  reformDelay: 600,
  transitionReset: 2600,
  contentTransition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
};

const letterboxVariants = {
  initial: { height: 0 },
  animate: { height: '18vh', transition: TRANSITION_TIMINGS.letterboxIn },
  exit: { height: 0, transition: TRANSITION_TIMINGS.letterboxOut },
};

const vignetteVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 0.55, transition: TRANSITION_TIMINGS.vignette },
  exit: { opacity: 0, transition: TRANSITION_TIMINGS.vignette },
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 0.35, scale: 1, transition: TRANSITION_TIMINGS.glow },
  exit: { opacity: 0, scale: 1.1, transition: TRANSITION_TIMINGS.letterboxOut },
};

const PARTICLE_COUNT = 450;

// Particle explosion/reformation system
function TransitionParticles({ mode, onComplete }) {
  const particlesRef = useRef();
  const basePositionsRef = useRef(null);
  const particleCount = mode === 'explode' ? PARTICLE_COUNT : Math.floor(PARTICLE_COUNT * 0.75);
  const initialPositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return positions;
  }, [particleCount]);
  
  useEffect(() => {
    if (!particlesRef.current || !particlesRef.current.geometry) return;
    
    const points = particlesRef.current;
    const attribute = points.geometry.getAttribute('position');
    if (!attribute) return;
    
    // Cache original positions once
    if (!basePositionsRef.current) {
      basePositionsRef.current = new Float32Array(attribute.array.length);
      basePositionsRef.current.set(attribute.array);
    }
    
    const startPositions = new Float32Array(attribute.array.length);
    startPositions.set(attribute.array);
    
    const targetPositions = new Float32Array(attribute.array.length);
    
    let tween;
    const state = { progress: 0 };
    
    const lerpPositions = () => {
      const positions = attribute.array;
      for (let i = 0; i < positions.length; i++) {
        positions[i] = THREE.MathUtils.lerp(startPositions[i], targetPositions[i], state.progress);
      }
      attribute.needsUpdate = true;
    };
    
    if (mode === 'explode') {
      // Explode from center
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = 10 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        targetPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        targetPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        targetPositions[i3 + 2] = radius * Math.cos(phi);
      }
      
      tween = gsap.to(state, {
        ...TRANSITION_TIMINGS.particleExplode,
        onUpdate: lerpPositions,
        onComplete: () => {
          lerpPositions();
          onComplete?.();
        },
      });
    } else if (mode === 'reform') {
      // Reform into grid (panels)
      const gridSize = Math.cbrt(particleCount);
      const spacing = 0.6;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const xIndex = i % Math.round(gridSize);
        const yIndex = Math.floor(i / (Math.round(gridSize) ** 2));
        const zIndex = Math.floor((i % (Math.round(gridSize) ** 2)) / Math.round(gridSize));
        
        targetPositions[i3] = (xIndex - gridSize / 2) * spacing;
        targetPositions[i3 + 1] = (yIndex - gridSize / 2) * spacing;
        targetPositions[i3 + 2] = (zIndex - gridSize / 2) * spacing;
      }
      
      tween = gsap.to(state, {
        ...TRANSITION_TIMINGS.particleReform,
        onUpdate: lerpPositions,
        onComplete: () => {
          lerpPositions();
          onComplete?.();
        },
      });
    }
    
    return () => {
      tween?.kill();
    };
  }, [mode, onComplete, particleCount]);
  
  // Initial positions
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={initialPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00a651"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Morph transition: Orb → Prism
function OrbToPrismMorph({ progress }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      // Morph from sphere to cube
      const segments = 32;
      const geometry = meshRef.current.geometry;
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        // Sphere radius
        const sphereR = Math.sqrt(x * x + y * y + z * z);
        
        // Cube half-size
        const cubeSize = 1;
        const cubeX = Math.sign(x) * cubeSize;
        const cubeY = Math.sign(y) * cubeSize;
        const cubeZ = Math.sign(z) * cubeSize;
        
        // Lerp between sphere and cube
        positions[i] = THREE.MathUtils.lerp(x, cubeX, progress);
        positions[i + 1] = THREE.MathUtils.lerp(y, cubeY, progress);
        positions[i + 2] = THREE.MathUtils.lerp(z, cubeZ, progress);
      }
      
      geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color="#00a651"
        emissive="#00a651"
        emissiveIntensity={0.5}
        wireframe={progress > 0.5}
      />
    </mesh>
  );
}

// Camera zoom transition
function CameraZoom({ fromRoute, toRoute }) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (fromRoute === '/' && toRoute === '/auth') {
      // Zoom into orb
      gsap.to(camera.position, {
        z: 2,
        duration: 2,
        ease: 'power2.inOut',
      });
    }
  }, [fromRoute, toRoute, camera]);
  
  return null;
}

// 3D Card flip for panel transitions
function CardFlip3D({ isFlipping, content }) {
  const cardRef = useRef();
  
  useFrame(() => {
    if (cardRef.current && isFlipping) {
      cardRef.current.rotation.y += 0.05;
    }
  });
  
  return (
    <mesh ref={cardRef}>
      <boxGeometry args={[4, 3, 0.1]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Transition Controller Component
export function TransitionController({ children }) {
  const location = useLocation();
  const [transitioning, setTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState(null);
  const [particleMode, setParticleMode] = useState(null);
  const prevLocation = useRef(location.pathname);
  const isMobile = useStore((state) => state.isMobile);
  
  useEffect(() => {
    const from = prevLocation.current;
    const to = location.pathname;
    
    if (from !== to) {
      let nextTransitionType;
      if (from === '/' && to === '/auth') {
        nextTransitionType = 'zoom-morph';
      } else if (from === '/auth' && to === '/dashboard') {
        nextTransitionType = 'explode-reform';
      } else if (from.includes('dashboard') && to.includes('dashboard')) {
        nextTransitionType = 'card-flip';
      } else {
        nextTransitionType = 'fade';
      }
      setTransitionType(nextTransitionType);
      
      requestAnimationFrame(() => {
        setTransitioning(true);
        if (nextTransitionType === 'explode-reform') {
          setParticleMode('explode');
        } else {
          setParticleMode(null);
        }
      });

      // Reset after transition
      setTimeout(() => {
        setTransitioning(false);
        prevLocation.current = to;
        setParticleMode(null);
      }, TRANSITION_TIMINGS.transitionReset);
    }
  }, [location]);

  // Mobile: Use simple 2D fade
  if (isMobile) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 1.2, ease: [0.45, 0, 0.25, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }
  
  // Desktop: 3D transitions
  return (
    <>
      <AnimatePresence>
        {transitioning ? (
          <motion.div
            key="transition-overlay"
            className="fixed inset-0 z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION_TIMINGS.overlayFade}
          >
            <motion.div
              variants={vignetteVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 bg-gradient-radial from-transparent via-black/60 to-black"
            />

            <motion.div
              variants={glowVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="pointer-events-none h-[50vh] w-[50vh] rounded-full bg-egerton-gold/15 blur-3xl" />
            </motion.div>

            <motion.div
              variants={letterboxVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute left-0 right-0 top-0 bg-black"
            />
            <motion.div
              variants={letterboxVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute left-0 right-0 bottom-0 bg-black"
            />

            <Canvas
              gl={{ alpha: true, antialias: true }}
              frameloop="demand"
              className="absolute inset-0"
              style={{ background: 'transparent' }}
              onCreated={({ gl }) => {
                gl.setClearColor('#000000', 0);
              }}
            >
              <perspectiveCamera position={[0, 0, 5]} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              
              {transitionType === 'zoom-morph' && (
                <>
                  <CameraZoom fromRoute="/" toRoute="/auth" />
                  <OrbToPrismMorph progress={0.5} />
                </>
              )}
              
              {transitionType === 'explode-reform' && particleMode && (
                <TransitionParticles
                  key={particleMode}
                  mode={particleMode}
                  onComplete={() => {
                    if (particleMode === 'explode') {
                      setTimeout(() => setParticleMode('reform'), TRANSITION_TIMINGS.reformDelay);
                    } else {
                      setParticleMode(null);
                    }
                  }}
                />
              )}
              
              {transitionType === 'card-flip' && (
                <CardFlip3D isFlipping={true} />
              )}
            </Canvas>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.97, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(12px)' }}
          transition={TRANSITION_TIMINGS.contentTransition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Hook for manual transitions
export function usePageTransition() {
  const navigate = useNavigate();
  const isMobile = useStore((state) => state.isMobile);
  
  const transitionTo = (path, type = 'default') => {
    if (isMobile) {
      // Simple navigation on mobile
      navigate(path);
      return;
    }
    
    // 3D transition on desktop
    // Add your custom transition logic here
    setTimeout(() => {
      navigate(path);
    }, 100);
  };
  
  return { transitionTo };
}

export default TransitionController;
