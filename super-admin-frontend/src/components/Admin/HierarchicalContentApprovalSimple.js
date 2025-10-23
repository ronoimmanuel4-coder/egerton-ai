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
  CircularProgress,
  Avatar,
  Badge,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardActions
} from '@mui/material';
import {
  School,
  MenuBook,
  Class,
  VideoLibrary,
  Description,
  Assignment,
  Quiz,
  ExpandMore,
  ExpandLess,
  Visibility,
  Check,
  Close,
  Star,
  Download,
  PlayArrow,
  PictureAsPdf,
  Assessment
} from '@mui/icons-material';
import api from '../../utils/api';

const HierarchicalContentApprovalSimple = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [institutions, setInstitutions] = useState([]);
  const [expandedInstitutions, setExpandedInstitutions] = useState({});
  const [expandedCourses, setExpandedCourses] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});
  
  // Dialog states
  const [previewDialog, setPreviewDialog] = useState({ open: false, content: null });
  const [reviewDialog, setReviewDialog] = useState({ open: false, content: null, action: null });
  const [reviewNotes, setReviewNotes] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch real pending content and institutions
      const [pendingResponse, institutionsResponse] = await Promise.allSettled([
        api.get('/api/content-approval/pending'),
        api.get('/api/institutions')
      ]);
      
      let pendingContent = [];
      let realInstitutions = [];
      
      if (pendingResponse.status === 'fulfilled') {
        pendingContent = pendingResponse.value.data.pendingContent || [];
        console.log('📋 Found pending content:', pendingContent.length);
      }
      
      if (institutionsResponse.status === 'fulfilled') {
        realInstitutions = institutionsResponse.value.data.institutions || [];
      }
      
      if (pendingContent.length > 0 && realInstitutions.length > 0) {
        // Group pending content by institution -> course -> unit
        const institutionMap = new Map();
        
        pendingContent.forEach(item => {
          // Find the institution for this course
          const course = realInstitutions.find(inst => 
            inst.courses?.some(c => c._id === item.courseId)
          );
          
          if (!course) return;
          
          const institutionId = course._id;
          
          if (!institutionMap.has(institutionId)) {
            institutionMap.set(institutionId, {
              ...course,
              courses: new Map()
            });
          }
          
          const institution = institutionMap.get(institutionId);
          
          if (!institution.courses.has(item.courseId)) {
            institution.courses.set(item.courseId, {
              _id: item.courseId,
              name: item.courseName,
              units: new Map()
            });
          }
          
          const courseObj = institution.courses.get(item.courseId);
          
          if (!courseObj.units.has(item.unitId)) {
            courseObj.units.set(item.unitId, {
              _id: item.unitId,
              name: item.unitName,
              content: []
            });
          }
          
          const unit = courseObj.units.get(item.unitId);
          
          // Convert content to our expected format
          const contentItem = {
            _id: item.topicId || item.assessmentId || `${item.courseId}_${item.unitId}_${Date.now()}`,
            title: item.topicTitle || item.content.title || `${item.type.toUpperCase()} Content`,
            type: item.type === 'cats' ? 'assessment' : 
              item.type === 'assignments' ? 'assessment' : 
              item.type === 'pastExams' ? 'assessment' : 
              item.type === 'video' ? 'video' : 'notes',
            filename: item.content.filename || item.content.originalName || 'Unknown file',
            uploadedBy: item.content.uploadedBy || 'Unknown',
            uploadedAt: item.uploadDate,
            status: 'pending',
            rawData: item // Keep original data for API calls
          };
          
          unit.content.push(contentItem);
        });
        
        // Convert maps back to arrays
        const processedInstitutions = Array.from(institutionMap.values()).map(inst => ({
          ...inst,
          courses: Array.from(inst.courses.values()).map(course => ({
            ...course,
            units: Array.from(course.units.values())
          }))
        }));
        
        setInstitutions(processedInstitutions);
        
        // Set real stats
        setStats({
          pending: pendingContent.length,
          approved: 0, // We'll need another endpoint for this
          rejected: 0, // We'll need another endpoint for this
          total: pendingContent.length
        });
        
        if (pendingContent.length === 0) {
          setError('No pending content found. All content has been reviewed!');
        }
        
      } else {
        // No pending content or institutions
        setInstitutions([]);
        setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
        setError('No pending content found for approval.');
      }
      
    } catch (error) {
      console.error('Error fetching pending content:', error);
      setError('Failed to fetch pending content. Please check your connection.');
      setInstitutions([]);
      setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };
  // Note: this component relies on live data from `/api/content-approval/pending`.

  // Expansion handlers
  const toggleInstitution = (institutionId) => {
    setExpandedInstitutions(prev => ({
      ...prev,
      [institutionId]: !prev[institutionId]
    }));
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const toggleUnit = (unitId) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  // Content actions
  const handlePreview = (content) => {
    setPreviewDialog({ open: true, content });
  };

  const handleReview = (content, action) => {
    setReviewDialog({ open: true, content, action });
    setReviewNotes('');
    setIsPremium(false);
  };

  const submitReview = async () => {
    try {
      const { content, action } = reviewDialog;
      
      // For now, simulate the approval/rejection since the backend endpoints don't exist yet
      console.log(`${action.toUpperCase()} Content:`, {
        contentId: content._id,
        title: content.title,
        type: content.type,
        reviewNotes,
        isPremium: action === 'approve' ? isPremium : false,
        reviewedAt: new Date().toISOString()
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state to remove approved/rejected content
      setInstitutions(prev => prev.map(inst => ({
        ...inst,
        courses: inst.courses.map(course => ({
          ...course,
          units: course.units.map(unit => ({
            ...unit,
            content: unit.content.filter(c => c._id !== content._id)
          }))
        }))
      })));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        [action === 'approve' ? 'approved' : 'rejected']: prev[action === 'approve' ? 'approved' : 'rejected'] + 1
      }));
      
      setSnackbar({
        open: true,
        message: `Content ${action}d successfully! ${isPremium && action === 'approve' ? '⭐ Marked as Premium' : ''}`,
        severity: 'success'
      });
      
      setReviewDialog({ open: false, content: null, action: null });
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${reviewDialog.action} content`,
        severity: 'error'
      });
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video': return <VideoLibrary />;
      case 'notes': return <Description />;
      case 'assessment': return <Assessment />;
      default: return <Quiz />;
    }
  };

  const getContentColor = (type) => {
    switch (type) {
      case 'video': return 'error';
      case 'notes': return 'primary';
      case 'assessment': return 'warning';
      default: return 'info';
    }
  };

  const getPendingCount = (items, key = 'content') => {
    if (!items) return 0;
    if (key === 'content') {
      return items.filter(item => item.status === 'pending').length;
    }
    return items.reduce((count, item) => {
      if (item[key]) {
        return count + getPendingCount(item[key], key === 'courses' ? 'units' : 'content');
      }
      return count;
    }, 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
          📋 Hierarchical Content Approval
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and approve content organized by University → Course → Unit structure
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'white' }}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>⏳ Pending Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'white' }}>
                {stats.approved}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>✅ Approved</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'white' }}>
                {stats.rejected}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>❌ Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'white' }}>
                {institutions.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>🏫 Institutions</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Hierarchical Content Structure */}
      {institutions.map((institution) => {
        const institutionPendingCount = getPendingCount(institution.courses, 'courses');
        
        return (
          <Card key={institution._id} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <School />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    🏫 {institution.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📍 {institution.location?.town}, {institution.location?.county}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {institutionPendingCount > 0 && (
                    <Badge badgeContent={institutionPendingCount} color="warning">
                      <Chip 
                        label={`${institution.courses?.length || 0} Courses`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </Badge>
                  )}
                  <IconButton 
                    onClick={() => toggleInstitution(institution._id)}
                    size="small"
                  >
                    {expandedInstitutions[institution._id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              </Box>
              
              <Collapse in={expandedInstitutions[institution._id]}>
                <Box sx={{ mt: 3, pl: 2 }}>
                  {institution.courses?.map((course) => {
                    const coursePendingCount = getPendingCount(course.units, 'units');
                    
                    return (
                      <Card key={course._id} sx={{ mb: 2, ml: 2, border: 1, borderColor: 'divider' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                              <MenuBook sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                📚 {course.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {course.code} - {course.department}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {coursePendingCount > 0 && (
                                <Badge badgeContent={coursePendingCount} color="warning">
                                  <Chip 
                                    label={`${course.units?.length || 0} Units`}
                                    color="secondary"
                                    variant="outlined"
                                    size="small"
                                  />
                                </Badge>
                              )}
                              <IconButton 
                                onClick={() => toggleCourse(course._id)}
                                size="small"
                              >
                                {expandedCourses[course._id] ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Collapse in={expandedCourses[course._id]}>
                            <Box sx={{ mt: 2, pl: 2 }}>
                              {course.units?.map((unit) => {
                                const unitPendingCount = getPendingCount(unit.content);
                                
                                return (
                                  <Card key={unit._id} sx={{ mb: 2, ml: 2, border: 1, borderColor: 'divider' }}>
                                    <CardContent sx={{ py: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: 'info.main', width: 28, height: 28 }}>
                                          <Class sx={{ fontSize: 16 }} />
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            📖 {unit.name}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {unit.code} - Year {unit.year}, Semester {unit.semester}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {unitPendingCount > 0 && (
                                            <Badge badgeContent={unitPendingCount} color="warning">
                                              <Chip 
                                                label="Pending Content"
                                                color="warning"
                                                variant="outlined"
                                                size="small"
                                              />
                                            </Badge>
                                          )}
                                          <IconButton 
                                            onClick={() => toggleUnit(unit._id)}
                                            size="small"
                                          >
                                            {expandedUnits[unit._id] ? <ExpandLess /> : <ExpandMore />}
                                          </IconButton>
                                        </Box>
                                      </Box>
                                      
                                      <Collapse in={expandedUnits[unit._id]}>
                                        <Box sx={{ mt: 2, pl: 2 }}>
                                          {unit.content?.filter(content => content.status === 'pending').map((content) => (
                                            <Card key={content._id} sx={{ mb: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                                              <CardContent sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                  <Avatar sx={{ 
                                                    bgcolor: `${getContentColor(content.type)}.main`, 
                                                    width: 24, 
                                                    height: 24 
                                                  }}>
                                                    {React.cloneElement(getContentIcon(content.type), { sx: { fontSize: 14, color: 'white' } })}
                                                  </Avatar>
                                                  <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                      {content.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                      📁 {content.filename} • 👤 {content.uploadedBy}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Button
                                                      size="small"
                                                      variant="outlined"
                                                      startIcon={<Visibility />}
                                                      onClick={() => handlePreview(content)}
                                                    >
                                                      Preview
                                                    </Button>
                                                    <Button
                                                      size="small"
                                                      variant="contained"
                                                      color="success"
                                                      startIcon={<Check />}
                                                      onClick={() => handleReview(content, 'approve')}
                                                    >
                                                      Approve
                                                    </Button>
                                                    <Button
                                                      size="small"
                                                      variant="contained"
                                                      color="error"
                                                      startIcon={<Close />}
                                                      onClick={() => handleReview(content, 'reject')}
                                                    >
                                                      Reject
                                                    </Button>
                                                  </Box>
                                                </Box>
                                              </CardContent>
                                            </Card>
                                          ))}
                                          {unit.content?.filter(content => content.status === 'pending').length === 0 && (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                              ✅ No pending content in this unit
                                            </Typography>
                                          )}
                                        </Box>
                                      </Collapse>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Box>
                          </Collapse>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}

      {institutions.length === 0 && (
        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            No Content to Review
          </Typography>
          <Typography variant="body2">
            There are currently no institutions with pending content for approval.
          </Typography>
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, content: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {previewDialog.content && getContentIcon(previewDialog.content.type)}
            <Box>
              <Typography variant="h6">
                {previewDialog.content?.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {previewDialog.content?.type?.toUpperCase()} • {previewDialog.content?.filename}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewDialog.content?.type === 'video' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Video Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {previewDialog.content?.filename}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" startIcon={<PlayArrow />}>
                  Play Video
                </Button>
                <Button variant="outlined" startIcon={<Download />}>
                  Download (Admin Only)
                </Button>
              </Box>
            </Box>
          )}
          {previewDialog.content?.type === 'notes' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PictureAsPdf sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                PDF Notes Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {previewDialog.content?.filename}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" startIcon={<Visibility />}>
                  View PDF
                </Button>
                <Button variant="outlined" startIcon={<Download />}>
                  Download (Admin Only)
                </Button>
              </Box>
            </Box>
          )}
          {previewDialog.content?.type === 'assessment' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Assessment Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {previewDialog.content?.filename}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" startIcon={<Visibility />}>
                  View Assessment
                </Button>
                <Button variant="outlined" startIcon={<Download />}>
                  Download (Admin Only)
                </Button>
              </Box>
            </Box>
          )}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {reviewDialog.action === 'approve' ? <Check color="success" /> : <Close color="error" />}
            <Typography variant="h6">
              {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'} Content
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Content Details:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📄 {reviewDialog.content?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📁 {reviewDialog.content?.filename}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              👤 Uploaded by: {reviewDialog.content?.uploadedBy}
            </Typography>
          </Box>
          
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

      {/* Success/Error Snackbar */}
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

export default HierarchicalContentApprovalSimple;
