import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ChatbotWidget from './components/Chatbot/ChatbotWidget';
import { useAuth } from './contexts/AuthContext';

// Lazy loaded pages for better performance (Student-only)
import {
  // LazyHomePage,
  LazyLoginPage,
  LazyRegisterPage,
  LazyInstitutionPage,
  LazyCoursePage,
  LazyResourcesPage,
  LazyDownloadsPage,
  LazyJobsPage,
  LazyProfilePage,
  PageLoader
} from './utils/lazyComponents';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

// Test component for debugging
import TestLoginPage from './pages/Auth/TestLoginPage';

// Create Student Theme - Vibrant Blue/Orange Learning Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3', // Bright Blue
      light: '#64b5f6',
      dark: '#1976d2',
    },
    secondary: {
      main: '#ff9800', // Vibrant Orange
      light: '#ffb74d',
      dark: '#f57c00',
    },
    background: {
      default: '#f8faff', // Very light blue background
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#00bcd4',
      light: '#4dd0e1',
      dark: '#0097a7',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3rem',
      background: 'linear-gradient(45deg, #2196f3 30%, #ff9800 90%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#1976d2',
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#1976d2',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#424242',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 25,
          padding: '12px 32px',
          fontWeight: 600,
          fontSize: '1rem',
          boxShadow: '0 4px 15px rgba(33,150,243,0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(33,150,243,0.4)',
            transform: 'translateY(-2px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976d2 30%, #00bcd4 90%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 32px rgba(33,150,243,0.15)',
          borderRadius: 24,
          border: '1px solid rgba(33,150,243,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(33,150,243,0.2)',
            transform: 'translateY(-4px)',
            borderColor: 'rgba(33,150,243,0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
          boxShadow: '0 4px 20px rgba(33,150,243,0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 600,
        },
        colorPrimary: {
          background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
        },
        colorSecondary: {
          background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
          boxShadow: '0 4px 20px rgba(255,152,0,0.4)',
          '&:hover': {
            background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
            boxShadow: '0 6px 25px rgba(255,152,0,0.5)',
          },
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthRedirectListener() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  useEffect(() => {
    const handler = () => {
      try { logout && logout(); } catch (_) {}
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [navigate, logout]);
  return null;
}

function ScrollResetManager() {
  const location = useLocation();

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    });
  }, [location.pathname, location.search]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <PaymentProvider>
            <SocketProvider>
              <Router>
              <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <AuthRedirectListener />
                <ScrollResetManager />
                <Navbar />
                <main style={{ flex: 1 }}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/login" element={<LazyLoginPage />} />
                      <Route path="/test-login" element={<TestLoginPage />} />
                      <Route path="/register" element={<LazyRegisterPage />} />
                      
                      {/* Protected Routes */}
                      <Route path="/institution/:id" element={
                        <ProtectedRoute>
                          <LazyInstitutionPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/course/:id" element={
                        <ProtectedRoute>
                          <LazyCoursePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/resources" element={
                        <ProtectedRoute>
                          <LazyResourcesPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/downloads" element={
                        <ProtectedRoute>
                          <LazyDownloadsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/jobs" element={
                        <ProtectedRoute>
                          <LazyJobsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <LazyProfilePage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <ChatbotWidget />
              </div>
            </Router>
            </SocketProvider>
          </PaymentProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
