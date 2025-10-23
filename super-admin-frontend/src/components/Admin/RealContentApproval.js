import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Snackbar,
  Avatar,
  Chip,
  Stack,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  VideoLibrary,
  Description,
  Assessment,
  Visibility,
  Check,
  Close,
  Star,
  Download,
  PlayArrow,
  PictureAsPdf,
  Delete,
  Warning,
  Refresh,
  Edit,
  CheckCircle
} from '@mui/icons-material';
import api from '../../utils/api';

const getBackendBaseUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  // Fallback to default dev URL
  return 'http://localhost:5000';
};

const buildFileUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${getBackendBaseUrl()}${normalized}`;
};

const RealContentApproval = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingContent, setPendingContent] = useState([]);
  const [approvedContent, setApprovedContent] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'
  
  // Dialog states
  const [previewDialog, setPreviewDialog] = useState({ open: false, content: null });
  const [reviewDialog, setReviewDialog] = useState({ open: false, content: null, action: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, content: null });
  const [editDialog, setEditDialog] = useState({ open: false, content: null });
  const [reviewNotes, setReviewNotes] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPendingContent();
    fetchApprovedContent();
  }, []);

  const transformPendingItems = (items = []) => {
    return items.map((item) => {
      const contentDetails = item.content || item.contentDetails || {};
      const uploadDate = item.uploadDate
        ? (typeof item.uploadDate === 'string' ? item.uploadDate : new Date(item.uploadDate).toISOString())
        : null;

      return {
        type: item.type,
        courseId: item.courseId,
        courseName: item.courseName,
        unitId: item.unitId,
        unitName: item.unitName,
        topicId: item.topicId,
        topicTitle: item.topicTitle,
        assessmentId: item.assessmentId,
        content: {
          ...contentDetails,
          filename: contentDetails.filename || item.filename || contentDetails.originalName || null,
          status: contentDetails.status || item.status,
          uploadedBy: contentDetails.uploadedBy || item.uploadedBy || null,
          reviewNotes: contentDetails.reviewNotes || item.reviewNotes || null
        },
        uploadDate,
        uploaderName: item.uploaderName || contentDetails.uploaderName || 'Unknown uploader',
        uploaderEmail: item.uploaderEmail || contentDetails.uploaderEmail || null
      };
    });
  };

  const fetchPendingContent = async ({ showSpinner = true } = {}) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      setError(null);

      const response = await api.get('/api/admin/content-status');
      const allContent = response.data.content || [];

      const pendingContentItems = transformPendingItems(
        allContent.filter((item) => (item.status || 'pending').toLowerCase() === 'pending')
      );

      console.log('📋 Fetched pending content (unified):', pendingContentItems);
      setPendingContent(pendingContentItems);
      setStats({
        pending: pendingContentItems.length,
        approved: response.data.stats?.approved || 0,
        rejected: response.data.stats?.rejected || 0
      });

      if (pendingContentItems.length === 0 && activeTab === 'pending') {
        setError('No pending content found. All content has been reviewed!');
      }

    } catch (error) {
      console.error('Error fetching pending content:', error);
      setError('Failed to fetch pending content. Please check your connection.');
      setPendingContent([]);
      setStats({ pending: 0, approved: 0, rejected: 0 });
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  const fetchApprovedContent = async ({ showSpinner = true } = {}) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }

      const response = await api.get('/api/content-approval/approved');
      const approvedItems = transformPendingItems(response.data.approvedContent || []);

      console.log('✅ Fetched approved content:', approvedItems);
      setApprovedContent(approvedItems);

    } catch (error) {
      console.error('Error fetching approved content:', error);
      setApprovedContent([]);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video': return <VideoLibrary />;
      case 'notes': return <Description />;
      case 'cats':
      case 'assignments':
      case 'pastExams': return <Assessment />;
      default: return <Description />;
    }
  };

  const getContentColor = (type) => {
    switch (type) {
      case 'video': return 'error';
      case 'notes': return 'primary';
      case 'cats':
      case 'assignments':
      case 'pastExams': return 'warning';
      default: return 'info';
    }
  };

  const handlePreview = (content) => {
    setPreviewDialog({ open: true, content });
  };

  const handleReview = (content, action) => {
    setReviewDialog({ open: true, content, action });
    setReviewNotes('');
    setIsPremium(false);
  };

  const handleDelete = (content) => {
    setDeleteDialog({ open: true, content });
  };

  const handleViewFile = (content) => {
    const rawPath = content.content?.filePath || content.content?.url;
    const fileUrl = buildFileUrl(rawPath);
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      setSnackbar({
        open: true,
        message: 'File URL not available',
        severity: 'error'
      });
    }
  };

  const handleDownloadFile = async (content) => {
    try {
      const rawPath = content.content?.filePath || content.content?.url;
      const fileUrl = buildFileUrl(rawPath);
      if (!fileUrl) {
        throw new Error('File URL not available');
      }

      const response = await api.get(fileUrl, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = content.content?.filename || content.content?.originalName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'File downloaded successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download file',
        severity: 'error'
      });
    }
  };

  const submitReview = async () => {
    const { content, action } = reviewDialog;
    if (!content || !action) {
      return;
    }

    try {
      const payload = {
        courseId: content.courseId,
        unitId: content.unitId,
        topicId: content.topicId,
        assessmentId: content.assessmentId,
        contentType: content.type,
        reviewNotes,
        ...(action === 'approve' ? { isPremium } : {})
      };

      const endpoint = action === 'approve'
        ? '/api/content-approval/approve'
        : '/api/content-approval/reject';
      const response = await api.post(endpoint, payload);

      if (response.data?.pendingContent) {
        setPendingContent(transformPendingItems(response.data.pendingContent));
      } else {
        setPendingContent(prev => prev.filter(c =>
          !(c.topicId === content.topicId && c.assessmentId === content.assessmentId)
        ));
      }

      if (response.data?.stats) {
        const updatedStats = response.data.stats;
        setStats({
          pending: updatedStats.pending ?? 0,
          approved: updatedStats.approved ?? 0,
          rejected: updatedStats.rejected ?? 0
        });
      } else {
        setStats(prev => {
          const next = {
            ...prev,
            pending: Math.max(0, prev.pending - 1)
          };
          const key = action === 'approve' ? 'approved' : 'rejected';
          next[key] = (next[key] || 0) + 1;
          return next;
        });
      }

      await fetchPendingContent({ showSpinner: false });

      setSnackbar({
        open: true,
        message: `Content ${action}d successfully! ${isPremium && action === 'approve' ? '⭐ Marked as Premium' : ''}`,
        severity: 'success'
      });

      setReviewDialog({ open: false, content: null, action: null });
      return;
    } catch (error) {
      console.error('Error submitting review:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${action === 'approve' ? 'approve' : 'reject'} content: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
      await fetchPendingContent({ showSpinner: false });
    }
  };

  const deleteContent = async () => {
    const content = deleteDialog.content;
    if (!content) {
      return;
    }

    try {
      const payload = {
        courseId: content.courseId,
        unitId: content.unitId,
        contentType: content.type,
        ...(content.topicId ? { topicId: content.topicId } : {}),
        ...(content.assessmentId ? { assessmentId: content.assessmentId } : {})
      };

      console.log('🗑️ Deleting content:', payload);

      const response = await api.delete('/api/content-approval/delete', {
        data: payload
      });

      // Refresh both pending and approved content lists
      await Promise.all([
        fetchPendingContent({ showSpinner: false }),
        fetchApprovedContent({ showSpinner: false })
      ]);

      setSnackbar({
        open: true,
        message: response.data?.message || 'Content deleted successfully!',
        severity: 'success'
      });

      setDeleteDialog({ open: false, content: null });
    } catch (error) {
      console.error('Error deleting content:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setSnackbar({
        open: true,
        message: `Failed to delete content: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const handleEdit = (content) => {
    setEditDialog({ open: true, content });
    setIsPremium(content.content?.isPremium || false);
  };

  const submitEdit = async () => {
    const content = editDialog.content;
    if (!content) return;

    try {
      const payload = {
        courseId: content.courseId,
        unitId: content.unitId,
        topicId: content.topicId,
        assessmentId: content.assessmentId,
        contentType: content.type,
        isPremium
      };

      await api.post('/api/content-approval/approve', payload);
      
      await fetchApprovedContent({ showSpinner: false });
      
      setSnackbar({
        open: true,
        message: 'Content updated successfully!',
        severity: 'success'
      });

      setEditDialog({ open: false, content: null });
    } catch (error) {
      console.error('Error updating content:', error);
      setSnackbar({
        open: true,
        message: `Failed to update content: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ ml: 2, color: 'text.primary' }}>Loading content...</Typography>
      </Box>
    );
  }

  const currentContent = activeTab === 'pending' ? pendingContent : approvedContent;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          sx={{ 
            fontWeight: 700, 
            mb: 2,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          📋 Content Management
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
            Review, approve, and manage content uploaded by mini admins
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchPendingContent();
              fetchApprovedContent();
            }}
            disabled={loading}
            fullWidth={isMobile}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)'
            }
          }}>
            <CardContent>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, color: 'white' }}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>⏳ Pending Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 24px rgba(56, 239, 125, 0.4)'
            }
          }}>
            <CardContent>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, color: 'white' }}>
                {stats.approved}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>✅ Approved</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
            color: 'white',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 24px rgba(238, 9, 121, 0.4)'
            }
          }}>
            <CardContent>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, color: 'white' }}>
                {stats.rejected}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>❌ Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Pending/Approved */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.875rem', md: '1rem' }
            }
          }}
        >
          <Tab 
            label={`Pending (${stats.pending})`} 
            value="pending"
            icon={<Warning />}
            iconPosition="start"
          />
          <Tab 
            label={`Approved (${stats.approved})`} 
            value="approved"
            icon={<CheckCircle />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {error && activeTab === 'pending' && (
        <Alert severity={pendingContent.length === 0 ? "info" : "error"} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Content List */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {currentContent.map((content, index) => (
          <Grid item xs={12} key={`${content.courseId}_${content.unitId}_${content.topicId || content.assessmentId}_${index}`}>
            <Card sx={{ 
              background: 'linear-gradient(145deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              border: '1px solid',
              borderColor: 'rgba(102, 126, 234, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(102, 126, 234, 0.2)',
                borderColor: 'primary.main'
              }
            }}>
              <CardContent>
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={2} 
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                  <Avatar sx={{ 
                    bgcolor: `${getContentColor(content.type)}.main`,
                    width: { xs: 48, md: 56 },
                    height: { xs: 48, md: 56 }
                  }}>
                    {getContentIcon(content.type)}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      {content.topicTitle || content.content?.title || `${content.type.toUpperCase()} Content`}
                    </Typography>
                    
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        📚 <strong>Course:</strong> {content.courseName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        📖 <strong>Unit:</strong> {content.unitName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        📁 <strong>File:</strong> {content.content?.filename || content.content?.originalName || 'Unknown file'}
                      </Typography>
                      {!isMobile && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            👤 <strong>Uploaded by:</strong> {content.uploaderName || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            📅 <strong>Date:</strong> {new Date(content.uploadDate).toLocaleDateString()}
                          </Typography>
                        </>
                      )}
                    </Stack>
                    
                    {content.content?.isPremium && (
                      <Chip 
                        icon={<Star />}
                        label="Premium" 
                        color="warning"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Stack 
                    direction={{ xs: 'row', md: 'column' }} 
                    spacing={1} 
                    sx={{ 
                      width: { xs: '100%', md: 'auto' },
                      flexWrap: { xs: 'wrap', md: 'nowrap' }
                    }}
                  >
                    <Chip 
                      label={content.type.toUpperCase()} 
                      color={getContentColor(content.type)}
                      size="small"
                      sx={{ display: { xs: 'none', md: 'flex' } }}
                    />
                    
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handlePreview(content)}
                      fullWidth={isMobile}
                      sx={{ textTransform: 'none' }}
                    >
                      {isMobile ? 'View' : 'Preview'}
                    </Button>
                    
                    {activeTab === 'pending' ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<Check />}
                          onClick={() => handleReview(content, 'approve')}
                          fullWidth={isMobile}
                          sx={{ textTransform: 'none' }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<Close />}
                          onClick={() => handleReview(content, 'reject')}
                          fullWidth={isMobile}
                          sx={{ textTransform: 'none' }}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<Edit />}
                        onClick={() => handleEdit(content)}
                        fullWidth={isMobile}
                        sx={{ textTransform: 'none' }}
                      >
                        Edit
                      </Button>
                    )}
                    
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(content)}
                      fullWidth={isMobile}
                      sx={{ textTransform: 'none' }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {currentContent.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: { xs: 6, md: 8 } }}>
          <Typography variant={isMobile ? "h6" : "h5"} color="text.secondary" gutterBottom>
            {activeTab === 'pending' ? '🎉 All caught up!' : '📋 No approved content yet'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {activeTab === 'pending' 
              ? 'No pending content to review at the moment.' 
              : 'Approved content will appear here.'}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => {
              fetchPendingContent();
              fetchApprovedContent();
            }}
            sx={{ mt: 2, textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, content: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Content Preview: {previewDialog.content?.topicTitle || previewDialog.content?.content?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Type: {previewDialog.content?.type?.toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            File: {previewDialog.content?.content?.filename || previewDialog.content?.content?.originalName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Course: {previewDialog.content?.courseName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Unit: {previewDialog.content?.unitName}
          </Typography>
          
          {/* Image Preview for Assessments */}
          {(previewDialog.content?.type === 'cats' || 
            previewDialog.content?.type === 'assignments' || 
            previewDialog.content?.type === 'pastExams') && 
            previewDialog.content?.content?.filePath && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                📸 Assessment Image Preview:
              </Typography>
              <Box sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1, 
                p: 2,
                textAlign: 'center',
                bgcolor: 'grey.50',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <img 
                  src={buildFileUrl(previewDialog.content.content.filePath)}
                  alt="Assessment Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '350px',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ display: 'none', mt: 2 }}
                >
                  ❌ Image preview not available
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                💡 Check image quality to determine if content should be marked as premium
              </Typography>
            </Box>
          )}

          {/* File Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {previewDialog.content?.type === 'video' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => handleViewFile(previewDialog.content)}
              >
                Play Video
              </Button>
            )}
            {previewDialog.content?.type === 'notes' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PictureAsPdf />}
                onClick={() => handleViewFile(previewDialog.content)}
              >
                View PDF
              </Button>
            )}
            {(previewDialog.content?.type === 'cats' || 
              previewDialog.content?.type === 'assignments' || 
              previewDialog.content?.type === 'pastExams') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Assessment />}
                onClick={() => handleViewFile(previewDialog.content)}
              >
                View Assessment
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleDownloadFile(previewDialog.content)}
            >
              Download File
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            variant="contained"
            color="success"
            startIcon={<Check />}
            onClick={() => {
              setPreviewDialog({ open: false, content: null });
              handleReview(previewDialog.content, 'approve');
            }}
          >
            Approve
          </Button>
          <Button 
            variant="contained"
            color="error"
            startIcon={<Close />}
            onClick={() => {
              setPreviewDialog({ open: false, content: null });
              handleReview(previewDialog.content, 'reject');
            }}
          >
            Reject
          </Button>
          <Button onClick={() => setPreviewDialog({ open: false, content: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialog.open} 
        onClose={() => setReviewDialog({ open: false, content: null, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'} Content
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Content: {reviewDialog.content?.topicTitle || reviewDialog.content?.content?.title}
          </Typography>
          
          {reviewDialog.action === 'approve' && (
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
                  <Star color={isPremium ? 'warning' : 'disabled'} />
                  <Typography>Mark as Premium Content</Typography>
                </Box>
              }
              sx={{ mb: 2 }}
            />
          )}
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Notes"
            placeholder={`Add notes for ${reviewDialog.action}ing this content...`}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, content: null, action: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            color={reviewDialog.action === 'approve' ? 'success' : 'error'}
            onClick={submitReview}
            startIcon={reviewDialog.action === 'approve' ? <Check /> : <Close />}
          >
            {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, content: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Delete Content Permanently
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to permanently delete this content from the database?
          </Typography>
          <Typography variant="subtitle2" color="error" gutterBottom>
            Content: {deleteDialog.content?.topicTitle || deleteDialog.content?.content?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Course: {deleteDialog.content?.courseName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Unit: {deleteDialog.content?.unitName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            File: {deleteDialog.content?.content?.filename || deleteDialog.content?.content?.originalName}
          </Typography>
          
          <Alert severity="error" sx={{ mt: 2 }}>
            ⚠️ This action cannot be undone! The content will be permanently removed from the database.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, content: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            color="error"
            onClick={deleteContent}
            startIcon={<Delete />}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog for Approved Content */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, content: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Content Settings
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Content: {editDialog.content?.topicTitle || editDialog.content?.content?.title}
          </Typography>
          
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
                <Star color={isPremium ? 'warning' : 'disabled'} />
                <Typography>Mark as Premium Content</Typography>
              </Box>
            }
            sx={{ mt: 2 }}
          />
          
          <Alert severity="info" sx={{ mt: 2 }}>
            💡 Premium content requires students to have an active subscription to access.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, content: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={submitEdit}
            startIcon={<Check />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RealContentApproval;
