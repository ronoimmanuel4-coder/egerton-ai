import React from 'react';
import { Box, Paper, Stack, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const UserManagement = () => {
  return (
    <Box sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: 720,
          mx: 'auto',
          p: { xs: 3, md: 6 },
          textAlign: 'center',
          borderRadius: 4,
          border: '1px dashed',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Stack spacing={2.5} alignItems="center">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            User management now lives in the Super Admin Suite
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This admin portal focuses on content and resource creation. Head to the super admin frontend to manage users.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Continue to the dashboard to publish materials, manage institutions, and track assessments.
          </Typography>
          <Button
            component={RouterLink}
            to="/admin/dashboard"
            variant="contained"
            size="large"
            sx={{ mt: 1 }}
          >
            Back to content tools
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default UserManagement;
