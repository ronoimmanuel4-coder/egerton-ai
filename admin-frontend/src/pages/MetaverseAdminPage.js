import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import MetaverseAdminPanel from '../components/Metaverse/MetaverseAdminPanel';
import { useNavigate } from 'react-router-dom';

const MetaverseAdminPage = () => {
  const { currentUser, loading, isAdmin } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!loading) {
        if (!currentUser) {
          navigate('/login', { state: { from: '/metaverse/admin' } });
          return;
        }
        
        if (!isAdmin) {
          navigate('/unauthorized');
          return;
        }
        
        setIsAuthorized(true);
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [currentUser, loading, isAdmin, navigate]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthorized) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You do not have permission to access this page.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Metaverse Administration
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Manage connected users, server settings, and moderation
        </Typography>
      </Box>
      
      <MetaverseAdminPanel token={currentUser.token} />
    </Container>
  );
};

export default MetaverseAdminPage;
