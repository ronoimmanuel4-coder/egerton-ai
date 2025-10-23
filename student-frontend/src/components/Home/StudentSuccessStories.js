import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { scrollReveal, hoverLift } from '../../utils/motionPresets';

const StudentSuccessStories = ({ stories = [] }) => {
  const theme = useTheme();

  if (!Array.isArray(stories) || stories.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: alpha(theme.palette.background.default, 0.7) }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Student success stories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hear how EduVault students across Kenya are achieving more with curated study packs and mentorship.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {stories.map((story, index) => (
            <Grid item xs={12} md={4} key={story.id || story.name}>
              <motion.div
                variants={scrollReveal.item}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.45 }}
                custom={index}
              >
                <Card
                  elevation={0}
                  sx={{ borderRadius: 3, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}
                  component={motion.div}
                  whileHover={hoverLift.whileHover}
                  transition={hoverLift.transition}
                >
                  <CardContent>
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={story.avatar} sx={{ width: 56, height: 56 }}>
                          {story.name?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {story.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {story.institution}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        “{story.quote}”
                      </Typography>

                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          Favourite resources
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {story.resources?.map((resource) => (
                            <Typography key={resource} variant="caption" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), px: 1.5, py: 0.5, borderRadius: 999 }}>
                              {resource}
                            </Typography>
                          ))}
                        </Stack>
                      </Stack>
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

export default StudentSuccessStories;
