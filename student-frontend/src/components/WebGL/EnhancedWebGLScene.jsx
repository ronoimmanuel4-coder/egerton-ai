import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import LiquidBlob from './LiquidBlob';
import MorphingGeometry from './MorphingGeometry';

export default function EnhancedWebGLScene({ 
  enableControls = false,
  enableEffects = true,
  children 
}) {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
        
        {/* Background */}
        <color attach="background" args={['#000510']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#00a651" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#d2ac67" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          color="#ed1c24"
          castShadow
        />
        
        {/* Main liquid blob */}
        <LiquidBlob
          position={[0, 0, -2]}
          scale={2.5}
          intensity={0.4}
          colors={['#00a651', '#d2ac67', '#ed1c24']}
        />
        
        {/* Additional morphing geometries */}
        <MorphingGeometry
          position={[-4, 2, -3]}
          scale={0.5}
          color="#00a651"
          speed={0.8}
        />
        <MorphingGeometry
          position={[4, -2, -4]}
          scale={0.4}
          color="#d2ac67"
          speed={1.2}
        />
        <MorphingGeometry
          position={[0, 3, -5]}
          scale={0.3}
          color="#ed1c24"
          speed={1.5}
        />
        
        {/* User content */}
        {children}
        
        {/* Environment lighting */}
        <Environment preset="night" />
        
        {/* Controls */}
        {enableControls && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
        )}
        
        {/* Post-processing effects */}
        {enableEffects && (
          <EffectComposer>
            <Bloom
              intensity={0.8}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.ADD}
            />
            <ChromaticAberration
              offset={[0.002, 0.002]}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
