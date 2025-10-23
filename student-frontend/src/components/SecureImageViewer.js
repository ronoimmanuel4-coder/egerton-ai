import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Snackbar
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Visibility as ViewIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const SecureImageViewer = ({ type, id, onClose, open = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [viewingStarted, setViewingStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (open && type && id) {
      fetchAssessment();
      setupScreenshotPrevention();
    }
    
    return () => {
      cleanupPrevention();
    };
  }, [type, id, open]);

  useEffect(() => {
    if (viewingStarted && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [viewingStarted, timeRemaining]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 SecureImageViewer - Fetching assessment:', { type, id });
      
      // Fetch assessment metadata
      const response = await api.get(`/api/secure-images/metadata/${type}/${id}`);
      
      if (response.data.success) {
        setAssessment(response.data.data);
        setTimeRemaining(response.data.data.duration * 60); // Convert minutes to seconds
      } else {
        setError('Assessment not found or access denied');
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      if (error.response?.status === 404) {
        setError('This secure assessment is not yet available. Please check back later or contact your instructor.');
      } else {
        setError('Failed to load assessment. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setupScreenshotPrevention = () => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      showSecurityWarning('Right-click is disabled for security reasons');
    };

    // Disable common screenshot shortcuts
    const handleKeyDown = (e) => {
      // Disable Print Screen, Alt+Print Screen, Windows+Print Screen
      if (e.key === 'PrintScreen' || 
          (e.altKey && e.key === 'PrintScreen') || 
          (e.metaKey && e.key === 'PrintScreen') ||
          (e.ctrlKey && e.key === 'PrintScreen')) {
        e.preventDefault();
        showSecurityWarning('Screenshots are not allowed during assessment viewing');
        return false;
      }

      // Disable F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        showSecurityWarning('Developer tools are disabled for security');
        return false;
      }

      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        showSecurityWarning('Developer tools are disabled for security');
        return false;
      }

      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        showSecurityWarning('Developer tools are disabled for security');
        return false;
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        showSecurityWarning('View source is disabled for security');
        return false;
      }

      // Disable Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        showSecurityWarning('Saving is not allowed during assessment');
        return false;
      }

      // Disable Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        showSecurityWarning('Text selection is disabled for security');
        return false;
      }

      // Disable Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        showSecurityWarning('Copying is not allowed during assessment');
        return false;
      }
    };

    // Disable drag and drop
    const handleDragStart = (e) => {
      e.preventDefault();
      showSecurityWarning('Drag and drop is disabled for security');
    };

    // Disable text selection
    const handleSelectStart = (e) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    // Store references for cleanup
    window.securityListeners = {
      handleContextMenu,
      handleKeyDown,
      handleDragStart,
      handleSelectStart
    };

    // Blur detection (user switching tabs/windows)
    const handleBlur = () => {
      if (viewingStarted) {
        showSecurityWarning('Please stay focused on the assessment window');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && viewingStarted) {
        showSecurityWarning('Assessment paused - window is not visible');
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add to cleanup references
    window.securityListeners.handleBlur = handleBlur;
    window.securityListeners.handleVisibilityChange = handleVisibilityChange;

    // Disable developer tools detection
    let devtools = {
      open: false,
      orientation: null
    };

    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          showSecurityWarning('Developer tools detected - please close them');
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  };

  const cleanupPrevention = () => {
    if (window.securityListeners) {
      const {
        handleContextMenu,
        handleKeyDown,
        handleDragStart,
        handleSelectStart,
        handleBlur,
        handleVisibilityChange
      } = window.securityListeners;

      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      delete window.securityListeners;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Clean up image URL
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
  };

  const showSecurityWarning = (message) => {
    setWarningMessage(message);
    setShowWarning(true);
  };

  const handleStartViewing = async () => {
    try {
      setLoading(true);
      
      // Load the secure image
      const response = await api.get(`/api/secure-images/${type}/${id}`, {
        responseType: 'blob'
      });
      
      const imageBlob = response.data;
      const imageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl);
      setViewingStarted(true);

      // Log the viewing session
      await api.post('/api/secure-images/log-access', {
        assessmentId: id,
        assessmentType: type,
        action: 'start_viewing',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error loading secure image:', error);
      if (error.response?.status === 404) {
        setError('The secure assessment file is unavailable. Please contact support for assistance.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please refresh the page and try again.');
      } else {
        setError('Failed to load assessment image. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    showSecurityWarning('⏰ Time is up! The assessment viewing session has ended.');
    setTimeout(() => {
      handleEndViewing();
    }, 3000);
  };

  const handleEndViewing = async () => {
    try {
      // Log the end of viewing session
      await api.post('/api/secure-images/log-access', {
        assessmentId: id,
        assessmentType: type,
        action: 'end_viewing',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging end of session:', error);
    }

    cleanupPrevention();
    setViewingStarted(false);
    setImageUrl('');
    if (onClose) {
      onClose();
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!open) {
    return null;
  }

  if (loading) {
    return (
      <Dialog open={true} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading secure assessment...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={true} maxWidth="sm" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog 
        open={true} 
        maxWidth="lg" 
        fullWidth 
        fullScreen={viewingStarted}
        onClose={!viewingStarted ? onClose : undefined}
        disableEscapeKeyDown={viewingStarted}
        PaperProps={{
          sx: {
            ...(viewingStarted && {
              bgcolor: 'black',
              color: 'white'
            })
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: viewingStarted ? 'rgba(0,0,0,0.9)' : 'error.light', 
          color: viewingStarted ? 'white' : 'error.dark',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SecurityIcon />
          🔒 Secure Assessment Viewer
          {viewingStarted && (
            <Chip 
              label={`Time: ${formatTime(timeRemaining)}`}
              color={timeRemaining < 300 ? 'error' : 'primary'}
              sx={{ ml: 'auto' }}
            />
          )}
          {viewingStarted && (
            <Button 
              variant="contained" 
              color="error"
              onClick={handleEndViewing}
              size="small"
              startIcon={<CloseIcon />}
            >
              End Session
            </Button>
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {!viewingStarted ? (
            // Pre-viewing information
            <Box sx={{ p: 3 }}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {assessment?.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    📚 {assessment?.unitName}
                  </Typography>
                  {assessment?.course && (
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Course: {assessment.course.code} - {assessment.course.name}
                    </Typography>
                  )}
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {assessment?.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', gap: 4, mb: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2">
                      <strong>📊 Total Marks:</strong> {assessment?.totalMarks}
                    </Typography>
                    <Typography variant="body2">
                      <strong>⏱️ Duration:</strong> {assessment?.duration} minutes
                    </Typography>
                    <Typography variant="body2">
                      <strong>📅 Due:</strong> {formatDate(assessment?.dueDate)}
                    </Typography>
                  </Box>
                  
                  {assessment?.instructions && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        📋 Instructions:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'grey.200'
                      }}>
                        {assessment.instructions}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🔒 Security Notice:
                </Typography>
                <Typography variant="body2">
                  • Screenshots and screen recording are disabled<br/>
                  • Right-click and developer tools are blocked<br/>
                  • Switching tabs or windows will trigger warnings<br/>
                  • Your viewing session is being monitored<br/>
                  • Time limit will be strictly enforced<br/>
                  • Copying and saving are disabled
                </Typography>
              </Alert>

              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Ready to start?</strong> Once you begin viewing, the timer will start and security measures will be activated. 
                  Make sure you're in a quiet environment and won't be interrupted.
                </Typography>
              </Alert>
            </Box>
          ) : (
            // Secure image viewing area
            <Box sx={{ 
              height: '100vh', 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: 'black',
              position: 'relative',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}>
              {/* Security overlay */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 1000,
                background: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255,0,0,0.05) 10px,
                    rgba(255,0,0,0.05) 11px
                  )
                `
              }} />

              {/* Image display area */}
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                p: 2,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}>
                {imageUrl ? (
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Assessment"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      pointerEvents: 'none',
                      WebkitUserDrag: 'none',
                      WebkitTouchCallout: 'none',
                      filter: 'contrast(1.1) brightness(0.95)' // Slight filter to make screenshots less useful
                    }}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    onLoad={() => {
                      // Additional security: disable image caching
                      if (imageRef.current) {
                        imageRef.current.style.webkitUserSelect = 'none';
                        imageRef.current.style.webkitTouchCallout = 'none';
                      }
                    }}
                  />
                ) : (
                  <CircularProgress color="primary" />
                )}
              </Box>

              {/* Security watermark */}
              <Box sx={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                color: 'rgba(255,255,255,0.3)',
                fontSize: '12px',
                zIndex: 1001,
                pointerEvents: 'none'
              }}>
                🔒 Secure View - {user?.firstName} {user?.lastName} - {new Date().toLocaleString()}
              </Box>

              {/* Additional security watermarks */}
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255,255,255,0.1)',
                fontSize: '48px',
                zIndex: 999,
                pointerEvents: 'none',
                fontWeight: 'bold'
              }}>
                EDUVAULT
              </Box>
            </Box>
          )}
        </DialogContent>

        {!viewingStarted && (
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleStartViewing}
              variant="contained"
              startIcon={<ViewIcon />}
              color="primary"
              disabled={loading || !assessment?.hasFile}
            >
              Start Secure Viewing
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Security Warning Snackbar */}
      <Snackbar
        open={showWarning}
        autoHideDuration={4000}
        onClose={() => setShowWarning(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowWarning(false)} 
          severity="error" 
          sx={{ width: '100%' }}
          icon={<SecurityIcon />}
        >
          {warningMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SecureImageViewer;
