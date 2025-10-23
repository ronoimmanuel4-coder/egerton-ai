import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogContent,
  IconButton,
  Stack
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import DescriptionIcon from '@mui/icons-material/Description';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import SecureContentViewer from '../components/SecureContentViewer';
import { 
  staggerGrid, 
  fadeInUp, 
  magneticHover, 
  buttonPress 
} from '../utils/motionPresets';

const ResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { user } = useAuth();
  const [actionError, setActionError] = useState('');
  const [recentDownload, setRecentDownload] = useState(null);
  const [secureViewerResource, setSecureViewerResource] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setError(null);
      const response = await api.get('/api/resources');
      if (response.status >= 200 && response.status < 300) {
        setResources(response.data.resources || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources. Please try again later.');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceDownload = async (resource) => {
    setActionError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setActionError('Please log in to download this resource.');
      return;
    }

    const isLocked = resource.isPremium && resource.isPremiumLocked;
    if (isLocked) {
      setActionError('You need an active subscription for this course to download this resource.');
      return;
    }

    const payload = {
      courseId: resource.course?._id || resource.course,
      year: resource.year,
      unitId: resource.unitId,
      unitName: resource.unitName,
      topicId: resource.topicId,
      topicTitle: resource.topicTitle,
      resourceId: resource._id?.toString() || resource.id || resource.filename,
      resourceTitle: resource.title,
      filename: resource.file?.filename || resource.file?.url?.split('/')?.pop() || resource.filename,
      fileSize: resource.file?.size,
      origin: 'resource'
    };

    if (!payload.courseId || !payload.filename) {
      setActionError('Resource metadata incomplete. Please contact support.');
      return;
    }

    try {
      const response = await api.post('/api/student-downloads', payload);
      setRecentDownload({
        title: resource.title,
        courseName: resource.course?.name || resource.courseName,
        year: payload.year,
        expiresAt: response.data?.download?.expiresAt,
        timestamp: Date.now()
      });
    } catch (err) {
      if (err.response?.status !== 403) {
        console.error('Failed to register resource download:', err);
        setActionError(err.response?.data?.message || 'Unable to store download. Please try again.');
        return;
      }
    }

    setSecureViewerResource({
      filename: payload.filename,
      title: resource.title,
      contentType: 'pdf'
    });
  };

  const filteredResources = (resources || []).filter((resource) => {
    if (!resource) return false;
    const matchesSearch = (resource.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resource.unitName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || resource.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Educational Resources
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Access lecture videos, past papers, CATs, and other study materials
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchResources}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {actionError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {actionError}
          </Alert>
        )}

        {recentDownload && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            sx={{ mb: 3 }}
            onClose={() => setRecentDownload(null)}
          >
            <Typography variant="body2">
              Download started for <strong>{recentDownload.title}</strong>{' '}
              {recentDownload.courseName ? `(${recentDownload.courseName}) ` : ''}
              {recentDownload.year ? `- Year ${recentDownload.year}` : ''}. View it anytime on your
              <Button color="inherit" size="small" onClick={() => window.open('/downloads', '_blank')} sx={{ ml: 1 }}>
                Downloads page
              </Button>
            </Typography>
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filterType}
                  label="Filter by Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="lecture_video">Lecture Videos</MenuItem>
                  <MenuItem value="past_paper">Past Papers</MenuItem>
                  <MenuItem value="cat">CATs</MenuItem>
                  <MenuItem value="notes">Notes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          <AnimatePresence mode="popLayout">
            {filteredResources.map((resource, index) => {
              const isLocked = resource.isPremium && resource.isPremiumLocked;

              return (
                <Grid item xs={12} md={6} lg={4} key={resource._id}>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    variants={staggerGrid.item}
                    custom={index}
                    whileHover={{ 
                      scale: 1.03, 
                      y: -8,
                      boxShadow: '0 20px 60px rgba(33,150,243,0.25)',
                      transition: { type: 'spring', stiffness: 300, damping: 20 }
                    }}
                    layout
                  >
                    <Card 
                      sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        border: `2px solid ${isLocked ? 'rgba(255,152,0,0.2)' : 'rgba(33,150,243,0.1)'}`,
                        background: isLocked 
                          ? 'linear-gradient(135deg, rgba(255,152,0,0.03), rgba(255,152,0,0.08))'
                          : 'linear-gradient(135deg, rgba(33,150,243,0.03), rgba(33,150,243,0.08))',
                      }}
                    >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {resource.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {resource.unitCode} - {resource.unitName}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={resource.type.replace('_', ' ')}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {resource.isPremium && (
                          <Chip label="Premium" color="warning" size="small" />
                        )}
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        👁️ {resource.viewCount} views | ⬇️ {resource.downloadCount} downloads
                      </Typography>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          component={motion.button}
                          whileHover="hover"
                          whileTap="tap"
                          {...buttonPress}
                          variant="contained"
                          color={isLocked ? 'warning' : 'primary'}
                          startIcon={isLocked ? <LockIcon /> : <DownloadIcon />}
                          onClick={() => handleResourceDownload(resource)}
                          disabled={isLocked}
                          fullWidth
                        >
                          {isLocked ? 'Subscribe to Access' : 'Download File'}
                        </Button>
                        {!isLocked && (
                          <Button
                            component={motion.button}
                            whileHover="hover"
                            whileTap="tap"
                            {...buttonPress}
                            variant="outlined"
                            color="secondary"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleResourceDownload(resource, { viewOnly: true })}
                            fullWidth
                          >
                            View Secure Copy
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
          </AnimatePresence>
        </Grid>

        {filteredResources.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No resources found matching your criteria.
            </Typography>
          </Box>
        )}
      </motion.div>
    </Container>

    <Dialog
      open={Boolean(secureViewerResource)}
      onClose={() => setSecureViewerResource(null)}
      fullWidth
      maxWidth="lg"
      PaperProps={{ sx: { height: '90vh', borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {secureViewerResource?.title}
        </Typography>
        <IconButton onClick={() => setSecureViewerResource(null)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 0, height: '100%' }}>
        {secureViewerResource && (
          <SecureContentViewer
            filename={secureViewerResource.filename}
            contentType={secureViewerResource.contentType}
            title={secureViewerResource.title}
            backendUrl={process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}
            preventScreenshot
            preventRecording
            onClose={() => setSecureViewerResource(null)}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ResourcesPage;
