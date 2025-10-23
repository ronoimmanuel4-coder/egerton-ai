import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { scrollReveal, hoverLift } from '../../utils/motionPresets';

const HowItWorksSection = ({ steps = [] }) => {
  const theme = useTheme();

  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            How EduVault keeps you ahead
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Move from enrolment to exam success with guided workflows for Kenyan institutions.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={step.id || index}>
              <motion.div
                variants={scrollReveal.item}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.45 }}
                custom={index}
              >
                <Card
                  elevation={1}
                  sx={{ borderRadius: 3, height: '100%' }}
                  component={motion.div}
                  whileHover={hoverLift.whileHover}
                  transition={hoverLift.transition}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.secondary.main, 0.12),
                          color: theme.palette.secondary.main,
                          width: 48,
                          height: 48,
                          fontWeight: 600
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HowItWorksSection;
