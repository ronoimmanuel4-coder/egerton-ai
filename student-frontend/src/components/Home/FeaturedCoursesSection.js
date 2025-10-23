import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { PlayCircleOutline as PlayIcon, Article as ArticleIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { slideFromLeft, slideFromRight, hoverLift } from '../../utils/motionPresets';

const FeaturedCoursesSection = ({ courses = [], onExplore }) => {
  const theme = useTheme();

  if (!Array.isArray(courses) || courses.length === 0) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
      <Stack spacing={3} sx={{ textAlign: 'center', mb: 4 }}>
        <Chip label="Curated programmes" color="primary" variant="outlined" sx={{ mx: 'auto' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Explore featured courses with premium study packs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access lecture recordings, notes, CATs, and mentorship tailored for Kenyan institutions.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {courses.map((course, index) => (
          <Grid item xs={12} md={4} key={course.id || course.code || course.name}>
            <motion.div
              variants={index % 2 === 0 ? slideFromLeft : slideFromRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={index}
            >
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.4)}`
                }}
                component={motion.div}
                whileHover={hoverLift.whileHover}
                transition={hoverLift.transition}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                      {course.icon === 'article' ? <ArticleIcon /> : <PlayIcon />}
                    </Avatar>
                    <Box textAlign="left">
                      <Typography variant="subtitle2" color="text.secondary">
                        {course.institution || 'Institution'}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {course.name}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {course.description}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {course.tags?.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => onExplore?.(course)}
                  >
                    View course overview
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default FeaturedCoursesSection;
