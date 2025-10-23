import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import ButtonTest from './components/Admin/ButtonTest';

// Lazy loaded pages for better performance (Super Admin-focused)
import {
  LazyLoginPage,
  LazySuperAdminDashboard,
  PageLoader
} from './utils/lazyComponents';

// Test component for debugging
import TestLoginPage from './pages/Auth/TestLoginPage';

// Create Super Admin Theme - Modern Gradient Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea', // Purple-Blue
      light: '#a8b5f5',
      dark: '#4c5fd5',
    },
    secondary: {
      main: '#764ba2', // Deep Purple
      light: '#a47bc8',
      dark: '#5a3a7d',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    success: {
      main: '#11998e',
      light: '#38ef7d',
      dark: '#0d7a72',
    },
    warning: {
      main: '#f093fb',
      light: '#f5576c',
      dark: '#c76fc9',
    },
    error: {
      main: '#ee0979',
      light: '#ff6a00',
      dark: '#ba0660',
    },
    info: {
      main: '#667eea',
      light: '#a8b5f5',
      dark: '#4c5fd5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #674191 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
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
                <Navbar />
                <main style={{ flex: 1 }}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Navigate to="/super-admin" replace />} />
                      <Route path="/button-test" element={<ButtonTest />} />
                      <Route path="/login" element={<LazyLoginPage />} />
                      <Route path="/test-login" element={<TestLoginPage />} />
                      
                      {/* Super Admin Routes */}
                      <Route path="/super-admin" element={
                        <ProtectedRoute requiredRole="super_admin">
                          <LazySuperAdminDashboard />
                        </ProtectedRoute>
                      } />
                      
                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to="/super-admin" replace />} />
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
