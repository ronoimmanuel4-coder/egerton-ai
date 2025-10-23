import { cubicBezier } from 'framer-motion';

// Smooth easing curves for magical animations
const easeOutExpo = [0.16, 1, 0.3, 1];
const easeInOutCubic = [0.65, 0, 0.35, 1];
const easeOutQuint = [0.22, 1, 0.36, 1];
const easeOutBack = [0.34, 1.56, 0.64, 1];

// Page transition animations
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutExpo
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
      ease: easeInOutCubic
    }
  }
};

// Magical scroll reveal animations
export const scrollReveal = {
  container: {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: easeOutExpo,
        when: 'beforeChildren',
        staggerChildren: 0.15
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (index = 0) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.1,
        ease: easeOutExpo
      }
    })
  }
};

// Slide from left animation (for units) - Scroll-responsive
export const slideFromLeft = {
  hidden: { 
    opacity: 0, 
    x: -60,
    scale: 0.95
  },
  visible: (custom = 0) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      mass: 0.8,
      delay: custom * 0.08,
    }
  }),
  exit: {
    opacity: 0,
    x: -30,
    scale: 0.95,
    transition: { duration: 0.3, ease: easeInOutCubic }
  }
};

// Slide from right animation (for units) - Scroll-responsive
export const slideFromRight = {
  hidden: { 
    opacity: 0, 
    x: 60,
    scale: 0.95
  },
  visible: (custom = 0) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      mass: 0.8,
      delay: custom * 0.08,
    }
  }),
  exit: {
    opacity: 0,
    x: 30,
    scale: 0.95,
    transition: { duration: 0.3, ease: easeInOutCubic }
  }
};

// Staggered grid animation
export const staggerGrid = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: easeOutQuint
      }
    }
  }
};

// Profile reveal with bounce
export const profileReveal = {
  container: {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: easeOutBack,
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: (index = 0) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.08,
        ease: easeOutBack
      }
    })
  }
};

// Magnetic hover effect
export const magneticHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17
    }
  }
};

// Enhanced hover lift with shadow
export const hoverLift = {
  rest: { 
    y: 0, 
    scale: 1,
    boxShadow: '0 8px 32px rgba(33,150,243,0.15)'
  },
  hover: {
    y: -12,
    scale: 1.02,
    boxShadow: '0 20px 60px rgba(33,150,243,0.25)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  tap: {
    y: -6,
    scale: 0.98
  }
};

// Button press animation
export const buttonPress = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  },
  tap: { 
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  }
};

// Fade in up animation
export const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easeOutExpo
    }
  }
};

// Scale in animation
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easeOutBack
    }
  }
};

// Rotate in animation
export const rotateIn = {
  hidden: { opacity: 0, rotate: -10, scale: 0.9 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easeOutBack
    }
  }
};

// Parallax scroll effect
export const parallaxScroll = (speed = 0.5) => ({
  y: [0, speed * 100],
  transition: {
    ease: 'linear'
  }
});

// Floating animation
export const floating = {
  animate: {
    y: [-10, 10],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut'
    }
  }
};

// Pulse animation
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Shimmer effect
export const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};
