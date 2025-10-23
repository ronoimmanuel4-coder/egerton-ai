import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Close,
  Phone,
  Shield,
  VerifiedUser
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';

dayjs.extend(relativeTime);

const infoRow = (label, value) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 140 }}>
      {label}:
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {value || '—'}
    </Typography>
  </Stack>
);

const subscriptionStatusChip = (subscription) => {
  if (!subscription) return null;
  return (
    <Chip
      label={subscription.isActive ? 'Active' : 'Expired'}
      color={subscription.isActive ? 'success' : 'default'}
      size="small"
    />
  );
};

const roleChip = (role) => {
  const mapping = {
    student: { label: 'Student', color: 'default' },
    mini_admin: { label: 'Mini Admin', color: 'primary' },
    super_admin: { label: 'Super Admin', color: 'secondary' }
  };
  const chip = mapping[role] || mapping.student;
  return <Chip label={chip.label} color={chip.color} size="small" icon={<Shield fontSize="small" />} />;
};

const formatDateTime = (value) => (value ? dayjs(value).format('MMM D, YYYY • h:mm A') : '—');

const formatRelative = (value) => (value ? dayjs(value).fromNow() : 'Never');

const UserDetailPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/admin/users/${userId}`);
        setData(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to load user detail:', err);
        setError(err.response?.data?.message || 'Unable to load user detail.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const auditEntries = useMemo(() => {
    if (!data?.auditHistory) return [];
    return data.auditHistory.slice(0, 25);
  }, [data]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto', mt: 4, px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  const user = data?.user;
  if (!user) {
    return (
      <Box sx={{ maxWidth: 960, mx: 'auto', mt: 4, px: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          User details were not returned by the server.
        </Alert>
        <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} color="primary">
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          User Profile
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', width: 72, height: 72, fontSize: '2rem' }}>
                    {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      {roleChip(user.role)}
                      <Chip
                        icon={user.isActive ? <CheckCircle /> : <Close />}
                        label={user.isActive ? 'Active Account' : 'Deactivated'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Stack>
                  </Box>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  {infoRow('Phone', user.phoneNumber ? `+${user.phoneNumber}` : 'Not provided')}
                  {infoRow('Institution', user.institution?.name)}
                  {infoRow('Course', user.course?.name)}
                  {infoRow('Course code', user.course?.code)}
                  {infoRow('Year of study', user.yearOfStudy)}
                  {infoRow('Created on', formatDateTime(user.createdAt))}
                  {infoRow('Last updated', formatDateTime(user.updatedAt))}
                  {infoRow('Last login', `${formatRelative(user.lastLogin)} (${formatDateTime(user.lastLogin)})`)}
                </Stack>

                {user.subscription && (
                  <Alert severity={user.subscription.isActive ? 'success' : 'info'} icon={<VerifiedUser />}>
                    Subscription: {user.subscription.isActive ? 'Active' : 'Inactive'}
                    {user.subscription.endDate && (
                      <>
                        {' • expires '}
                        {dayjs(user.subscription.endDate).fromNow()}
                      </>
                    )}
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Alert severity="info" icon={<Phone fontSize="inherit" />} sx={{ mb: 2 }}>
                Only super admins can modify user accounts. Use the secure CLI or future UI update tools for changes.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Coming soon: direct actions (role changes, status toggles, password reset) will surface here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Subscription History
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Showing {data?.subscriptions?.length || 0} record(s)
                </Typography>
              </Stack>

              {!data?.subscriptions || data.subscriptions.length === 0 ? (
                <Alert severity="info">No subscriptions found for this user.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment Date</TableCell>
                      <TableCell>Expires</TableCell>
                      <TableCell>Transaction</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.subscriptions.map((subscription) => (
                      <TableRow key={subscription._id}>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {subscription.course?.name || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {subscription.course?.code || '—'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {subscriptionStatusChip(subscription)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {subscription.amount ? `${subscription.amount} ${subscription.currency || 'KSH'}` : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDateTime(subscription.paymentDate)}</TableCell>
                        <TableCell>{formatDateTime(subscription.expiryDate)}</TableCell>
                        <TableCell>{subscription.mpesaTransactionId || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Downloads
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest {data?.downloads?.length || 0}
                </Typography>
              </Stack>

              {!data?.downloads || data.downloads.length === 0 ? (
                <Alert severity="info">No downloads recorded for this user.</Alert>
              ) : (
                <Stack spacing={2}>
                  {data.downloads.map((download) => (
                    <Box key={download._id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {download.resourceTitle || download.filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {download.courseName || 'Unknown course'} • {download.unitName || 'Unknown unit'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Downloaded {formatRelative(download.downloadedAt)} ({formatDateTime(download.downloadedAt)})
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Audit Timeline
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Showing {auditEntries.length} event(s)
                </Typography>
              </Stack>

              {auditEntries.length === 0 ? (
                <Alert severity="info">No audit events recorded yet.</Alert>
              ) : (
                <Stack spacing={2}>
                  {auditEntries.map((entry, index) => (
                    <Box key={`${entry.type}-${index}`} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {entry.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(entry.timestamp)}
                      </Typography>
                      {entry.details && (
                        <pre
                          style={{
                            margin: 0,
                            marginTop: 8,
                            fontSize: '0.75rem',
                            background: '#fafafa',
                            padding: 8,
                            borderRadius: 6,
                            overflowX: 'auto'
                          }}
                        >
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetailPage;
