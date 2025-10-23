import { lazy } from 'react';

// Lazy load components for better performance (Super Admin-focused)
export const LazyLoginPage = lazy(() => import('../pages/Auth/LoginPage'));
export const LazySuperAdminDashboard = lazy(() => import('../pages/Admin/SuperAdminDashboard'));
export const LazyUserDetailPage = lazy(() => import('../pages/Admin/UserDetailPage'));

// Loading fallback component
export const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    flexDirection: 'column'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #1976d2',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ marginTop: '16px', color: '#666' }}>Loading...</p>
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);
