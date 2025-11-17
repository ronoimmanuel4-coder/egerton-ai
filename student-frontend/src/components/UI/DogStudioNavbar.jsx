import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../lib/store';

export default function DogStudioNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useStore();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };
  
  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Features', path: '/features' },
    { label: 'Contact', path: '/about#contact' },
  ];

  // Lock body scroll when menu is open to prevent background scroll/extra space
  useEffect(() => {
    if (menuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [menuOpen]);
  
  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex justify-between items-center"
      >
        {/* Logo */}
        <Link to="/" className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Egerton<span className="text-[#00a651]">.</span>
        </Link>
        
        {/* Hamburger Menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white p-3 -m-3"
        >
          <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
            <line x1="0" y1="1" x2="24" y2="1" stroke="currentColor" strokeWidth="2"/>
            <line x1="0" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="0" y1="19" x2="24" y2="19" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </motion.nav>
      
      {/* Full-Screen Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-black overflow-y-auto"
          >
            <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6">
              {/* Close Button */}
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute top-8 right-8 text-white text-4xl"
              >
                ×
              </button>
              
              {/* Menu Items */}
              <nav className="flex flex-col items-center gap-8">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1, duration: 0.6, ease: [0.6, 0.05, 0.01, 0.9] }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className="text-white text-3xl sm:text-4xl md:text-5xl font-bold"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                
                {/* Auth Links */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="mt-8"
                >
                  {isAuthenticated ? (
                    <div className="flex flex-col items-center gap-4">
                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="text-[#00a651] text-3xl font-bold"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-[#ed1c24] text-2xl font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setMenuOpen(false)}
                      className="text-[#00a651] text-3xl font-bold"
                    >
                      Login
                    </Link>
                  )}
                </motion.div>
              </nav>
              
              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 text-center"
              >
                <p className="text-white/30 text-sm uppercase tracking-widest">
                  EGERTON UNIVERSITY
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
