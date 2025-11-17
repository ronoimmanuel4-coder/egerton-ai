import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../lib/store';

export default function Navbar3D() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, lionClickCount, incrementLionClick } = useStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };
  
  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                onClick={(e) => {
                  e.preventDefault();
                  incrementLionClick();
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 bg-egerton-green rounded-full flex items-center justify-center cursor-pointer"
              >
                <span className="text-2xl">🦁</span>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-white group-hover:text-egerton-green transition-colors">
                  Egerton AI
                </h1>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Study Partner
                </p>
              </div>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-gray-300 hover:text-egerton-green transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                to="/features"
                className="text-gray-300 hover:text-egerton-gold transition-colors font-medium"
              >
                Features
              </Link>
              <Link
                to="/about"
                className="text-gray-300 hover:text-egerton-red transition-colors font-medium"
              >
                About
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 bg-egerton-green text-white rounded-lg hover:bg-egerton-dark-green transition-all"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-egerton-red text-egerton-red rounded-lg hover:bg-egerton-red hover:text-white transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 bg-egerton-green text-white rounded-lg hover:bg-egerton-dark-green transition-all"
                >
                  Get Started
                </Link>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-white"
            >
              <span className="text-2xl">{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </motion.nav>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl">
              <div className="flex flex-col items-center justify-center h-full gap-8">
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="text-2xl text-white hover:text-egerton-green transition-colors font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/features"
                  onClick={() => setMenuOpen(false)}
                  className="text-2xl text-white hover:text-egerton-gold transition-colors font-medium"
                >
                  Features
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMenuOpen(false)}
                  className="text-2xl text-white hover:text-egerton-red transition-colors font-medium"
                >
                  About
                </Link>
                
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="px-8 py-3 bg-egerton-green text-white text-xl rounded-lg"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-8 py-3 border border-egerton-red text-egerton-red text-xl rounded-lg"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="px-8 py-3 bg-egerton-green text-white text-xl rounded-lg"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Easter Egg Notification */}
      <AnimatePresence>
        {lionClickCount >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 bg-egerton-green/90 backdrop-blur-xl border border-egerton-gold p-4 rounded-lg shadow-2xl"
          >
            <p className="text-white font-semibold">🎉 Easter Egg Unlocked!</p>
            <p className="text-sm text-gray-200">Look for the maize farm below...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
