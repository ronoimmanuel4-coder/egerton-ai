import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  IconButton,
  Paper
} from '@mui/material';
import {
  Security,
  Warning,
  Close
} from '@mui/icons-material';

const SecureContentViewer = ({ 
  filename, 
  contentType, 
  title, 
  backendUrl,
  preventScreenshot = true,
  preventRecording = true,
  onClose 
}) => {
  const containerRef = useRef(null);
  const [isSecured, setIsSecured] = useState(false);
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    if (preventScreenshot || preventRecording) {
      implementSecurityMeasures();
    }

    return () => {
      removeSecurityMeasures();
    };
  }, [preventScreenshot, preventRecording]);

  const implementSecurityMeasures = () => {
    // Disable right-click context menu
    const disableContextMenu = (e) => {
      e.preventDefault();
      showSecurityWarning();
      return false;
    };

    // Disable common screenshot shortcuts
    const disableShortcuts = (e) => {
      // Disable Print Screen, Alt+Print Screen, Windows+Print Screen
      if (e.key === 'PrintScreen' || 
          (e.altKey && e.key === 'PrintScreen') ||
          (e.metaKey && e.shiftKey && e.key === 'S') ||
          (e.ctrlKey && e.shiftKey && e.key === 'S')) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }

      // Disable F12 (Developer Tools)
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }
    };

    // Disable text selection
    const disableSelection = () => {
      if (containerRef.current) {
        containerRef.current.style.userSelect = 'none';
        containerRef.current.style.webkitUserSelect = 'none';
        containerRef.current.style.mozUserSelect = 'none';
        containerRef.current.style.msUserSelect = 'none';
      }
    };

    // Add blur effect when window loses focus (potential screen recording)
    const handleVisibilityChange = () => {
      if (document.hidden && preventRecording) {
        if (containerRef.current) {
          containerRef.current.style.filter = 'blur(20px)';
        }
        showSecurityWarning('Screen recording detected! Content has been blurred for security.');
      } else {
        if (containerRef.current) {
          containerRef.current.style.filter = 'none';
        }
      }
    };

    // Detect potential screen recording software
    const detectRecording = () => {
      // Check for common screen recording indicators
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        // Browser supports screen capture API
        showSecurityWarning('Screen capture capabilities detected. Recording is prohibited.');
      }
    };

    // Apply security measures
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    disableSelection();
    detectRecording();

    // Store cleanup functions
    window.securityCleanup = () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableShortcuts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    setIsSecured(true);
  };

  const removeSecurityMeasures = () => {
    if (window.securityCleanup) {
      window.securityCleanup();
      delete window.securityCleanup;
    }
    setIsSecured(false);
  };

  const showSecurityWarning = (customMessage) => {
    if (!warningShown) {
      setWarningShown(true);
      const message = customMessage || 'Screenshots and screen recording are prohibited for this content.';
      
      // Show browser alert
      alert(`🔒 SECURITY NOTICE: ${message}`);
      
      // Reset warning after 5 seconds
      setTimeout(() => setWarningShown(false), 5000);
    }
  };

  const getFileUrl = () => {
    const token = localStorage.getItem('token');
    const baseUrl = `${backendUrl}/api/upload/file/${filename}?token=${encodeURIComponent(token)}`;
    // Hide native toolbar/download controls in most browsers
    return `${baseUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit`;
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        border: '2px solid #f44336',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'black',
        '&::before': preventScreenshot ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(244, 67, 54, 0.1) 10px, rgba(244, 67, 54, 0.1) 20px)',
          pointerEvents: 'none',
          zIndex: 10
        } : {}
      }}
    >
      {/* Security Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(244, 67, 54, 0.9)',
          color: 'white',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security fontSize="small" />
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            🔒 SECURE CONTENT - Screenshots & Recording Prohibited
          </Typography>
        </Box>
        {onClose && (
          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Content Area */}
      <Box sx={{ pt: 6, height: '100%' }}>
        {contentType === 'pdf' && (
          <iframe
            src={getFileUrl()}
            width="100%"
            height="100%"
            style={{ 
              border: 'none',
              display: 'block'
            }}
            title={title}
            sandbox="allow-same-origin allow-scripts"
            onContextMenu={(e) => e.preventDefault()}
          />
        )}

        {contentType === 'image' && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2
            }}
          >
            <img
              src={getFileUrl()}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          </Box>
        )}
      </Box>

      {/* Security Watermark */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          p: 1,
          borderRadius: 1,
          fontSize: '0.75rem',
          zIndex: 20,
          pointerEvents: 'none'
        }}
      >
        🔒 EduVault Secure View
      </Box>

      {/* Security Notice */}
      {isSecured && (
        <Alert
          severity="warning"
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 60,
            zIndex: 20,
            fontSize: '0.75rem'
          }}
        >
          This content is protected. Screenshots and screen recording are disabled.
        </Alert>
      )}
    </Box>
  );
};

export default SecureContentViewer;
