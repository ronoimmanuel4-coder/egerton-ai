import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Bolt as BoltIcon,
  Close as CloseIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline,
  ClearAll,
  Delete as DeleteIcon,
  ContentCopy,
  DoneAll,
  Download as DownloadIcon,
  FilterAlt as FilterIcon,
  Mail as MailIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Star as StarIcon,
  SupervisorAccount as SuperAdminIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../utils/api';
import dayjs from 'dayjs';

const detailPanelVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } },
  exit: { opacity: 0, x: 40 }
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [institutionFilter, setInstitutionFilter] = useState('all');
  const [premiumFilter, setPremiumFilter] = useState('all');
  const [error, setError] = useState('');
  const [detailTab, setDetailTab] = useState(0);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 0 });

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const activePremiumUserIds = useMemo(() => {
    const activeSubs = subscriptions.filter((sub) => sub.isActive);
    return new Set(activeSubs.map((sub) => sub.userId));
  }, [subscriptions]);

  const normalizeInstitution = (institution) => {
    if (!institution) {
      return '';
    }

    if (typeof institution === 'string') {
      return institution.trim();
    }

    if (typeof institution === 'object') {
      const name = institution?.name ?? institution?.title ?? '';
      return String(name).trim();
    }

    return String(institution).trim();
  };

  const institutionOptions = useMemo(() => {
    const unique = new Set(
      users
        .map((user) => normalizeInstitution(user.institution))
        .filter((institution) => institution && institution.length > 0)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const institutionName = normalizeInstitution(user.institution);

      const matchesSearch =
        !lowerSearch ||
        user.firstName?.toLowerCase().includes(lowerSearch) ||
        user.lastName?.toLowerCase().includes(lowerSearch) ||
        user.email?.toLowerCase().includes(lowerSearch) ||
        institutionName.toLowerCase().includes(lowerSearch);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      const matchesInstitution =
        institutionFilter === 'all' || institutionName.toLowerCase() === institutionFilter.toLowerCase();

      const hasPremium = activePremiumUserIds.has(user._id);
      const matchesPremium =
        premiumFilter === 'all' ||
        (premiumFilter === 'premium' && hasPremium) ||
        (premiumFilter === 'basic' && !hasPremium);

      return matchesSearch && matchesRole && matchesStatus && matchesInstitution && matchesPremium;
    });
  }, [users, searchTerm, roleFilter, statusFilter, institutionFilter, premiumFilter, activePremiumUserIds]);

  const overallMetrics = useMemo(() => {
    const totals = users.reduce(
      (acc, user) => {
        acc.total += 1;
        if (user.isActive) acc.active += 1;
        else acc.inactive += 1;

        acc.roles[user.role] = (acc.roles[user.role] || 0) + 1;

        if (activePremiumUserIds.has(user._id)) acc.premium += 1;
        return acc;
      },
      { total: 0, active: 0, inactive: 0, premium: 0, roles: {} }
    );

    return {
      total: totals.total,
      active: totals.active,
      inactive: totals.inactive,
      premium: totals.premium,
      students: totals.roles.student || 0,
      miniAdmins: totals.roles.mini_admin || 0,
      superAdmins: totals.roles.super_admin || 0
    };
  }, [users, activePremiumUserIds]);

  const filteredMetrics = useMemo(() => {
    const totals = filteredUsers.reduce(
      (acc, user) => {
        acc.total += 1;
        if (user.isActive) acc.active += 1;
        else acc.inactive += 1;

        if (activePremiumUserIds.has(user._id)) acc.premium += 1;
        return acc;
      },
      { total: 0, active: 0, inactive: 0, premium: 0 }
    );

    return totals;
  }, [filteredUsers, activePremiumUserIds]);

  useEffect(() => {
    fetchUsers();
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (filteredUsers.length === 0) {
      setSelectedUserId(null);
      return;
    }

    const selectedStillVisible = filteredUsers.some((user) => user._id === selectedUserId);

    if (!selectedUserId || !selectedStillVisible) {
      setSelectedUserId(filteredUsers[0]._id);
    }
  }, [loading, filteredUsers, selectedUserId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const aggregatedUsers = [];
      const baseParams = {
        limit: 500,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: searchTerm || undefined
      };

      let currentPage = 1;
      let totalPages = 1;
      let lastPagination = null;

      do {
        const response = await api.get('/api/admin/users', {
          params: {
            ...baseParams,
            page: currentPage
          }
        });

        const fetchedUsers = response.data.users || [];
        aggregatedUsers.push(...fetchedUsers);

        if (response.data.pagination) {
          lastPagination = response.data.pagination;
          totalPages = response.data.pagination.pages || 1;
        } else {
          totalPages = currentPage;
        }

        if (fetchedUsers.length === 0) {
          break;
        }

        currentPage += 1;
      } while (currentPage <= totalPages);

      setUsers(aggregatedUsers);

      if (lastPagination) {
        setPagination({
          ...lastPagination,
          current: 1,
          pages: totalPages
        });
      } else {
        setPagination({ current: 1, pages: 1, total: aggregatedUsers.length, limit: aggregatedUsers.length });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users from database');
      // Use mock data as fallback
      setUsers([
        {
          _id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@student.com',
          password: '$2a$10$hashedPassword123',
          role: 'student',
          isActive: true,
          institution: 'University of Nairobi',
          createdAt: '2024-01-15T10:30:00Z',
          lastLogin: '2024-09-24T08:15:00Z'
        },
        {
          _id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@admin.com',
          password: '$2a$10$hashedPassword456',
          role: 'mini_admin',
          isActive: true,
          institution: 'KMTC Nairobi',
          createdAt: '2024-02-10T14:20:00Z',
          lastLogin: '2024-09-23T16:45:00Z'
        },
        {
          _id: '3',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@student.com',
          password: '$2a$10$hashedPassword789',
          role: 'student',
          isActive: false,
          institution: 'Kenyatta University',
          createdAt: '2024-03-05T09:10:00Z',
          lastLogin: '2024-09-20T12:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/api/admin/subscriptions');
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      // Mock subscription data
      setSubscriptions([
        {
          _id: 'sub1',
          userId: '1',
          courseId: 'course1',
          courseName: 'Computer Science',
          amount: 100,
          currency: 'KSH',
          status: 'completed',
          isActive: true,
          startDate: '2024-09-01T00:00:00Z',
          expiryDate: '2024-10-01T00:00:00Z',
          mpesaTransactionId: 'ws_CO_24092024123456',
          mpesaReceiptNumber: 'QGH7X8Y9Z0',
          paymentDate: '2024-09-01T10:15:30Z'
        }
      ]);
    }
  };

  const triggerSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleRoleChange = useCallback(async (userId, newRole) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
      triggerSnackbar(`User role updated to ${newRole}`, 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      triggerSnackbar('Failed to update user role', 'error');
    }
  }, []);

  const handleStatusToggle = useCallback(async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/api/admin/users/${userId}/status`, { isActive: newStatus });
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isActive: newStatus } : user
        )
      );
      triggerSnackbar(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      triggerSnackbar('Failed to update user status', 'error');
    }
  }, []);

  const handleResetPassword = useCallback(async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      triggerSnackbar('Password must be at least 6 characters long', 'warning');
      return;
    }
    
    try {
      await api.put(`/api/admin/users/${selectedUser._id}/password`, { newPassword });
      setUsers((prev) =>
        prev.map((user) =>
          user._id === selectedUser._id ? { ...user, password: `$2a$10$${newPassword}Hashed` } : user
        )
      );
      triggerSnackbar(`Password reset for ${selectedUser.firstName} ${selectedUser.lastName}`, 'success');
      setResetPasswordDialog(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      triggerSnackbar('Failed to reset password', 'error');
    }
  }, [newPassword, selectedUser]);

  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/api/admin/users/${userToDelete._id}`);
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete._id));
      triggerSnackbar(`Deleted ${userToDelete.firstName} ${userToDelete.lastName}`, 'success');
      setDeleteConfirmDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      triggerSnackbar('Failed to delete user', 'error');
    }
  }, [userToDelete]);

  const handleGrantPremium = useCallback(async (userId) => {
    try {
      await api.post('/api/admin/grant-premium', { userId, courseId: 'default' });
      triggerSnackbar(`Premium access granted`, 'success');
      fetchSubscriptions(); // Refresh subscriptions
    } catch (error) {
      console.error('Error granting premium:', error);
      triggerSnackbar('Failed to grant premium access', 'error');
    }
  }, []);

  const togglePasswordVisibility = (userId) => {
    setPasswordVisible(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleRefreshData = useCallback(() => {
    fetchUsers();
    fetchSubscriptions();
  }, []);

  const handleBulkStatusUpdate = useCallback(async (shouldActivate) => {
    try {
      await Promise.all(
        selectedUserIds.map((userId) =>
          api.put(`/api/admin/users/${userId}/status`, { isActive: shouldActivate })
        )
      );
      setUsers((prev) =>
        prev.map((user) =>
          selectedUserIds.includes(user._id)
            ? { ...user, isActive: shouldActivate }
            : user
        )
      );
      triggerSnackbar(`Selected users ${shouldActivate ? 'activated' : 'deactivated'} successfully`, 'success');
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Bulk status update failed:', error);
      triggerSnackbar('Failed to update status for selected users', 'error');
    }
  }, [selectedUserIds]);

  const handleBulkPremiumGrant = useCallback(async () => {
    try {
      await Promise.all(
        selectedUserIds.map((userId) =>
          api.post('/api/admin/grant-premium', { userId, courseId: 'default' })
        )
      );
      triggerSnackbar('Premium access granted to selected users', 'success');
      fetchSubscriptions();
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Bulk premium grant failed:', error);
      triggerSnackbar('Failed to grant premium access to selected users', 'error');
    }
  }, [selectedUserIds]);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return <SuperAdminIcon color="error" />;
      case 'mini_admin': return <AdminIcon color="warning" />;
      default: return <PersonIcon color="primary" />;
    }
  };

  const getUserSubscriptions = (userId) => {
    return subscriptions.filter(sub => sub.userId === userId);
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setDetailTab(0);
  };

  const handleToggleSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCopyEmails = useCallback(async () => {
    if (selectedUserIds.length === 0) {
      triggerSnackbar('Select at least one user to copy emails', 'info');
      return;
    }

    const emails = users
      .filter((user) => selectedUserIds.includes(user._id))
      .map((user) => user.email)
      .filter(Boolean)
      .join(', ');

    if (!emails) {
      triggerSnackbar('Selected users do not have emails to copy', 'warning');
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(emails);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = emails;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      triggerSnackbar('Emails copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy emails', error);
      triggerSnackbar('Unable to copy emails. Please try again.', 'error');
    }
  }, [selectedUserIds, users]);

  const handleExportSelected = useCallback(() => {
    if (selectedUserIds.length === 0) {
      triggerSnackbar('Select at least one user to export', 'info');
      return;
    }

    const headers = ['Full Name', 'Email', 'Role', 'Institution', 'Status', 'Premium', 'Created At', 'Last Login'];
    const rows = users
      .filter((user) => selectedUserIds.includes(user._id))
      .map((user) => {
        const hasPremium = activePremiumUserIds.has(user._id);
        return [
          `${(user.firstName || '').trim()} ${(user.lastName || '').trim()}`.trim(),
          user.email || '',
          user.role,
          normalizeInstitution(user.institution),
          user.isActive ? 'Active' : 'Inactive',
          hasPremium ? 'Premium' : 'Basic',
          user.createdAt ? new Date(user.createdAt).toISOString() : '',
          user.lastLogin ? new Date(user.lastLogin).toISOString() : ''
        ];
      });

    const csvContent = [headers, ...rows].map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eduvault-users-${dayjs().format('YYYYMMDD-HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerSnackbar(`Exported ${rows.length} user(s) to CSV`, 'success');
  }, [selectedUserIds, users, activePremiumUserIds]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setInstitutionFilter('all');
    setPremiumFilter('all');
  }, []);

  const selectedUserSubscriptions = useMemo(() => {
    if (!selectedUser) {
      return [];
    }
    return getUserSubscriptions(selectedUser._id);
  }, [selectedUser, subscriptions]);

  const selectedUserActiveSubscriptions = useMemo(
    () => selectedUserSubscriptions.filter((sub) => sub.isActive),
    [selectedUserSubscriptions]
  );

  const selectedUserHasPremium = selectedUser ? activePremiumUserIds.has(selectedUser._id) : false;

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <Skeleton variant="text" width={220} height={36} />
            <Skeleton variant="rectangular" height={48} />
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Grid item xs={12} md={6} lg={4} key={idx}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Skeleton variant="circular" width={48} height={48} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width="80%" />
                          <Skeleton variant="text" width="60%" />
                        </Box>
                      </Stack>
                      <Skeleton variant="rectangular" height={20} />
                      <Skeleton variant="rectangular" height={18} width="60%" />
                      <Skeleton variant="rectangular" height={32} />
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
      <CardContent sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', lg: 'center' }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'primary.main'
                }}
              >
                <PeopleIcon color="primary" sx={{ fontSize: 36 }} />
                Super Admin · User Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Monitor growth, analyze adoption, and take action on any account in seconds.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters((prev) => !prev)}
              >
                {showFilters ? 'Hide filters' : 'Show filters'}
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshData}
              >
                Refresh data
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Total users
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {overallMetrics.total}
                    </Typography>
                    <Chip
                      icon={<AssessmentIcon fontSize="small" />}
                      label={`${filteredMetrics.total} filtered`}
                      size="small"
                      color="primary"
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {overallMetrics.superAdmins} super • {overallMetrics.miniAdmins} mini admin • {overallMetrics.students} students
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Active accounts
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {overallMetrics.active}
                    </Typography>
                    <Chip
                      icon={<DoneAll fontSize="small" />}
                      label={`${filteredMetrics.active} filtered`}
                      size="small"
                      color="success"
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {overallMetrics.inactive} inactive overall
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Premium adoption
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {overallMetrics.premium}
                    </Typography>
                    <Chip
                      icon={<StarIcon fontSize="small" />}
                      label={`${filteredMetrics.premium} filtered`}
                      size="small"
                      color="warning"
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {overallMetrics.total - overallMetrics.premium} basic tier accounts
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Current selection
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {selectedUserIds.length}
                    </Typography>
                    <Chip
                      icon={<DownloadIcon fontSize="small" />}
                      label="Export / Copy"
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Use the bulk toolbar to take action
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Collapse in={showFilters}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, backgroundColor: 'background.paper' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} lg={3}>
                  <TextField
                    fullWidth
                    placeholder="Search name, email, institution"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={roleFilter}
                      label="Role"
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <MenuItem value="all">All roles</MenuItem>
                      <MenuItem value="super_admin">Super admins</MenuItem>
                      <MenuItem value="mini_admin">Mini admins</MenuItem>
                      <MenuItem value="student">Students</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All statuses</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel>Institution</InputLabel>
                    <Select
                      value={institutionFilter}
                      label="Institution"
                      onChange={(e) => setInstitutionFilter(e.target.value)}
                    >
                      <MenuItem value="all">All institutions</MenuItem>
                      {institutionOptions.map((institution) => (
                        <MenuItem key={institution} value={institution.toLowerCase()}>
                          {institution}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel>Plan</InputLabel>
                    <Select
                      value={premiumFilter}
                      label="Plan"
                      onChange={(e) => setPremiumFilter(e.target.value)}
                    >
                      <MenuItem value="all">All plans</MenuItem>
                      <MenuItem value="premium">Premium only</MenuItem>
                      <MenuItem value="basic">Basic only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button variant="outlined" startIcon={<ClearAll />} onClick={handleClearFilters}>
                      Reset filters
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Showing {filteredUsers.length} results
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Collapse>

          {selectedUserIds.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                p: { xs: 2, md: 3 },
                border: '1px solid',
                borderColor: 'primary.light',
                background: 'linear-gradient(135deg, rgba(25,118,210,0.08) 0%, rgba(25,118,210,0.02) 100%)'
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', md: 'center' }}
                justifyContent="space-between"
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedUserIds.length} user(s) selected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Run quick actions or export the current selection.
                  </Typography>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<BoltIcon />}
                    onClick={() => handleBulkStatusUpdate(true)}
                  >
                    Activate
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<CloseIcon />}
                    onClick={() => handleBulkStatusUpdate(false)}
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<CheckCircleOutline />}
                    onClick={handleBulkPremiumGrant}
                  >
                    Grant premium
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<ContentCopy />}
                    onClick={handleCopyEmails}
                  >
                    Copy emails
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportSelected}
                  >
                    Export CSV
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}

          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} lg={7}>
              {filteredUsers.length === 0 ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 5,
                    borderRadius: 4,
                    textAlign: 'center',
                    borderStyle: 'dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    No users found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Adjust your filters or clear the search to see more results.
                  </Typography>
                  <Button variant="outlined" onClick={handleClearFilters}>
                    Reset filters
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user) => {
                      const userSubs = getUserSubscriptions(user._id);
                      const activeSubs = userSubs.filter((sub) => sub.isActive);
                      const isSelected = selectedUserId === user._id;
                      const isChecked = selectedUserIds.includes(user._id);

                      return (
                        <Grid item xs={12} sm={6} key={user._id}>
                          <motion.div
                            layout
                            variants={cardVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            whileHover={{ y: -4, boxShadow: '0px 12px 32px rgba(15, 23, 42, 0.08)' }}
                            transition={{ duration: 0.2 }}
                          >
                            <Paper
                              onClick={() => handleSelectUser(user._id)}
                              elevation={0}
                              sx={{
                                p: 2.5,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                backgroundColor: isSelected ? 'rgba(25,118,210,0.08)' : 'background.paper',
                                transition: 'border-color 0.3s ease, background-color 0.3s ease'
                              }}
                            >
                              <Stack spacing={2}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Checkbox
                                    checked={isChecked}
                                    onChange={() => handleToggleSelection(user._id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                      {user.firstName} {user.lastName}
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <MailIcon fontSize="small" color="action" />
                                      <Typography variant="caption" color="text.secondary">
                                        {user.email}
                                      </Typography>
                                    </Stack>
                                  </Box>
                                  <Stack direction="row" spacing={1}>
                                    <Tooltip title="Grant premium access">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleGrantPremium(user._id);
                                        }}
                                      >
                                        <CheckCircleIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reset password">
                                      <IconButton
                                        size="small"
                                        color="warning"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedUserId(user._id);
                                          setResetPasswordDialog(true);
                                        }}
                                      >
                                        <VpnKeyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete user">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setUserToDelete(user);
                                          setDeleteConfirmDialog(true);
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </Stack>

                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  <Chip label={user.role.replace('_', ' ')} size="small" variant="outlined" color="primary" />
                                  <Chip label={normalizeInstitution(user.institution) || 'No institution'} size="small" />
                                  <Chip
                                    label={user.isActive ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={user.isActive ? 'success' : 'default'}
                                  />
                                  <Chip
                                    icon={<PaymentIcon fontSize="small" />}
                                    label={activePremiumUserIds.has(user._id) ? 'Premium' : 'Basic'}
                                    size="small"
                                    color={activePremiumUserIds.has(user._id) ? 'warning' : 'default'}
                                  />
                                </Stack>

                                <Divider />

                                <Stack spacing={0.5}>
                                  <Typography variant="caption" color="text.secondary">
                                    Active subscriptions: {activeSubs.length} / {userSubs.length}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Paper>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </AnimatePresence>
                </Grid>
              )}
            </Grid>

            <Grid item xs={12} lg={5}>
              <AnimatePresence mode="wait">
                {selectedUser ? (
                  <motion.div
                    key={selectedUser._id}
                    variants={detailPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 2.5, md: 3 },
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <Stack spacing={3}>
                        {!!error && (
                          <Alert severity="error" onClose={() => setError('')}>
                            {error}
                          </Alert>
                        )}

                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                            {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {selectedUser.firstName} {selectedUser.lastName}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <MailIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {selectedUser.email}
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title={selectedUser.isActive ? 'Deactivate user' : 'Activate user'}>
                              <IconButton
                                color={selectedUser.isActive ? 'success' : 'default'}
                                onClick={() => handleStatusToggle(selectedUser._id, selectedUser.isActive)}
                              >
                                {selectedUser.isActive ? <BoltIcon /> : <CloseIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Grant premium access">
                              <IconButton color="warning" onClick={() => handleGrantPremium(selectedUser._id)}>
                                <StarIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip label={selectedUser.role.replace('_', ' ')} color="primary" variant="outlined" />
                          <Chip label={normalizeInstitution(selectedUser.institution) || 'No institution'} />
                          <Chip
                            label={selectedUser.isActive ? 'Active' : 'Inactive'}
                            color={selectedUser.isActive ? 'success' : 'default'}
                          />
                          <Chip
                            icon={<PaymentIcon />}
                            label={selectedUserHasPremium ? 'Premium' : 'Basic'}
                            color={selectedUserHasPremium ? 'warning' : 'default'}
                          />
                          <Chip
                            icon={<AssessmentIcon fontSize="small" />}
                            label={`${selectedUserActiveSubscriptions.length} active subs`}
                          />
                        </Stack>

                        <Tabs value={detailTab} onChange={(e, v) => setDetailTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                          <Tab icon={<PersonIcon />} label="Profile" iconPosition="start" />
                          <Tab icon={<PaymentIcon />} label="Subscriptions" iconPosition="start" />
                        </Tabs>

                        {detailTab === 0 && (
                          <Stack spacing={2}>
                            <TextField label="First name" value={selectedUser.firstName} InputProps={{ readOnly: true }} />
                            <TextField label="Last name" value={selectedUser.lastName} InputProps={{ readOnly: true }} />
                            <TextField label="Email" value={selectedUser.email} InputProps={{ readOnly: true }} />
                            <TextField label="Institution" value={normalizeInstitution(selectedUser.institution) || '—'} InputProps={{ readOnly: true }} />
                            <TextField label="Role" value={selectedUser.role} InputProps={{ readOnly: true }} />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={selectedUser.isActive}
                                  onChange={() => handleStatusToggle(selectedUser._id, selectedUser.isActive)}
                                />
                              }
                              label={selectedUser.isActive ? 'Account active' : 'Account inactive'}
                            />
                            <TextField
                              label="Password"
                              type={passwordVisible[selectedUser._id] ? 'text' : 'password'}
                              value={selectedUser.password}
                              InputProps={{
                                readOnly: true,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => togglePasswordVisibility(selectedUser._id)}>
                                      {passwordVisible[selectedUser._id] ? <VisibilityOffIcon /> : <ViewIcon />}
                                    </IconButton>
                                  </InputAdornment>
                                )
                              }}
                            />
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="contained"
                                startIcon={<VpnKeyIcon />}
                                onClick={() => setResetPasswordDialog(true)}
                              >
                                Reset password
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => {
                                  if (selectedUser) {
                                    setUserToDelete(selectedUser);
                                  }
                                  setDeleteConfirmDialog(true);
                                }}
                              >
                                Delete user
                              </Button>
                            </Stack>
                          </Stack>
                        )}

                        {detailTab === 1 && (
                          <Stack spacing={2}>
                            {selectedUserSubscriptions.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No subscriptions found for this user.
                              </Typography>
                            ) : (
                              selectedUserSubscriptions.map((sub) => (
                                <Paper key={sub._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                  <Stack spacing={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                      {sub.courseName || 'Unnamed course'}
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <PaymentIcon fontSize="small" color="action" />
                                      <Typography variant="body2">
                                        {sub.amount} {sub.currency} • {sub.status}
                                      </Typography>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary">
                                      Start: {sub.startDate ? dayjs(sub.startDate).format('DD MMM YYYY') : '—'} • Expiry: {sub.expiryDate ? dayjs(sub.expiryDate).format('DD MMM YYYY') : '—'}
                                    </Typography>
                                  </Stack>
                                </Paper>
                              ))
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-selection"
                    variants={detailPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 4,
                        borderRadius: 3,
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <PeopleIcon color="primary" sx={{ fontSize: 48 }} />
                        <Typography variant="h6">Select a user to view details</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Click on a user card to open their profile, manage access, and review subscriptions.
                        </Typography>
                      </Stack>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>
            </Grid>
          </Grid>

          <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Reset password</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ py: 1 }}>
                <TextField
                  type="password"
                  label="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                <Typography variant="caption" color="text.secondary">
                  Password must be at least 6 characters long.
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setResetPasswordDialog(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleResetPassword}>
                Reset password
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Delete user</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDeleteUser}>
                Delete user
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={snackbar.severity} onClose={handleCloseSnackbar} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
