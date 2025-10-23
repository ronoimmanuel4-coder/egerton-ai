import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  FormGroup,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  VideoLibrary,
  Description,
  Assignment,
  Quiz,
  School,
  PendingActions,
  Star,
  StarBorder,
  Download,
  PlayArrow,
  Close
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../utils/api';

// Authenticated Video Component
function AuthenticatedVideo({ filename, backendUrl }) {
  console.log('🎥 AuthenticatedVideo component rendered with:', { filename, backendUrl });
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoBlob = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('🎥 Fetching video blob for:', filename);
        
        const response = await fetch(`${backendUrl}/api/upload/file/${filename}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        console.log('🎥 Created blob URL:', videoUrl);
        setVideoSrc(videoUrl);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoBlob();

    // Cleanup function to revoke object URL
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [filename, backendUrl]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 400,
        bgcolor: 'grey.900',
        color: 'white'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" sx={{ mb: 2 }} />
          <Typography variant="body2">Loading video...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 400,
        bgcolor: 'grey.900',
        color: 'white'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <VideoLibrary sx={{ fontSize: 64, mb: 2, color: 'grey.500' }} />
          <Typography variant="body2" color="error">
            Error loading video: {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <video
      controls
      width="100%"
      height="400"
      style={{ display: 'block' }}
      preload="metadata"
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      disableRemotePlayback
      onContextMenu={(e) => e.preventDefault()}
      onLoadStart={() => console.log('🎥 Video loading started')}
      onCanPlay={() => console.log('🎥 Video ready to play')}
      onError={(e) => console.error('🎥 Video error:', e)}
      src={videoSrc}
    >
      Your browser does not support the video tag.
    </video>
  );
}

const ContentApproval = () => {
  const [pendingContent, setPendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  
  // Get backend URL from environment
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  
  // Review dialog state
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState(''); // 'approve' or 'reject'
  const [isPremium, setIsPremium] = useState(false);
  
  // Content preview state
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);

  useEffect(() => {
    fetchPendingContent();
    fetchStats();
  }, []);

  const fetchPendingContent = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/content-approval/pending');
      console.log('📋 Pending content response:', response.data);
      setPendingContent(response.data.pendingContent);
    } catch (error) {
      console.error('Error fetching pending content:', error);
      setError('Failed to fetch pending content');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/content-approval/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePreview = (content) => {
    console.log('🔍 Preview content:', content);
    setPreviewContent(content);
    setOpenPreviewDialog(true);
  };

  const getSecureFileUrl = (filename) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    const separator = filename.includes('?') ? '&' : '?';
    return `${backendUrl}/api/upload/file/${filename}${separator}token=${encodeURIComponent(token)}`;
  };

  const handleSecureDownload = (filename, openInNewTab = false) => {
    const secureUrl = getSecureFileUrl(filename);
    if (!secureUrl) {
      setError('Your admin session has expired. Please log in again to access this file.');
      return;
    }

    if (openInNewTab) {
      window.open(secureUrl, '_blank', 'noopener,noreferrer');
    } else {
      const link = document.createElement('a');
      link.href = secureUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReview = (content, action) => {
    setSelectedContent(content);
    setReviewAction(action);
    setReviewNotes('');
    setIsPremium(content.content?.isPremium || false);
    setOpenReviewDialog(true);
  };

  const submitReview = async () => {
    try {
      const endpoint = reviewAction === 'approve' ? '/api/content-approval/approve' : '/api/content-approval/reject';
      
      const reviewData = {
        courseId: selectedContent.courseId,
        unitId: selectedContent.unitId,
        topicId: selectedContent.topicId,
        assessmentId: selectedContent.assessmentId,
        contentType: selectedContent.type,
        reviewNotes,
        isPremium: reviewAction === 'approve' ? isPremium : false
      };

      await api.post(endpoint, reviewData);
      
      // Refresh data
      fetchPendingContent();
      fetchStats();
      
      setOpenReviewDialog(false);
      setSelectedContent(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(`Failed to ${reviewAction} content`);
    }
  };

  const getContentIcon = (type, sx = {}) => {
    const iconProps = { sx };
    switch (type) {
      case 'video': return <VideoLibrary color="primary" {...iconProps} />;
      case 'notes': return <Description color="secondary" {...iconProps} />;
      case 'cats': return <Quiz color="warning" {...iconProps} />;
      case 'assignments': return <Assignment color="info" {...iconProps} />;
      case 'pastExams': return <School color="success" {...iconProps} />;
      default: return <PendingActions {...iconProps} />;
    }
  };

  const getContentTypeLabel = (type) => {
    switch (type) {
      case 'video': return 'Lecture Video';
      case 'notes': return 'PDF Notes';
      case 'cats': return 'CAT';
      case 'assignments': return 'Assignment';
      case 'pastExams': return 'Past Exam';
      default: return type;
    }
  };

  const filteredContent = pendingContent.filter(content => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return ['video', 'notes'].includes(content.type); // Topics
    if (tabValue === 2) return ['cats', 'assignments', 'pastExams'].includes(content.type); // Assessments
    return true;
  });

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
            Content Approval Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and approve content uploaded by Mini Admins
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2">Pending Review</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.approved}
                </Typography>
                <Typography variant="body2">Approved</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.rejected}
                </Typography>
                <Typography variant="body2">Rejected</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2">Total Content</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All Pending (${pendingContent.length})`} />
            <Tab label={`Topic Content (${pendingContent.filter(c => ['video', 'notes'].includes(c.type)).length})`} />
            <Tab label={`Assessments (${pendingContent.filter(c => ['cats', 'assignments', 'pastExams'].includes(c.type)).length})`} />
          </Tabs>
        </Box>

        {/* Content List */}
        <Paper>
          {filteredContent.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <PendingActions sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No pending content to review
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All content has been reviewed and approved!
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredContent.map((content, index) => (
                <React.Fragment key={`${content.courseId}-${content.unitId}-${content.topicId || content.assessmentId}-${content.type}`}>
                  <ListItem>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      {getContentIcon(content.type)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {content.content.title}
                          </Typography>
                          <Chip 
                            label={getContentTypeLabel(content.type)}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {content.courseName} • {content.unitName}
                            {content.topicTitle && ` • ${content.topicTitle}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded: {new Date(content.uploadDate).toLocaleDateString()}
                            {content.content.filename && ` • File: ${content.content.filename}`}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        color="info"
                        onClick={() => handlePreview(content)}
                        sx={{ mr: 1 }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckCircle />}
                        color="success"
                        onClick={() => handleReview(content, 'approve')}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Cancel />}
                        color="error"
                        onClick={() => handleReview(content, 'reject')}
                      >
                        Reject
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredContent.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* Review Dialog */}
        <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {reviewAction === 'approve' ? 'Approve Content' : 'Reject Content'}
          </DialogTitle>
          <DialogContent>
            {selectedContent && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {selectedContent.content.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedContent.courseName} • {selectedContent.unitName}
                  {selectedContent.topicTitle && ` • ${selectedContent.topicTitle}`}
                </Typography>
              </Box>
            )}
            
            {reviewAction === 'approve' && (
              <FormGroup sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      color="warning"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isPremium ? <Star color="warning" /> : <StarBorder />}
                      <Typography>
                        Mark as Premium Content
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  Premium content requires subscription to access
                </Typography>
              </FormGroup>
            )}
            
            <TextField
              fullWidth
              label="Review Notes"
              multiline
              rows={4}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={`Add notes about why you ${reviewAction === 'approve' ? 'approved' : 'rejected'} this content...`}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
            <Button 
              onClick={submitReview} 
              variant="contained"
              color={reviewAction === 'approve' ? 'success' : 'error'}
            >
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Content
            </Button>
          </DialogActions>
        </Dialog>

        {/* Content Preview Dialog */}
        <Dialog 
          open={openPreviewDialog} 
          onClose={() => setOpenPreviewDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { height: '80vh' }
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {previewContent && getContentIcon(previewContent.type)}
              <Typography variant="h6">
                Content Preview: {previewContent?.content?.title}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenPreviewDialog(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {previewContent && (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Content Info */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {previewContent.courseName} • {previewContent.unitName}
                  </Typography>
                  {previewContent.topicTitle && (
                    <Typography variant="body2" color="text.secondary">
                      Topic: {previewContent.topicTitle}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    File: {previewContent.content.filename} • 
                    Size: {previewContent.content.fileSize ? (previewContent.content.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'} •
                    Uploaded: {new Date(previewContent.uploadDate).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* Content Viewer */}
                <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {previewContent.type === 'video' && (
                    <Box sx={{ textAlign: 'center', width: '100%' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Video Preview: {previewContent.content.filename}
                      </Typography>
                      
                      {/* Video Player */}
                      <Box sx={{ 
                        width: '100%', 
                        maxWidth: '800px',
                        mx: 'auto',
                        mb: 2,
                        border: 2, 
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'black',
                        boxShadow: 3,
                        position: 'relative'
                      }}>
                        {/* Video Overlay for Security */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 10,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          🔒 Protected Content
                        </Box>
                        
                        <AuthenticatedVideo 
                          filename={previewContent.content.filename}
                          backendUrl={backendUrl}
                        />
                      </Box>

                      {/* Admin Controls */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          🎥 Video streaming for content review • Duration: {previewContent.content.duration || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 2 }}>
                          ⚠️ Admin Review Mode: Downloads require active session and are logged.
                        </Typography>

                        {/* Admin-only download option */}
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => handleSecureDownload(previewContent.content.filename)}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          Download (Admin Only)
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<PlayArrow />}
                          onClick={() => handleSecureDownload(previewContent.content.filename, true)}
                          size="small"
                        >
                          Open in New Tab
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {previewContent.type === 'notes' && (
                    <Box sx={{ textAlign: 'center', width: '100%' }}>
                      <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        PDF Document Preview
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {previewContent.content.filename}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<Visibility />}
                          onClick={() => handleSecureDownload(previewContent.content.filename, true)}
                          sx={{ mr: 1 }}
                        >
                          View PDF
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => handleSecureDownload(previewContent.content.filename)}
                        >
                          Download PDF
                        </Button>
                      </Box>
                      {(() => {
                        const secureUrl = getSecureFileUrl(previewContent.content.filename);
                        if (!secureUrl) {
                          return (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                              Admin authentication required to preview this document. Please log in again.
                            </Alert>
                          );
                        }

                        return (
                          <Box sx={{ 
                            width: '100%', 
                            height: '400px', 
                            border: 1, 
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}>
                            <iframe
                              key={secureUrl}
                              src={secureUrl}
                              width="100%"
                              height="100%"
                              style={{ border: 'none' }}
                              title="PDF Preview"
                            />
                          </Box>
                        );
                      })()}
                    </Box>
                  )}

                  {['cats', 'assignments', 'pastExams'].includes(previewContent.type) && (
                    <Box sx={{ textAlign: 'center' }}>
                      {getContentIcon(previewContent.type, { fontSize: 64, color: 'text.secondary', mb: 2 })}
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Assessment Preview
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleSecureDownload(previewContent.content.filename, true)}
                          sx={{ mr: 1 }}
                        >
                          View File
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => handleSecureDownload(previewContent.content.filename)}
                        >
                          Download
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPreviewDialog(false)}>Close</Button>
            {previewContent && (
              <>
                <Button
                  startIcon={<CheckCircle />}
                  color="success"
                  onClick={() => {
                    setOpenPreviewDialog(false);
                    handleReview(previewContent, 'approve');
                  }}
                >
                  Approve
                </Button>
                <Button
                  startIcon={<Cancel />}
                  color="error"
                  onClick={() => {
                    setOpenPreviewDialog(false);
                    handleReview(previewContent, 'reject');
                  }}
                >
                  Reject
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default ContentApproval;
