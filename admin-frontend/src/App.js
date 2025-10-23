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

// Lazy loaded pages for better performance (Admin-focused)
import {
  LazyLoginPage,
  LazyAdminDashboard,
  LazyVideoManagement,
  LazyNotesManagement,
  LazyCATManagement,
  LazyExamManagement,
  PageLoader
} from './utils/lazyComponents';

// Test component for debugging
import TestLoginPage from './pages/Auth/TestLoginPage';

// Create Admin Theme - Green/Teal Professional Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#00695c', // Teal
      light: '#4db6ac',
      dark: '#004d40',
    },
    secondary: {
      main: '#4caf50', // Green
      light: '#81c784',
      dark: '#388e3c',
    },
    background: {
      default: '#e8f5e8', // Light green background
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#f57c00',
      light: '#ffb74d',
      dark: '#e65100',
    },
    info: {
      main: '#0277bd',
      light: '#4fc3f7',
      dark: '#01579b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
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
          padding: '12px 28px',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,105,92,0.2)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,105,92,0.3)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 32px rgba(0,105,92,0.12)',
          borderRadius: 20,
          border: '1px solid rgba(0,105,92,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(0,105,92,0.16)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#00695c',
          boxShadow: '0 4px 20px rgba(0,105,92,0.3)',
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
      try { 
        logout && logout(); 
      } catch (_) {}
      // Only navigate if not already on login page
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
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
                      <Route path="/login" element={<LazyLoginPage />} />
                      <Route path="/test-login" element={<TestLoginPage />} />
                      
                      {/* Admin Routes */}
                      <Route path="/admin" element={
                        <ProtectedRoute requiredRole={[ 'mini_admin', 'super_admin' ]}>
                          <LazyAdminDashboard />
                        </ProtectedRoute>
                      } />

                      {/* Super Admin explicit route (same dashboard) */}
                      <Route path="/super-admin" element={
                        <ProtectedRoute requiredRole="super_admin">
                          <LazyAdminDashboard />
                        </ProtectedRoute>
                      } />
                      
                      {/* Resource Management */}
                      <Route path="/admin/videos" element={
                        <ProtectedRoute requiredRole={[ 'mini_admin', 'super_admin' ]}>
                          <LazyVideoManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/notes" element={
                        <ProtectedRoute requiredRole={[ 'mini_admin', 'super_admin' ]}>
                          <LazyNotesManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/cats" element={
                        <ProtectedRoute requiredRole={[ 'mini_admin', 'super_admin' ]}>
                          <LazyCATManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/exams" element={
                        <ProtectedRoute requiredRole={[ 'mini_admin', 'super_admin' ]}>
                          <LazyExamManagement />
                        </ProtectedRoute>
                      } />

                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to="/admin" replace />} />
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
