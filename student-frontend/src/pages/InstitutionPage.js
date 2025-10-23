import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  Paper,
  Divider,
  IconButton,
  useTheme,
  alpha,
  LinearProgress,
  Skeleton,
  Stack
} from '@mui/material';
import {
  School,
  LocationOn,
  CalendarToday,
  People,
  Star,
  BookmarkBorder,
  Share,
  Verified
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { slideFromLeft, slideFromRight, hoverLift } from '../utils/motionPresets';
import { fetchInstitutionById, fetchCourses } from '../utils/dataApi';

const InstitutionPage = () => {
  const [institution, setInstitution] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    fetchInstitutionData();
  }, [id]);

  const fetchInstitutionData = async () => {
    try {
      // Fetch single institution by ID
      const inst = await fetchInstitutionById(id);
      setInstitution(inst);

      // Fetch courses for this institution
      const courseList = await fetchCourses({ institution: id });
      setCourses(courseList);
    } catch (error) {
      console.error('Error fetching institution data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <LinearProgress color="primary" sx={{ position: 'sticky', top: 0, left: 0, zIndex: 10 }} />
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Stack spacing={4}>
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.25)' }}>
                    <School sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box sx={{ flexGrow: 1, width: '100%' }}>
                    <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                    <Skeleton variant="text" width="35%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                    <Skeleton variant="rectangular" width="100%" height={16} sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.18)' }} />
                  </Box>
                </Stack>
              </Paper>
            </motion.div>

            <Grid container spacing={3}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Grid item xs={12} md={6} key={`institution-skeleton-${index}`}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <Skeleton variant="text" width="50%" height={28} />
                    <Skeleton variant="text" width="70%" height={20} />
                    <Skeleton variant="rectangular" width="100%" height={120} sx={{ mt: 2, borderRadius: 2 }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (!institution) {
    return (
      <Container>
        <Typography variant="h4" align="center" color="error">
          Institution not found
        </Typography>
      </Container>
    );
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      mr: 3,
                      fontSize: '2rem',
                    }}
                  >
                    <School sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                      {institution.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        icon={<Verified />}
                        label={institution.shortName}
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontWeight: 600 
                        }}
                      />
                      <Chip 
                        label={institution.type.replace('_', ' ').toUpperCase()}
                        sx={{ 
                          bgcolor: theme.palette.secondary.main,
                          color: 'white',
                          fontWeight: 600 
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ fontSize: 20 }} />
                    <Typography variant="body1">
                      {institution.location.town}, {institution.location.county}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 20 }} />
                    <Typography variant="body1">
                      Est. {institution.establishedYear}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People sx={{ fontSize: 20 }} />
                    <Typography variant="body1">
                      {courses.length} Programs
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: theme.palette.secondary.main,
                      '&:hover': { bgcolor: theme.palette.secondary.dark },
                    }}
                  >
                    View Programs
                  </Button>
                  <IconButton sx={{ color: 'white' }}>
                    <BookmarkBorder />
                  </IconButton>
                  <IconButton sx={{ color: 'white' }}>
                    <Share />
                  </IconButton>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={8}
                  sx={{
                    p: 3,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                  }}
                >
                  <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                    Institution Highlights
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Rating</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ color: '#ffc107', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>4.8</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Students</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>15,000+</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Accreditation</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>CUE Certified</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>

        {/* Courses Section */}
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
          Available Courses
        </Typography>

        {courses.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No courses available for this institution yet.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {courses.map((course, index) => (
              <Grid item xs={12} md={6} key={course._id}>
                <motion.div
                  variants={index % 2 === 0 ? slideFromLeft : slideFromRight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  custom={index}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 3,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                    component={motion.div}
                    whileHover={hoverLift.whileHover}
                    transition={hoverLift.transition}
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {course.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Course Code: {course.code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Department: {course.department}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {course.duration?.years && (
                          <Chip 
                            label={`${course.duration.years} Years`} 
                            size="small" 
                            sx={{ mr: 1 }}
                          />
                        )}
                        {course.duration?.semesters && (
                          <Chip 
                            label={`${course.duration.semesters} Semesters`} 
                            size="small" 
                          />
                        )}
                      </Box>
                      <Button 
                        variant="contained" 
                        sx={{ mt: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/course/${course._id}`);
                        }}
                      >
                        View Course Details
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default InstitutionPage;
