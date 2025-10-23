import React, { useState, useEffect, useRef, Component } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Button,
  Snackbar
} from '@mui/material';
import Alert from '@mui/material/Alert';
import {
  CheckCircle,
  Cancel,
  PendingActions,
  VideoLibrary,
  Description,
  Quiz,
  Assignment,
  School,
  Delete,
  Refresh,
  CheckBoxOutlineBlank,
  CheckBox,
  IndeterminateCheckBox
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../utils/api';

// Custom checkbox component with indeterminate state support
const CheckboxInput = React.memo(({ checked, indeterminate = false, onChange, disabled = false, sx = {} }) => {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={checkboxRef}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: '18px',
        height: '18px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...sx
      }}
    />
  );
});

// Add display name for better debugging
CheckboxInput.displayName = 'CheckboxInput';

// Error boundary component to catch rendering errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '16px', color: 'red' }}>
          <h3>Something went wrong in {this.props.componentName || 'a component'}</h3>
          <p>{this.state.error?.toString()}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper component to log component rendering
const withErrorBoundary = (WrappedComponent, componentName) => {
  return (props) => (
    <ErrorBoundary componentName={componentName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
};

const ContentStatus = () => {
  // State management
  const [contentStatus, setContentStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [typeTab, setTypeTab] = useState(0);
  const [stats, setStats] = useState({ 
    pending: 0, 
    approved: 0, 
    rejected: 0, 
    total: 0 
  });
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedKeys, setSelectedKeys] = useState(new Map());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });

  // Fetch content status on component mount
  useEffect(() => {
    fetchContentStatus();
  }, []);

  const fetchContentStatus = async () => {
    try {
      setLoading(true);
      // Fetch real content status from API
      const response = await api.get('/api/admin/content-status');
      const normalizedContent = (response.data.content || response.data.pendingContent || []).map(item => ({
        ...item,
        status: (item.status || 'pending').toLowerCase(),
        uploadDate: item.uploadDate ? new Date(item.uploadDate) : null,
        key: getItemKey(item)
      }));
      setContentStatus(normalizedContent);

      // Calculate stats from real data
      const newStats = normalizedContent.reduce((acc, item) => {
        const status = (item.status || 'pending').toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        acc.total++;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0, total: 0 });
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching content status:', error);
      setError('Failed to fetch content status');
    } finally {
      setLoading(false);
    }
  };

  const getItemKey = (item) => {
    if (!item) return null;
    if (item.id) return item.id;
    if (item._id) return item._id.toString();
    if (item.assessmentId) return item.assessmentId.toString();
    if (item.topicId) return `${item.topicId}-${item.type || ''}`;
    return `${item.unitId || 'unit'}-${item.type || 'content'}`;
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video': return <VideoLibrary color="primary" />;
      case 'notes': return <Description color="secondary" />;
      case 'cats': return <Quiz color="warning" />;
      case 'assignments': return <Assignment color="info" />;
      case 'pastExams': return <School color="success" />;
      default: return <PendingActions />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle color="success" />;
      case 'rejected': return <Cancel color="error" />;
      case 'pending': return <PendingActions color="warning" />;
      default: return <PendingActions />;
    }
  };

  const filteredByType = contentStatus.filter((content)=>{
    if(typeTab===0) return true;
    if(typeTab===1) return content.type==='video';
    if(typeTab===2) return content.type==='notes';
    if(typeTab===3) return content.type==='cats';
    if(typeTab===4) return content.type==='pastExams';
    return true;
  });

  const filteredContent = filteredByType.filter(content => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return content.status === 'pending'; // Pending
    if (tabValue === 2) return content.status === 'approved'; // Approved
    if (tabValue === 3) return content.status === 'rejected'; // Rejected
    return true;
  });

  const isBulkMode = tabValue === 1 && filteredContent.length > 0;

  const toggleSelect = (item) => {
    const key = getItemKey(item);
    if (!key) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

    setSelectedKeys((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, item);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingItems = filteredContent.filter((item) => item.status === 'pending');
    const pendingKeys = pendingItems
      .map((item) => ({ key: getItemKey(item), item }))
      .filter(({ key }) => Boolean(key));

    const allSelected = pendingKeys.every(({ key }) => selectedIds.has(key));

    const nextIds = new Set(selectedIds);
    const nextMap = new Map(selectedKeys);

    if (allSelected) {
      pendingKeys.forEach(({ key }) => {
        nextIds.delete(key);
        nextMap.delete(key);
      });
    } else {
      pendingKeys.forEach(({ key, item }) => {
        nextIds.add(key);
        nextMap.set(key, item);
      });
    }

    setSelectedIds(nextIds);
    setSelectedKeys(nextMap);
  };

  const handleDeleteContent = async (content) => {
    const confirmDelete = window.confirm('Delete this content? This action cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    try {
      const contentKey = getItemKey(content);
      setDeletingId(contentKey);
      setError(null);

      // For videos and notes, use topicId from the content object
      // For assessments, use assessmentId from the content object
      const payload = {
        courseId: content.courseId,
        unitId: content.unitId,
        contentType: content.type
      };

      // Add topicId for topic-based content (videos, notes)
      if (['video', 'notes', 'youtube_link'].includes(content.type)) {
        if (content.topicId) {
          payload.topicId = content.topicId;
        } else {
          throw new Error('Missing topicId for topic-based content');
        }
      }

      // Add assessmentId for assessment-based content (cats, assignments, pastExams)
      if (['cats', 'assignments', 'pastExams'].includes(content.type)) {
        if (content.assessmentId) {
          payload.assessmentId = content.assessmentId;
        } else {
          throw new Error('Missing assessmentId for assessment content');
        }
      }

      // Add debug logging
      console.log('Content object:', content);
      console.log('Delete payload:', payload);
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload:', decoded);
          console.log('User role:', decoded.role);
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }

      const response = await api.delete('/api/admin/content-status', { 
        data: { items: [payload] },
        validateStatus: status => status < 500 // Don't throw for 403
      });

      console.log('Delete response:', response.data);
      console.log('Failures:', response.data?.failures);
      
      // Log detailed failure information
      if (response.data?.failures && response.data.failures.length > 0) {
        response.data.failures.forEach((failure, index) => {
          console.error(`Failure ${index + 1}:`, {
            item: failure.item,
            message: failure.message
          });
        });
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to delete this content. Please ensure you are logged in as an admin or super admin.');
      } else if (response.status === 400 || response.status !== 200) {
        // Show detailed error from failures array if available
        const failureMessages = response.data?.failures?.map(f => f.message).join(', ') || response.data?.message;
        throw new Error(failureMessages || 'Failed to delete content');
      }

      // Update UI on success
      setContentStatus(prev => prev.filter(item => getItemKey(item) !== contentKey));
      setStats(prev => {
        const statusKey = (content.status || 'pending').toLowerCase();
        const updatedStatusCount = Math.max((prev[statusKey] || 0) - 1, 0);
        return {
          ...prev,
          [statusKey]: updatedStatusCount,
          total: Math.max(prev.total - 1, 0)
        };
      });
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (contentKey) {
          newSet.delete(contentKey);
        }
        return newSet;
      });
      setSelectedKeys(prev => {
        if (!contentKey) return prev;
        const next = new Map(prev);
        next.delete(contentKey);
        return next;
      });
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Content deleted successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error deleting content:', err);
      const errorMessage = err.message || 'Failed to delete content';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    const confirmDelete = window.confirm(`Delete ${selectedIds.size} selected item(s)? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    try {
      setBulkDeleting(true);
      setError(null);

      const selectedItems = Array.from(selectedKeys.values()).filter((item) => item.status === 'pending');

      // Format the payload as an array of items (not nested under 'items' key)
      const payload = selectedItems.map((item) => {
        const itemPayload = {
          courseId: item.courseId,
          unitId: item.unitId,
          contentType: item.type
        };

        // Add topicId for topic-based content (videos, notes)
        if (['video', 'notes', 'youtube_link'].includes(item.type)) {
          if (item.topicId) {
            itemPayload.topicId = item.topicId;
          }
        }

        // Add assessmentId for assessment-based content (cats, assignments, pastExams)
        if (['cats', 'assignments', 'pastExams'].includes(item.type)) {
          if (item.assessmentId) {
            itemPayload.assessmentId = item.assessmentId;
          }
        }

        return itemPayload;
      });

      // Add debug logging
      console.log('Bulk delete payload:', payload);
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);

      // Make the API call
      const response = await api.delete('/api/admin/content-status', { 
        data: { items: payload },
        validateStatus: status => status < 500 // Don't throw for 403
      });

      console.log('Bulk delete response:', response.data);
      console.log('Bulk delete failures:', response.data?.failures);

      // Handle different response statuses
      if (response.status === 403) {
        throw new Error('You do not have permission to delete content. Please ensure you have the necessary permissions.');
      } else if (response.status === 207) {
        // Partial success (some items failed)
        const { results = [] } = response.data || {};
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
          console.warn('Some items could not be deleted:', failed);
          setError(`Some items could not be deleted (${failed.length} of ${results.length} failed). Check the console for details.`);
        }
      } else if (response.status !== 200) {
        throw new Error(response.data?.message || 'Failed to delete content');
      }

      // Get the successful deletes from the response
      const successfulDeletes = response.data?.results?.filter(r => r.success) || [];
      const deletedIds = new Set(successfulDeletes.map(result => result.item.id));

      // Update UI to remove successfully deleted items
      if (deletedIds.size > 0) {
        setContentStatus(prev => prev.filter(item => !deletedIds.has(item.id)));
        
        // Update stats based on the status of deleted items
        setStats(prev => {
          const statusCounts = {};
          
          // Count statuses of deleted items
          selectedItems.forEach(item => {
            if (deletedIds.has(item.id) && item.status) {
              const status = item.status.toLowerCase();
              statusCounts[status] = (statusCounts[status] || 0) + 1;
            }
          });
          
          // Update the stats
          const updated = { ...prev };
          let totalRemoved = 0;

          selectedItems.forEach((item) => {
            const statusKey = (item.status || 'pending').toLowerCase();
            updated[statusKey] = Math.max((updated[statusKey] || 0) - 1, 0);
            totalRemoved += 1;
          });

          updated.total = Math.max(updated.total - totalRemoved, 0);
          return updated;
        });

        setSelectedIds(new Set());

        if (response.data?.failures?.length) {
          const failureMessages = response.data.failures.map((failure) => failure.message).join(', ');
          if (failureMessages) {
            setError(`Some items could not be deleted: ${failureMessages}`);
          }
        }
      }
    } catch (err) {
      console.error('Error in bulk delete:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
      });
      
      // More specific error messages based on status code
      let errorMessage = 'Failed to delete selected items. Please try again.';
      if (err.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        // Trigger logout
        try {
          const logoutEvent = new CustomEvent('auth:unauthorized');
          window.dispatchEvent(logoutEvent);
        } catch (e) {
          console.error('Error dispatching auth event:', e);
        }
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  // Add debugging for the component that's about to render
  console.log('Rendering ContentStatus with contentStatus:', contentStatus);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <ErrorBoundary componentName="ContentStatus">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Content Management
              <IconButton 
                onClick={fetchContentStatus} 
                size="small" 
                sx={{ ml: 1, verticalAlign: 'middle' }}
                disabled={loading}
              >
                <Refresh />
              </IconButton>
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                { label: 'Pending', value: stats.pending, icon: <PendingActions />, color: 'warning.main' },
                { label: 'Approved', value: stats.approved, icon: <CheckCircle />, color: 'success.main' },
                { label: 'Rejected', value: stats.rejected, icon: <Cancel />, color: 'error.main' },
                { label: 'Total', value: stats.total, icon: <VideoLibrary />, color: 'primary.main' },
              ].map((stat) => (
                <Grid item xs={12} sm={6} md={3} key={stat.label}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h6" color="text.secondary">
                            {stat.label}
                          </Typography>
                          <Typography variant="h4" component="div" sx={{ color: stat.color }}>
                            {stat.value}
                          </Typography>
                        </Box>
                        <Box sx={{ color: stat.color, fontSize: 40 }}>
                          {stat.icon}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Type Tabs */}
            <Paper sx={{ mb: 2 }}>
              <Tabs
                value={typeTab}
                onChange={(e, newValue) => setTypeTab(newValue)}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All Types" />
                <Tab label="Videos" />
                <Tab label="Notes" />
                <Tab label="CATs" />
                <Tab label="Exams" />
              </Tabs>
            </Paper>

            {/* Status Tabs */}
            <Paper sx={{ mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="All" />
                <Tab label="Pending" />
                <Tab label="Approved" />
                <Tab label="Rejected" />
              </Tabs>
            </Paper>

            {/* Bulk Actions */}
            {isBulkMode && (
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1">
                  {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
                </Typography>
                <div>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    startIcon={bulkDeleting ? <CircularProgress size={20} /> : <Delete />}
                    sx={{ ml: 1 }}
                  >
                    {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              </Box>
            )}

            {/* Content List */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : filteredContent.length === 0 ? (
              <Alert severity="info">No content found</Alert>
            ) : (
              <List>
                {filteredContent.map((content) => {
                  const contentKey = getItemKey(content);
                  return (
                  <ListItem
                    key={contentKey || content._id || content.id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        {isBulkMode && (
                          <CheckboxInput
                            checked={selectedIds.has(contentKey)}
                            onChange={() => toggleSelect(content)}
                            sx={{ mr: 1 }}
                          />
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteContent(content)}
                            disabled={deletingId === contentKey}
                          >
                            {deletingId === contentKey ? <CircularProgress size={24} /> : <Delete />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                    sx={{
                      mb: 1,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getContentIcon(content.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={content.title || 'Untitled'}
                      secondary={
                        <>
                          <Box component="span" sx={{ display: 'block' }}>
                            {content.description || 'No description'}
                          </Box>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              icon={getStatusIcon(content.status)}
                              label={content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                              size="small"
                              color={getStatusColor(content.status)}
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(content.updatedAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </motion.div>
      </ErrorBoundary>

        {/* Snackbar for notifications */}
        <ErrorBoundary componentName="Snackbar">
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </ErrorBoundary>
      </Container>
  );
};

export default ContentStatus;
