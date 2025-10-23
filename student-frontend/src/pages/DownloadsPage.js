import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Download as DownloadIcon,
  AccessTime,
  Description,
  School,
  Folder,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ArrowBack
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '../utils/api';
import SecureContentViewer from '../components/SecureContentViewer';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);

const courseSectionVariants = {
  hidden: { opacity: 0, y: 36, rotateX: -10 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: [0.19, 1, 0.22, 1]
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, rotateX: -12, rotateY: -6, scale: 0.95 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      delay: index * 0.08,
      ease: [0.19, 1, 0.22, 1]
    }
  })
};

const formatTimeLeft = (expiresAt, now) => {
  if (!expiresAt) return 'Unknown';
  const expires = dayjs(expiresAt);
  if (!expires.isValid()) return 'Unknown';
  const diff = expires.diff(now, 'second');
  if (diff <= 0) {
    return 'Expired';
  }
  const days = Math.floor(diff / (60 * 60 * 24));
  const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);
  const seconds = diff % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours.toString().padStart(2, '0')}h`);
  parts.push(`${minutes.toString().padStart(2, '0')}m`);
  parts.push(`${seconds.toString().padStart(2, '0')}s`);
  return parts.join(' ');
};

const DownloadsPage = () => {
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(dayjs());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewerResource, setViewerResource] = useState(null);

  useEffect(() => {
    let timerId;

    const tick = () => {
      setNow(dayjs());
      timerId = window.setTimeout(tick, 1000);
    };

    tick();

    return () => {
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, []);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/api/student-downloads');
        const mapped = (response.data?.downloads || []).map((item) => ({
          ...item,
          downloadedAt: item.downloadedAt ? dayjs(item.downloadedAt) : null,
          expiresAt: item.expiresAt ? dayjs(item.expiresAt) : null
        }));
        setDownloads(mapped);
      } catch (err) {
        console.error('Failed to fetch downloads:', err);
        setError(err.response?.data?.message || 'Unable to load downloads at the moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  const groupedDownloads = useMemo(() => {
    return downloads.reduce((acc, download) => {
      const courseKey = download.courseId || 'unknown';
      if (!acc[courseKey]) {
        acc[courseKey] = {
          courseName: download.courseName || 'Unknown Course',
          courseCode: download.courseCode,
          items: []
        };
      }
      acc[courseKey].items.push(download);
      return acc;
    }, {});
  }, [downloads]);

  const handleOpenDownload = (download) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Your session has expired. Please sign in again to access downloads.');
      return;
    }

    const backendBase = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    const viewerUrl = new URL(`/api/upload/file/${download.filename}`, backendBase);
    viewerUrl.searchParams.set('token', token);
    if (download.courseId) viewerUrl.searchParams.set('courseId', download.courseId);
    if (download.year) viewerUrl.searchParams.set('year', download.year);
    if (download.resourceId) viewerUrl.searchParams.set('resourceId', download.resourceId);
    if (download.resourceTitle) viewerUrl.searchParams.set('resourceTitle', download.resourceTitle);
    if (download.unitId) viewerUrl.searchParams.set('unitId', download.unitId);
    if (download.unitName) viewerUrl.searchParams.set('unitName', download.unitName);
    if (download.topicId) viewerUrl.searchParams.set('topicId', download.topicId);
    if (download.topicTitle) viewerUrl.searchParams.set('topicTitle', download.topicTitle);
    if (download.fileSize) viewerUrl.searchParams.set('fileSize', download.fileSize);
    if (download.origin) viewerUrl.searchParams.set('origin', download.origin);

    setViewerResource({
      filename: download.filename,
      title: download.resourceTitle || download.filename,
      contentType: download.filename?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'file',
      viewerUrl: viewerUrl.toString()
    });
  };

  const handleDeleteDownload = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      setDeleteError('');
      await api.delete(`/api/student-downloads/${deleteTarget._id}`);
      setDownloads((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete download:', err);
      setDeleteError(err.response?.data?.message || 'Unable to delete download. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderCourseSection = (courseKey, group) => (
    <Box
      key={courseKey}
      component={motion.div}
      variants={courseSectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35, margin: '-120px 0px -80px' }}
      sx={{ mb: 4, transformStyle: 'preserve-3d' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <School color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {group.courseName}
          {group.courseCode && (
            <Typography component="span" variant="subtitle2" sx={{ ml: 1, color: 'text.secondary' }}>
              ({group.courseCode})
            </Typography>
          )}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {group.items.map((download, index) => {
          const expiresLabel = download.expiresAt ? download.expiresAt.format('DD MMM YYYY, HH:mm') : 'Unknown';
          const timeLeft = formatTimeLeft(download.expiresAt, now);
          const isExpired = timeLeft === 'Expired';

          return (
            <Grid item xs={12} md={6} key={`${download.resourceId}-${download.filename}`}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.45 }}
                custom={index}
                whileHover={{ y: -8, scale: 1.01, boxShadow: '0 24px 60px rgba(25, 118, 210, 0.18)' }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                style={{ willChange: 'transform', transformOrigin: 'center top' }}
              >
                <Card
                  sx={{
                    borderRadius: 3,
                    border: isExpired ? '1px solid #ef5350' : '1px solid rgba(33,150,243,0.15)',
                    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)',
                    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease'
                  }}
                >
                  <CardContent>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {download.resourceTitle || download.filename}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {download.unitName && (
                        <Chip icon={<Folder />} label={download.unitName} size="small" color="primary" variant="outlined" />
                      )}
                      {download.year && (
                        <Chip label={`Year ${download.year}`} size="small" color="secondary" />
                      )}
                      {download.topicTitle && (
                        <Chip label={download.topicTitle} size="small" variant="outlined" />
                      )}
                      {download.fileSize && (
                        <Chip label={`${(download.fileSize / (1024 * 1024)).toFixed(1)} MB`} size="small" variant="outlined" />
                      )}
                    </Box>

                    <Divider />

                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color={isExpired ? 'error' : 'action'} />
                        <Typography variant="body2" color={isExpired ? 'error.main' : 'text.secondary'}>
                          {isExpired ? 'Subscription expired' : `Expires: ${expiresLabel}`}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color={isExpired ? 'error.main' : 'text.secondary'}>
                        {isExpired ? 'Download no longer available.' : `Time remaining: ${timeLeft}`}
                      </Typography>
                      {download.downloadedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Downloaded {download.downloadedAt.from(now)}
                        </Typography>
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        disabled={isExpired}
                        onClick={() => handleOpenDownload(download)}
                      >
                        {isExpired ? 'Expired' : 'View Secure Copy'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteTarget(download)}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/resources');
            }
          }}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          My Downloads
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Access notes you have downloaded while your course subscriptions remain active.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {deleteError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {deleteError}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : downloads.length === 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <DownloadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No downloads yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Download premium notes from your courses to see them listed here. Once a subscription expires, the related downloads disappear automatically.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedDownloads).map(([key, group]) => renderCourseSection(key, group))
        )}
      </motion.div>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (!deleteLoading ? setDeleteTarget(null) : null)}
      >
        <DialogTitle>Remove download?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Removing this download hides it from your list. You can always download the resource again from the resources page if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleteLoading} onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button color="error" variant="contained" disabled={deleteLoading} onClick={handleDeleteDownload}>
            {deleteLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(viewerResource)}
        onClose={() => setViewerResource(null)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: '90vh', borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {viewerResource?.title}
          </Typography>
          <IconButton onClick={() => setViewerResource(null)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {viewerResource && (
            <SecureContentViewer
              filename={viewerResource.filename}
              contentType={viewerResource.contentType}
              title={viewerResource.title}
              backendUrl={process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}
              preventScreenshot
              preventRecording
              onClose={() => setViewerResource(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DownloadsPage;
