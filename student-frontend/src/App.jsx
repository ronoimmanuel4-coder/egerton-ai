import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DogStudioNavbar from './components/UI/DogStudioNavbar';
import PageLoader from './components/UI/PageLoader';
import DogStudioLanding from './pages/DogStudioLanding';
import DogStudioFeatures from './pages/DogStudioFeatures';
import DogStudioAbout from './pages/DogStudioAbout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import FeatureDetail from './pages/FeatureDetail';
import { useStore } from './lib/store';
import { authAPI } from './lib/api';

function InnerApp() {
  const { setIsMobile, token, user, setUser, setToken } = useStore();
  const location = useLocation();
  const [pageLoading, setPageLoading] = useState(false);
  const hideGlobalNavbar = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/auth');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  useEffect(() => {
    setPageLoading(true);
    const timeout = setTimeout(() => {
      setPageLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    const hydrateProfile = async () => {
      try {
        const { data } = await authAPI.getProfile();
        if (cancelled) return;
        if (data?.user) {
          setUser(data.user);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to hydrate profile from token:', error);
        setToken(null);
      }
    };
    hydrateProfile();
    return () => { cancelled = true; };
  }, [token, user, setUser, setToken]);

  return (
    <div className="relative min-h-screen bg-black text-white">
      {!hideGlobalNavbar && <DogStudioNavbar />}
      <PageLoader active={pageLoading} />
      <Routes>
        <Route path="/" element={<DogStudioLanding />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/features" element={<DogStudioFeatures />} />
        <Route path="/features/:slug" element={<FeatureDetail />} />
        <Route path="/about" element={<DogStudioAbout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <InnerApp />
    </Router>
  );
}

export default App;
