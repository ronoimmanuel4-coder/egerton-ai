import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPrism({ onLogin, onSignup, onGuestMode }) {
  const groupRef = useRef();
  const [activeFace, setActiveFace] = useState(0);
  const [hoveredFace, setHoveredFace] = useState(null);
  const [isExploding, setIsExploding] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  // Auto-rotate slowly
  useFrame((state) => {
    if (!groupRef.current) return;

    if (!isExploding && !isFullScreen) {
      const group = groupRef.current;
      group.rotation.y += 0.001;
      group.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });
  
  const rotateTo = (faceIndex) => {
    setActiveFace(faceIndex);
    // Calculate rotation needed
    const rotations = [
      { y: 0, x: 0 },           // Front - Login
      { y: Math.PI / 2, x: 0 }, // Right - Signup
      { y: Math.PI, x: 0 },     // Back - Guest
      { y: -Math.PI / 2, x: 0 },// Left - Biometric
    ];
    
    if (groupRef.current) {
      const target = rotations[faceIndex];
      // Smooth rotation animation would be handled by a tween library in production
      groupRef.current.rotation.y = target.y;
      groupRef.current.rotation.x = target.x;
    }

    if (!isFullScreen) {
      setIsFullScreen(true);
    }
  };
  
  const handleSubmit = async (type, payload) => {
    if (isExploding) return;

    setIsExploding(true);
    setConnectionError(false);
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      await delay(1500);

      if (type === 'login' && onLogin) {
        await onLogin(payload);
      } else if (type === 'signup' && onSignup) {
        await onSignup(payload);
      } else if (type === 'guest' && onGuestMode) {
        await onGuestMode();
      }
    } catch (error) {
      console.error('LoginPrism submission error:', error);
      
      // Check for connection refused error
      if (error.message.includes('ERR_CONNECTION_REFUSED') || 
          error.code === 'ECONNREFUSED') {
        setConnectionError(true);
      }
    } finally {
      setIsExploding(false);
    }
  };
  
  const faces = [
    { color: '#00a651', label: 'Login', component: <LoginForm onSubmit={(credentials) => handleSubmit('login', credentials)} isSubmitting={isExploding} /> },
    { color: '#d2ac67', label: 'Signup', component: <SignupForm onSubmit={(formData) => handleSubmit('signup', formData)} isSubmitting={isExploding} /> },
    { color: '#ed1c24', label: 'Guest', component: <GuestForm onSubmit={() => handleSubmit('guest')} isSubmitting={isExploding} /> },
    { color: '#007624', label: 'Biometric', component: <BiometricForm /> },
  ];
  
  const overlayFace = faces[activeFace];

  return (
    <>
      <group ref={groupRef} position={[0, 0, 0]} name="login-prism">
      {/* Front Face - Login */}
      <Face
        position={[0, 0, 1.5]}
        rotation={[0, 0, 0]}
        color={faces[0].color}
        isHovered={hoveredFace === 0}
        isExpanded={isFullScreen}
        onHover={() => setHoveredFace(0)}
        onLeave={() => setHoveredFace(null)}
        onClick={() => rotateTo(0)}
      >
        {faces[0].component}
      </Face>
      
      {/* Right Face - Signup */}
      <Face
        position={[1.5, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        color={faces[1].color}
        isHovered={hoveredFace === 1}
        isExpanded={isFullScreen}
        onHover={() => setHoveredFace(1)}
        onLeave={() => setHoveredFace(null)}
        onClick={() => rotateTo(1)}
      >
        {faces[1].component}
      </Face>
      
      {/* Back Face - Guest */}
      <Face
        position={[0, 0, -1.5]}
        rotation={[0, Math.PI, 0]}
        color={faces[2].color}
        isHovered={hoveredFace === 2}
        isExpanded={isFullScreen}
        onHover={() => setHoveredFace(2)}
        onLeave={() => setHoveredFace(null)}
        onClick={() => rotateTo(2)}
      >
        {faces[2].component}
      </Face>
      
      {/* Left Face - Biometric */}
      <Face
        position={[-1.5, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        color={faces[3].color}
        isHovered={hoveredFace === 3}
        isExpanded={isFullScreen}
        onHover={() => setHoveredFace(3)}
        onLeave={() => setHoveredFace(null)}
        onClick={() => rotateTo(3)}
      >
        {faces[3].component}
      </Face>
      
      {/* Top Face */}
      <Face
        position={[0, 1.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#bcbec1"
        isHovered={false}
      />
      
      {/* Bottom Face */}
      <Face
        position={[0, -1.5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#bcbec1"
        isHovered={false}
      />
      
      {/* Connection error message */}
      {connectionError && (
        <Html fullscreen>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl"
          >
            <div className="text-center p-8 max-w-md bg-egerton-red/90 rounded-xl">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2">Backend Connection Failed</h2>
              <p className="mb-4">
                Could not connect to the API server. Please:
              </p>
              <ul className="text-left list-disc pl-6 mb-6">
                <li>Ensure backend service is running</li>
                <li>Check network connections</li>
                <li>Verify API URL configuration</li>
              </ul>
              <button
                onClick={() => setConnectionError(false)}
                className="px-4 py-2 bg-white text-black rounded-lg"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </Html>
      )}
      
      {/* Explosion particles */}
      {isExploding && <ExplosionParticles />}
      </group>

      <AnimatePresence>
        {isFullScreen && overlayFace && (
          <Html fullscreen>
            <motion.div
              key="prism-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-xl pointer-events-auto"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-xl px-6"
              >
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="absolute -top-4 -right-2 text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
                {overlayFace.component}
              </motion.div>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </>
  );
}

function Face({ position, rotation, color, children, isHovered, isExpanded, onHover, onLeave, onClick }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (!meshRef.current) return;

    const targetZ = isExpanded ? 0 : isHovered ? 0.2 : 0;
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.15);
  });
  
  return (
    <mesh
      position={position}
      rotation={rotation}
      onPointerEnter={onHover}
      onPointerLeave={onLeave}
      onClick={onClick}
    >
      <group ref={meshRef}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.9}
          emissive={color}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
        />
        
        {/* Neumorphic shadow effect */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[3, 3]} />
          <meshBasicMaterial color="#000" transparent opacity={isHovered ? 0.3 : 0.1} />
        </mesh>
        
        {children && !isExpanded && (
          <Html
            transform
            distanceFactor={2}
            position={[0, 0, 0.01]}
            onPointerDown={() => {
              if (!isExpanded) {
                onClick?.();
              }
            }}
            style={{ width: isExpanded ? 'min(90vw, 600px)' : '300px', pointerEvents: 'auto' }}
          >
            {children}
          </Html>
        )}
      </group>
    </mesh>
  );
}

function LoginForm({ onSubmit, isSubmitting }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLoginClick = () => {
    if (isSubmitting) return;
    onSubmit?.({ email: email.trim(), password });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/80 backdrop-blur-md p-6 rounded-xl border border-egerton-green/30"
    >
      <h2 className="text-2xl font-bold text-egerton-green mb-4 text-center">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-egerton-green"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 mb-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-egerton-green"
      />
      <button
        onClick={handleLoginClick}
        disabled={isSubmitting}
        className={`w-full py-2 bg-egerton-green text-white font-semibold rounded-lg transition-all ${
          isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-egerton-dark-green'
        }`}
      >
        Enter →
      </button>
    </motion.div>
  );
}

function SignupForm({ onSubmit, isSubmitting }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleSignupClick = () => {
    if (isSubmitting) return;

    onSubmit?.({
      fullName: fullName.trim(),
      email: email.trim(),
      matricNumber: matricNumber.trim(),
      password,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/80 backdrop-blur-md p-6 rounded-xl border border-egerton-gold/30"
    >
      <h2 className="text-2xl font-bold text-egerton-gold mb-4 text-center">Sign Up</h2>
      <input
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full px-4 py-2 mb-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-egerton-gold"
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 mb-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-egerton-gold"
      />
      <input
        placeholder="Matric No."
        value={matricNumber}
        onChange={(e) => setMatricNumber(e.target.value)}
        className="w-full px-4 py-2 mb-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-egerton-gold"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 mb-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-egerton-gold"
      />
      <button
        onClick={handleSignupClick}
        disabled={isSubmitting}
        className={`w-full py-2 bg-egerton-gold text-black font-semibold rounded-lg transition-all ${
          isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'
        }`}
      >
        Create Account →
      </button>
    </motion.div>
  );
}

function GuestForm({ onSubmit, isSubmitting }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/80 backdrop-blur-md p-6 rounded-xl border border-egerton-red/30 text-center"
    >
      <h2 className="text-2xl font-bold text-egerton-red mb-4">Guest Mode</h2>
      <p className="text-gray-300 mb-6">Quick access to AI chat without creating an account</p>
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className={`w-full py-2 bg-egerton-red text-white font-semibold rounded-lg transition-all ${
          isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'
        }`}
      >
        Continue as Guest →
      </button>
    </motion.div>
  );
}

function BiometricForm() {
  const [scanning, setScanning] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/80 backdrop-blur-md p-6 rounded-xl border border-egerton-dark-green/30 text-center"
    >
      <h2 className="text-2xl font-bold text-egerton-dark-green mb-4">Biometric</h2>
      <div className="w-32 h-32 mx-auto mb-4 relative">
        <div className={`w-full h-full rounded-full border-4 border-egerton-dark-green ${scanning ? 'animate-pulse' : ''}`}>
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            👆
          </div>
        </div>
      </div>
      <button
        onClick={() => setScanning(!scanning)}
        className="w-full py-2 bg-egerton-dark-green text-white font-semibold rounded-lg hover:opacity-80 transition-all"
      >
        {scanning ? 'Scanning...' : 'Scan Fingerprint'}
      </button>
      <p className="text-xs text-gray-400 mt-2">Demo only</p>
    </motion.div>
  );
}

function ExplosionParticles() {
  const particlesRef = useRef();
  const particles = Array.from({ length: 50 });
  
  return (
    <group ref={particlesRef}>
      {particles.map((_, i) => (
        <ExplodingParticle key={i} index={i} />
      ))}
    </group>
  );
}

function ExplodingParticle({ index }) {
  const ref = useRef();
  const velocity = useRef({
    x: (Math.random() - 0.5) * 10,
    y: (Math.random() - 0.5) * 10,
    z: (Math.random() - 0.5) * 10,
  });
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.x += velocity.current.x * delta;
      ref.current.position.y += velocity.current.y * delta;
      ref.current.position.z += velocity.current.z * delta;
      
      ref.current.scale.multiplyScalar(0.95);
      
      if (ref.current.material) {
        ref.current.material.opacity *= 0.95;
      }
    }
  });
  
  const colors = ['#00a651', '#d2ac67', '#ed1c24', '#007624'];
  
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial
        color={colors[index % colors.length]}
        transparent
        opacity={1}
        emissive={colors[index % colors.length]}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
