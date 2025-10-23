import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { profileReveal, hoverLift } from '../utils/motionPresets';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const calculateTimeLeft = (endDate) => {
  if (!endDate) return null;

  const difference = endDate.getTime() - Date.now();

  if (difference <= 0) {
    return null;
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return { days, hours, minutes, seconds };
};

const formatTimeLeft = (timeLeft) => {
  if (!timeLeft) return '';

  const pad = (value) => value.toString().padStart(2, '0');
  return `${timeLeft.days}d ${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m ${pad(timeLeft.seconds)}s`;
};

const ProfilePage = () => {
  const { user, updateProfile, changePassword, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');

  const subscriptionEndDate = useMemo(() => {
    if (!user?.subscription?.endDate) return null;
    const parsedDate = new Date(user.subscription.endDate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }, [user?.subscription?.endDate]);

  const subscriptionIsActive = useMemo(() => {
    if (typeof hasActiveSubscription === 'function') {
      return hasActiveSubscription();
    }
    return Boolean(user?.subscription?.isActive);
  }, [hasActiveSubscription, user?.subscription?.isActive]);

  const isSubscriptionActive = Boolean(subscriptionIsActive && subscriptionEndDate);
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(subscriptionEndDate));

  useEffect(() => {
    if (!isSubscriptionActive || !subscriptionEndDate) {
      setTimeLeft(null);
      return;
    }

    const updateTime = () => {
      setTimeLeft(calculateTimeLeft(subscriptionEndDate));
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [isSubscriptionActive, subscriptionEndDate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setEditing(false);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Error updating profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully!');
    } catch (error) {
      setMessage('Error changing password');
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (!user) {
    return (
      <Container>
        <Typography variant="h4" align="center">
          Please log in to view your profile
        </Typography>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4 }}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
    >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}
        >
          <Button
            variant="text"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            component={motion.button}
            whileHover={hoverLift.whileHover}
            transition={hoverLift.transition}
            sx={{ fontWeight: 600 }}
          >
            Back
          </Button>
        </Box>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          My Profile
        </Typography>

        {message && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          >
            {message}
          </Alert>
        )}

        <Grid
          container
          spacing={3}
          component={motion.div}
          variants={profileReveal.container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Profile Info Card */}
          <Grid item xs={12} component={motion.div} variants={profileReveal.item}>
            <Card
              component={motion.div}
              whileHover={hoverLift.whileHover}
              transition={hoverLift.transition}
              sx={{ borderRadius: { xs: 3, md: 4 }, overflow: 'hidden' }}
            >
              <CardContent sx={{ p: 0 }}>
                <Box
                  sx={{
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'common.white',
                    p: { xs: 3, md: 4 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'center', sm: 'center' },
                    gap: { xs: 2.5, sm: 3 },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 88,
                      height: 88,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'common.white',
                      fontSize: '2rem'
                    }}
                  >
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      {user.email}
                    </Typography>
                    <Chip
                      label={user.role?.replace('_', ' ').toUpperCase()}
                      color="secondary"
                      size="small"
                      sx={{ mt: 1, fontWeight: 600 }}
                    />
                  </Box>
                  {isSubscriptionActive && timeLeft ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Subscription ends in
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {formatTimeLeft(timeLeft)}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>

                <Box
                  sx={{
                    p: { xs: 3, md: 4 },
                    backgroundColor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  {!editing ? (
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                        Profile Information
                      </Typography>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            First Name
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {user.firstName || 'Not provided'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Last Name
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {user.lastName || 'Not provided'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                            {user.email}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Phone
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {user.phone || 'Not provided'}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Button
                        variant="outlined"
                        sx={{ mt: 3, width: { xs: '100%', sm: 'auto' } }}
                        onClick={() => setEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    </Box>
                  ) : (
                    <Box component="form" onSubmit={handleProfileUpdate}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                        Edit Profile Information
                      </Typography>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Button type="submit" variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setEditing(false)}
                          sx={{ width: { xs: '100%', sm: 'auto' } }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Change Password Card */}
          <Grid item xs={12} component={motion.div} variants={profileReveal.item}>
            <Card
              component={motion.div}
              whileHover={hoverLift.whileHover}
              transition={hoverLift.transition}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Box component="form" onSubmit={handlePasswordChange}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                    </Grid>
                  </Grid>
                  <Button type="submit" variant="contained" sx={{ mt: 3 }}>
                    Change Password
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Subscription Info */}
          <Grid item xs={12} component={motion.div} variants={profileReveal.item}>
            <Card
              component={motion.div}
              whileHover={hoverLift.whileHover}
              transition={hoverLift.transition}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Subscription Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={user.hasActiveSubscription ? "Premium Active" : "Free Plan"} 
                    color={user.hasActiveSubscription ? "success" : "default"}
                    sx={{ mr: 2 }}
                  />
                </Box>
                {subscriptionEndDate && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Subscription ends on: {subscriptionEndDate.toLocaleString()}
                    </Typography>
                    {isSubscriptionActive && timeLeft ? (
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                        Time remaining: {formatTimeLeft(timeLeft)}
                      </Typography>
                    ) : (
                      <Typography variant="body1" sx={{ mt: 1 }} color="error">
                        Subscription expired
                      </Typography>
                    )}
                  </Box>
                )}
                {!user.hasActiveSubscription && (
                  <Button variant="contained" color="warning">
                    Subscribe for KSH 100 / month (per course)
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </Container>
  );
};

export default ProfilePage;
