import React, { useState, useEffect, useMemo } from 'react';
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
  Snackbar,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Stack,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import {
  VideoLibrary,
  Description,
  Assessment,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  Download,
  PlayArrow,
  PictureAsPdf,
  Warning,
  Star,
  StarBorder,
  FilterList,
  ViewModule,
  TableRows,
  CheckCircleOutline,
  School,
  Search as SearchIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const categoryMeta = {
  all: { label: 'All content', icon: <CheckCircleOutline fontSize="small" />, color: 'primary' },
  video: { label: 'Lecture videos', icon: <VideoLibrary fontSize="small" />, color: 'error' },
  notes: { label: 'Lecture notes', icon: <Description fontSize="small" />, color: 'primary' },
  assessments: { label: 'Assessments', icon: <Assessment fontSize="small" />, color: 'warning' },
  premium: { label: 'Premium only', icon: <Star fontSize="small" />, color: 'warning' }
};

const flattenContentRecord = (content) => {
  const base = content.content || {};
  return {
    id: `${content.courseId}_${content.unitId}_${content.topicId || content.assessmentId}`,
    courseName: content.courseName || 'Unknown course',
    unitName: content.unitName || 'Unknown unit',
    topicTitle: content.topicTitle || base.title || `${content.type?.toUpperCase?.() || 'CONTENT'}`,
    filename: base.filename || base.originalName || base.filePath?.split('/').pop() || 'Unnamed file',
    type: content.type || 'notes',
    isPremium: Boolean(base.isPremium),
    lastReviewedAt: base.reviewDate || content.uploadDate || base.updatedAt || base.createdAt,
    size: base.size || null,
    extension: base.extension || base.mimeType || null,
    reviewer: base.reviewedBy || content.reviewer || 'System',
    raw: content
  };
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = (bytes / Math.pow(1024, index)).toFixed(1);
  return `${value} ${units[index]}`;
};

const ApprovedContentManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvedContent, setApprovedContent] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [institutionFilter, setInstitutionFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Dialog states
  const [previewDialog, setPreviewDialog] = useState({ open: false, content: null });
  const [editDialog, setEditDialog] = useState({ open: false, content: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, content: null });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const normalizedContent = useMemo(() => approvedContent.map(flattenContentRecord), [approvedContent]);

  const stats = useMemo(() => {
    const total = normalizedContent.length;
    const premium = normalizedContent.filter((item) => item.isPremium).length;
    const video = normalizedContent.filter((item) => item.type === 'video').length;
    const notes = normalizedContent.filter((item) => item.type === 'notes').length;
    const assessments = normalizedContent.filter((item) => ['cats', 'assignments', 'pastExams', 'assessments', 'assessment'].includes(item.type)).length;
    return { total, premium, video, notes, assessments };
  }, [normalizedContent]);

  const institutionOptions = useMemo(() => {
    const set = new Set(normalizedContent.map((item) => item.raw?.institutionName || item.raw?.institution?.name).filter(Boolean));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [normalizedContent]);

  const filteredContent = useMemo(() => {
    return normalizedContent.filter((item) => {
      const matchesSearch = searchTerm.trim().length === 0 || [
        item.topicTitle,
        item.courseName,
        item.unitName,
        item.filename
      ].some((value) => value?.toLowerCase().includes(searchTerm.trim().toLowerCase()));

      const matchesCategory = (() => {
        switch (categoryFilter) {
          case 'video':
            return item.type === 'video';
          case 'notes':
            return item.type === 'notes';
          case 'assessments':
            return ['cats', 'assignments', 'pastExams', 'assessments', 'assessment'].includes(item.type);
          case 'premium':
            return item.isPremium;
          default:
            return true;
        }
      })();

      const institutionName = item.raw?.institutionName || item.raw?.institution?.name || 'unknown';
      const matchesInstitution = institutionFilter === 'all' || institutionName === institutionFilter;

      return matchesSearch && matchesCategory && matchesInstitution;
    });
  }, [normalizedContent, searchTerm, categoryFilter, institutionFilter]);

  useEffect(() => {
    fetchApprovedContent();
  }, []);

  const fetchApprovedContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch approved content from all courses
      const response = await api.get('/api/content-approval/approved');
      const content = response.data.approvedContent || [];
      
      console.log('📋 Fetched approved content:', content);
      setApprovedContent(content);
      
      if (content.length === 0) {
        setError('No approved content found.');
      }
      
    } catch (error) {
      console.error('Error fetching approved content:', error);
      setError('Failed to fetch approved content. Please check your connection.');
      setApprovedContent([]);
    } finally {
      setLoading(false);
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

  const handleMenuOpen = (event, content) => {
    setMenuAnchor(event.currentTarget);
    setSelectedContent(content);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedContent(null);
  };

  const handlePreview = (content) => {
    setPreviewDialog({ open: true, content });
    handleMenuClose();
  };

  const handleEdit = (content) => {
    setEditDialog({ open: true, content });
    handleMenuClose();
  };

  const handleDelete = (content) => {
    setDeleteDialog({ open: true, content });
    handleMenuClose();
  };

  const handleViewFile = (content) => {
    const fileUrl = content.content?.filePath || content.content?.url;
    if (fileUrl) {
      window.open(`${process.env.REACT_APP_BACKEND_URL}${fileUrl}`, '_blank');
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
      const fileUrl = content.content?.filePath || content.content?.url;
      if (!fileUrl) {
        throw new Error('File URL not available');
      }

      const response = await api.get(`${fileUrl}`, { responseType: 'blob' });
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

  const togglePremiumStatus = async (content) => {
    try {
      const newPremiumStatus = !content.content?.isPremium;
      
      await api.put(`/api/content-approval/premium`, {
        courseId: content.courseId,
        unitId: content.unitId,
        topicId: content.topicId,
        assessmentId: content.assessmentId,
        contentType: content.type,
        isPremium: newPremiumStatus
      });

      // Update local state
      setApprovedContent(prev => prev.map(c => 
        (c.topicId === content.topicId || c.assessmentId === content.assessmentId) 
          ? { ...c, content: { ...c.content, isPremium: newPremiumStatus } }
          : c
      ));

      setSnackbar({
        open: true,
        message: `Content ${newPremiumStatus ? 'marked as premium' : 'removed from premium'}`,
        severity: 'success'
      });

    } catch (error) {
      console.error('Error updating premium status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update premium status',
        severity: 'error'
      });
    }
  };

  const deleteContent = async () => {
    try {
      const content = deleteDialog.content;
      
      await api.delete(`/api/content-approval/delete`, {
        data: {
          courseId: content.courseId,
          unitId: content.unitId,
          topicId: content.topicId,
          assessmentId: content.assessmentId,
          contentType: content.type
        }
      });
      
      // Remove from approved list
      setApprovedContent(prev => prev.filter(c => 
        c.topicId !== content.topicId && c.assessmentId !== content.assessmentId
      ));
      
      setSnackbar({
        open: true,
        message: 'Content deleted successfully from database',
        severity: 'success'
      });
      
      setDeleteDialog({ open: false, content: null });
      
    } catch (error) {
      console.error('Error deleting content:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete content: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading approved content...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleOutline color="success" /> Approved Content Library
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track the health of published assets, curate premium experiences, and keep institutions stocked with up-to-date materials.
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Total Published</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
                  <Chip size="small" color="success" icon={<CheckCircleOutline fontSize="small" />} label="Live in catalog" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Premium Experiences</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.premium}</Typography>
                  <Chip size="small" color="warning" icon={<Star fontSize="small" />} label="Member exclusives" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Video Lessons</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.video}</Typography>
                  <Chip size="small" color="error" icon={<VideoLibrary fontSize="small" />} label="Lecture videos" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Assessments & Notes</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.assessments}</Typography>
                    <Chip size="small" icon={<Assessment fontSize="small" />} label={`${stats.notes} notes`} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">Assessments include CATs, assignments, exams.</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    placeholder="Search title, course, unit, or filename"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                  <ToggleButtonGroup
                    value={categoryFilter}
                    exclusive
                    onChange={(_, value) => value && setCategoryFilter(value)}
                    size="small"
                  >
                    {Object.entries(categoryMeta).map(([key, meta]) => (
                      <ToggleButton key={key} value={key} aria-label={meta.label}>
                        <Stack spacing={0.5} alignItems="center">
                          {meta.icon}
                          <Typography variant="caption">{meta.label}</Typography>
                        </Stack>
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel id="institution-filter-label">Institution</InputLabel>
                    <Select
                      labelId="institution-filter-label"
                      value={institutionFilter}
                      label="Institution"
                      onChange={(event) => setInstitutionFilter(event.target.value)}
                    >
                      {institutionOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option === 'all' ? 'All institutions' : option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, value) => value && setViewMode(value)}
                  size="small"
                >
                  <ToggleButton value="grid" aria-label="Grid view">
                    <ViewModule fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="table" aria-label="Table view">
                    <TableRows fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {loading && (
                <LinearProgress />
              )}
            </Stack>
          </CardContent>
        </Card>

        {error && (
          <Alert severity={filteredContent.length === 0 ? 'info' : 'error'}>{error}</Alert>
        )}

        {filteredContent.length === 0 ? (
          <Paper variant="outlined" sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              📭 No matching content found
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Adjust your filters or refresh the catalog to bring in more assets.
            </Typography>
            <Button variant="contained" onClick={fetchApprovedContent} startIcon={<RefreshIcon />}>
              Refresh catalog
            </Button>
          </Paper>
        ) : viewMode === 'table' ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Course / Unit</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="center">Premium</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell>Reviewed</TableCell>
                  <TableCell align="center">Size</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContent.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.topicTitle}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.filename}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.courseName}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.unitName}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" color={getContentColor(item.type)} label={item.type.toUpperCase()} />
                    </TableCell>
                    <TableCell align="center">
                      {item.isPremium ? <Star color="warning" fontSize="small" /> : '—'}
                    </TableCell>
                    <TableCell>
                      {item.raw?.institutionName || item.raw?.institution?.name || '—'}
                    </TableCell>
                    <TableCell>{formatDateTime(item.lastReviewedAt)}</TableCell>
                    <TableCell align="center">{formatFileSize(item.size)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Preview">
                          <IconButton size="small" onClick={() => handlePreview(item.raw)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => handleDownloadFile(item.raw)}>
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={item.isPremium ? 'Remove premium' : 'Mark premium'}>
                          <IconButton size="small" onClick={() => togglePremiumStatus(item.raw)}>
                            {item.isPremium ? <StarBorder fontSize="small" /> : <Star fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(item.raw)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(item.raw)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Grid container spacing={2}>
            {filteredContent.map((item) => (
              <Grid item xs={12} md={6} xl={4} key={item.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Avatar sx={{ bgcolor: `${getContentColor(item.type)}.main`, color: 'white' }}>
                          {getContentIcon(item.type)}
                        </Avatar>
                        <Stack spacing={0.5} flexGrow={1}>
                          <Typography variant="h6">{item.topicTitle}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.courseName} • {item.unitName}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.filename}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" color={getContentColor(item.type)} label={item.type.toUpperCase()} />
                            {item.isPremium && <Chip size="small" color="warning" label="Premium" icon={<Star fontSize="small" />} />}
                          </Stack>
                        </Stack>
                        <Box>
                          <IconButton size="small" onClick={(event) => handleMenuOpen(event, item.raw)}>
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">Institution</Typography>
                          <Typography variant="body2">{item.raw?.institutionName || item.raw?.institution?.name || '—'}</Typography>
                        </Stack>
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">Reviewed</Typography>
                          <Typography variant="body2">{formatDateTime(item.lastReviewedAt)}</Typography>
                        </Stack>
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">Size</Typography>
                          <Typography variant="body2">{formatFileSize(item.size)}</Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handlePreview(selectedContent)}>
          <Visibility sx={{ mr: 1 }} />
          Preview
        </MenuItem>
        <MenuItem onClick={() => handleViewFile(selectedContent)}>
          {selectedContent?.type === 'video' && <PlayArrow sx={{ mr: 1 }} />}
          {selectedContent?.type === 'notes' && <PictureAsPdf sx={{ mr: 1 }} />}
          {(selectedContent?.type === 'cats' || selectedContent?.type === 'assignments' || selectedContent?.type === 'pastExams') && <Assessment sx={{ mr: 1 }} />}
          View File
        </MenuItem>
        <MenuItem onClick={() => handleDownloadFile(selectedContent)}>
          <Download sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => togglePremiumStatus(selectedContent)}>
          {selectedContent?.content?.isPremium ? <StarBorder sx={{ mr: 1 }} /> : <Star sx={{ mr: 1 }} />}
          {selectedContent?.content?.isPremium ? 'Remove Premium' : 'Mark Premium'}
        </MenuItem>
        <MenuItem onClick={() => handleEdit(selectedContent)}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedContent)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

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
          <Typography variant="body2" color="text.secondary">
            Status: {previewDialog.content?.content?.isPremium ? '⭐ Premium' : '🆓 Free'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, content: null })}>
            Close
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
          Delete Approved Content
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to permanently delete this approved content from the database?
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

export default ApprovedContentManagement;
