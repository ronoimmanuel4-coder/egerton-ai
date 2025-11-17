import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useThree } from '@react-three/fiber';

/**
 * Advanced 3D scene transition system
 * Handles smooth transitions between Landing → Auth → Dashboard
 */

// Landing → Auth: Campus zooms into orb → orb morphs into prism
export function useLandingToAuthTransition() {
  const { camera, scene } = useThree();
  const navigate = useNavigate();
  
  const startTransition = () => {
    const timeline = gsap.timeline({
      onComplete: () => navigate('/auth'),
    });
    
    // Step 1: Zoom camera into orb (2s)
    timeline.to(camera.position, {
      x: 0,
      y: 3,
      z: 2,
      duration: 2,
      ease: 'power2.inOut',
    });
    
    // Step 2: Fade campus to black (1s overlap)
    timeline.to(scene.fog?.color || {}, {
      r: 0,
      g: 0,
      b: 0,
      duration: 1,
    }, '-=1');
    
    // Step 3: Orb starts pulsing faster
    timeline.to({}, {
      duration: 0.5,
      onUpdate: function() {
        // Trigger orb pulse animation
        const orb = scene.getObjectByName('ai-orb');
        if (orb) {
          orb.scale.setScalar(1 + Math.sin(this.progress() * Math.PI * 4) * 0.1);
        }
      },
    });
    
    return timeline;
  };
  
  return { startTransition };
}

// Auth → Dashboard: Prism explodes → particles reform into panels
export function useAuthToDashboardTransition() {
  const navigate = useNavigate();
  const { scene, camera } = useThree();
  
  const startTransition = () => {
    const timeline = gsap.timeline({
      onComplete: () => navigate('/dashboard'),
    });
    
    // Step 1: Prism spins faster (0.5s)
    timeline.to({}, {
      duration: 0.5,
      onUpdate: function() {
        const prism = scene.getObjectByName('login-prism');
        if (prism) {
          prism.rotation.y += 0.2;
        }
      },
    });
    
    // Step 2: Explosion (particles fly outward - 1.5s)
    timeline.to({}, {
      duration: 1.5,
      ease: 'power2.out',
      onStart: () => {
        // Trigger particle explosion
        const event = new CustomEvent('prism-explode');
        window.dispatchEvent(event);
      },
    });
    
    // Step 3: Camera pulls back (1s)
    timeline.to(camera.position, {
      x: 0,
      y: 5,
      z: 12,
      duration: 1,
      ease: 'power1.inOut',
    }, '-=0.5');
    
    // Step 4: Particles reform into grid (2s)
    timeline.to({}, {
      duration: 2,
      ease: 'elastic.out(1, 0.5)',
      onStart: () => {
        // Trigger panel reformation
        const event = new CustomEvent('panels-reform');
        window.dispatchEvent(event);
      },
    });
    
    return timeline;
  };
  
  return { startTransition };
}

// Panel → Panel: 3D card flip with depth blur
export function usePanelTransition() {
  const currentPanel = useRef(null);
  
  const transitionTo = (targetPanel) => {
    if (!currentPanel.current || !targetPanel) return;
    
    const timeline = gsap.timeline();
    
    // Step 1: Current panel flips out (0.6s)
    timeline.to(currentPanel.current.rotation, {
      y: Math.PI,
      duration: 0.6,
      ease: 'power2.in',
    });
    
    timeline.to(currentPanel.current.scale, {
      x: 0.8,
      y: 0.8,
      z: 0.8,
      duration: 0.6,
      ease: 'power2.in',
    }, '<');
    
    // Step 2: Add blur effect (simulated with opacity)
    timeline.to(currentPanel.current.material, {
      opacity: 0,
      duration: 0.3,
    }, '-=0.3');
    
    // Step 3: Target panel flips in (0.6s)
    timeline.fromTo(targetPanel.rotation, 
      { y: -Math.PI },
      {
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }
    );
    
    timeline.fromTo(targetPanel.scale,
      { x: 0.8, y: 0.8, z: 0.8 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.6,
        ease: 'power2.out',
      },
      '<'
    );
    
    timeline.fromTo(targetPanel.material,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.3,
      },
      '-=0.3'
    );
    
    currentPanel.current = targetPanel;
    
    return timeline;
  };
  
  return { transitionTo, currentPanel };
}

// Ripple dissolve effect for loader
export function useRippleDissolve(onComplete) {
  const rippleRefs = useRef([]);
  
  const startRipple = () => {
    const timeline = gsap.timeline({
      onComplete,
    });
    
    // Create expanding rings
    rippleRefs.current.forEach((ripple, i) => {
      if (!ripple) return;
      
      timeline.fromTo(ripple.scale,
        { x: 0, y: 0, z: 1 },
        {
          x: 20,
          y: 20,
          duration: 1.5,
          ease: 'power2.out',
        },
        i * 0.15
      );
      
      timeline.to(ripple.material,
        {
          opacity: 0,
          duration: 1.5,
        },
        i * 0.15
      );
    });
    
    return timeline;
  };
  
  return { startRipple, rippleRefs };
}

// Generic smooth transition
export function useSmoothTransition() {
  const location = useLocation();
  const prevLocation = useRef(location.pathname);
  
  useEffect(() => {
    if (prevLocation.current !== location.pathname) {
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      prevLocation.current = location.pathname;
    }
  }, [location]);
}

// Transition state manager
export function useTransitionState() {
  const transitionState = useRef({
    isTransitioning: false,
    type: null,
    progress: 0,
  });
  
  const setTransitioning = (type) => {
    transitionState.current.isTransitioning = true;
    transitionState.current.type = type;
  };
  
  const clearTransition = () => {
    transitionState.current.isTransitioning = false;
    transitionState.current.type = null;
    transitionState.current.progress = 0;
  };
  
  const updateProgress = (progress) => {
    transitionState.current.progress = progress;
  };
  
  return {
    transitionState: transitionState.current,
    setTransitioning,
    clearTransition,
    updateProgress,
  };
}

export default {
  useLandingToAuthTransition,
  useAuthToDashboardTransition,
  usePanelTransition,
  useRippleDissolve,
  useSmoothTransition,
  useTransitionState,
};
