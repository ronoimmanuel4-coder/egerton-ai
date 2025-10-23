import { lazy } from 'react';

// Lazy load components for better performance (Admin-focused)
export const LazyLoginPage = lazy(() => import('../pages/Auth/LoginPage'));
export const LazyAdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
export const LazyVideoManagement = lazy(() => import('../pages/Admin/VideoManagementPage'));
export const LazyNotesManagement = lazy(() => import('../pages/Admin/NotesManagementPage'));
export const LazyCATManagement = lazy(() => import('../pages/Admin/CATManagementPage'));
export const LazyExamManagement = lazy(() => import('../pages/Admin/ExamManagementPage'));

// Loading fallback component
export const PageLoader = () => {
  // Create keyframes animation
  const spinKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />
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
      </div>
    </>
  );
};
