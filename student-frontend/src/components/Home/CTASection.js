import React from 'react';
import { Box, Container, Card, Typography, Button, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const CTASection = ({ isAuthenticated, onPrimaryAction, onSecondaryAction }) => {
  const theme = useTheme();

  return (
    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Card
          sx={{
            p: { xs: 5, md: 7 },
            textAlign: 'center',
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
            color: 'white',
            borderRadius: 4,
            boxShadow: `0 30px 80px ${alpha(theme.palette.secondary.dark, 0.35)}`
          }}
        >
          <Stack spacing={3} alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Ready to elevate your semester?
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.85 }}>
              Join thousands of Kenyan students already using EduVault for lecture notes, CAT prep, and mentorship alerts.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={onPrimaryAction}
                sx={{
                  minWidth: 200,
                  bgcolor: 'white',
                  color: theme.palette.secondary.main,
                  '&:hover': { bgcolor: alpha('#ffffff', 0.9) }
                }}
              >
                {isAuthenticated ? 'Browse premium resources' : 'Create free account'}
              </Button>

              {!isAuthenticated && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={onSecondaryAction}
                  sx={{
                    minWidth: 200,
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: alpha('#ffffff', 0.08) }
                  }}
                >
                  Sign in to your campus portal
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
};

export default CTASection;
