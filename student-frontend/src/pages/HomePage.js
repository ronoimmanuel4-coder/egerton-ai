import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Box, Container, LinearProgress, Skeleton, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  VideoLibrary as VideoLibraryIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import HeroSection from '../components/Home/HeroSection';
import StatsSection from '../components/Home/StatsSection';
import FeaturedCoursesSection from '../components/Home/FeaturedCoursesSection';
import HowItWorksSection from '../components/Home/HowItWorksSection';
import StudentSuccessStories from '../components/Home/StudentSuccessStories';
import CTASection from '../components/Home/CTASection';
import { motion } from 'framer-motion';
import { fetchSuccessStories } from '../utils/dataApi';

const BASE_STATS = [
  {
    id: 'students',
    value: '48k+',
    label: 'Active Kenyan students',
    icon: <PeopleIcon />
  },
  {
    id: 'programmes',
    value: '120+',
    label: 'Verified programmes',
    icon: <SchoolIcon />
  },
  {
    id: 'resources',
    value: '5k+',
    label: 'Premium study resources',
    icon: <VideoLibraryIcon />
  },
  {
    id: 'success',
    value: '92%',
    label: 'Students reporting grade boosts',
    caption: 'Within the first term',
    icon: <SecurityIcon />
  }
];

// Will be populated dynamically from API as a fallback
const FEATURED_COURSES_FALLBACK = [
  {
    id: 'placeholder-1',
    name: 'Explore curated programmes',
    institution: 'EduVault',
    description: 'Stream lecture recordings, download notes, and tackle CAT simulations across Kenyan campuses.',
    tags: ['Lecture videos', 'Notes', 'CATs'],
    icon: 'video'
  }
];

const WORKFLOW_STEPS = [
  {
    title: 'Select your institution',
    description: 'Unlock curated programme dashboards, notices, and faculty guidance.'
  },
  {
    title: 'Access premium study packs',
    description: 'Stream lecture recordings, download notes, and tackle CAT simulations.'
  },
  {
    title: 'Stay on track',
    description: 'Get mentorship alerts, plan revision calendars, and monitor progress.'
  }
];

const SUCCESS_STORIES = [
  {
    id: 'jane',
    name: 'Jane Wanjiru',
    institution: 'JKUAT · Mechatronics',
    quote: 'Recorded labs and refresher notes helped me jump two grades in control systems.',
    resources: ['Lab recordings', 'CAT simulations']
  },
  {
    id: 'mike',
    name: 'Mike Oduor',
    institution: 'UoN · School of Law',
    quote: 'EduVault’s case digest bank made moot prep efficient for our entire cohort.',
    resources: ['Case digests', 'Moot recordings']
  },
  {
    id: 'faith',
    name: 'Faith Kendi',
    institution: 'KU · Nursing',
    quote: 'Ward mentorship alerts kept me in sync with practicals and OSCE prep.',
    resources: ['Mentorship alerts', 'OSCE flashcards']
  }
];

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [loading, setLoading] = useState(true);
  const [homeStats, setHomeStats] = useState(BASE_STATS);
  const [heroMetrics, setHeroMetrics] = useState(null);
  const [featuredCourses, setFeaturedCourses] = useState(FEATURED_COURSES_FALLBACK);
  const [successStoriesData, setSuccessStoriesData] = useState([]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    try {
      window.history.scrollRestoration = 'manual';
    } catch (error) {
      console.warn('Scroll restoration not supported', error);
    }
    return () => {
      try {
        window.history.scrollRestoration = previousRestoration || 'auto';
      } catch (error) {
        console.warn('Unable to reset scroll restoration', error);
      }
    };
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        const [institutionsResult, coursesResult, resourcesResult, storiesResult] = await Promise.allSettled([
          api.get('/api/institutions'),
          api.get('/api/courses'),
          api.get('/api/resources'),
          fetchSuccessStories(6)
        ]);

        const institutionsData =
          institutionsResult.status === 'fulfilled'
            ? institutionsResult.value.data?.institutions || []
            : [];
        const coursesData =
          coursesResult.status === 'fulfilled'
            ? coursesResult.value.data?.courses || []
            : [];
        const resourcesData =
          resourcesResult.status === 'fulfilled'
            ? resourcesResult.value.data?.resources || []
            : [];

        // Success stories
        const storiesData =
          storiesResult.status === 'fulfilled'
            ? storiesResult.value || []
            : [];

        const normaliseId = (value) => {
          if (!value) return null;
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
          }
          if (typeof value === 'object') {
            const nestedValue = value._id || value.id || value.value || null;
            return nestedValue ? String(nestedValue) : null;
          }
          return null;
        };

        const pickPositiveNumber = (...values) => {
          for (const value of values) {
            if (value === undefined || value === null) {
              continue;
            }
            const numeric = typeof value === 'number' ? value : Number(value);
            if (Number.isFinite(numeric) && numeric > 0) {
              return numeric;
            }
          }
          return null;
        };

        const courseInstitutionIds = new Set();
        coursesData.forEach((course) => {
          const institutionRef =
            course?.institution ||
            course?.institutionId ||
            course?.institution_id ||
            course?.institutionDetails;
          const institutionId = normaliseId(institutionRef);
          if (institutionId) {
            courseInstitutionIds.add(institutionId);
          }
        });

        const sanitizedInstitutions = [];
        const seenInstitutionIds = new Set();

        const getInstitutionStudentCount = (institution) =>
          pickPositiveNumber(
            institution?.studentCount,
            institution?.students,
            institution?.metrics?.students,
            institution?.metrics?.studentsOnboarded,
            institution?.metrics?.totalStudents
          ) || 0;

        institutionsData.forEach((institution) => {
          const rawId = normaliseId(institution?._id || institution?.id);
          if (!rawId || seenInstitutionIds.has(rawId)) {
            return;
          }

          seenInstitutionIds.add(rawId);

          const isActive = institution?.isActive !== false;
          const programmeCountEstimate = Array.isArray(institution?.programmes)
            ? institution.programmes.length
            : Number(institution?.programmesCount);
          const hasProgrammes = Number.isFinite(programmeCountEstimate) && programmeCountEstimate > 0;
          const numericStudentCount = pickPositiveNumber(
            institution?.studentCount,
            institution?.students,
            institution?.metrics?.students,
            institution?.metrics?.studentsOnboarded,
            institution?.metrics?.totalStudents
          );
          const hasStudents = typeof numericStudentCount === 'number';
          const linkedToCourse = courseInstitutionIds.has(rawId);

          const hasEssentialInfo = Boolean(institution?.name && institution?.shortName);
          if (!linkedToCourse && !hasStudents && !hasProgrammes) {
            // Allow institutions without linked data as long as they have core metadata
            if (!hasEssentialInfo) {
              return;
            }
          }

          const sanitizedInstitution = {
            ...institution,
            isActive
          };

          if (hasStudents) {
            sanitizedInstitution.studentCount = numericStudentCount;
            sanitizedInstitution.students = numericStudentCount;
          }

          sanitizedInstitutions.push(sanitizedInstitution);
        });

        const sortedInstitutions = sanitizedInstitutions
          .slice()
          .sort((a, b) => getInstitutionStudentCount(b) - getInstitutionStudentCount(a));

        setInstitutions(sortedInstitutions);

        if (sortedInstitutions.length > 0) {
          setSelectedInstitution((current) => {
            if (current) {
              const isStillPresent = sortedInstitutions.some((institution) => {
                const institutionId = normaliseId(institution?._id || institution?.id);
                return institutionId && institutionId === String(current);
              });
              if (isStillPresent) {
                return current;
              }
            }

            const firstId = normaliseId(sortedInstitutions[0]._id || sortedInstitutions[0].id);
            return firstId || '';
          });
        } else {
          setSelectedInstitution('');
        }

        const sanitizedInstitutionIds = new Set(
          sortedInstitutions.map((institution) => normaliseId(institution?._id || institution?.id)).filter(Boolean)
        );

        const relevantCourses = Array.isArray(coursesData)
          ? coursesData.filter((course) => {
              const institutionId = normaliseId(
                course?.institution ||
                  course?.institutionId ||
                  course?.institution_id ||
                  course?.institutionDetails
              );
              return institutionId && sanitizedInstitutionIds.has(institutionId);
            })
          : [];

        const courseById = new Map();
        if (Array.isArray(coursesData)) {
          coursesData.forEach((course) => {
            const courseId = normaliseId(course?._id || course?.id);
            if (courseId) {
              courseById.set(courseId, course);
            }
          });
        }

        const relevantResources = Array.isArray(resourcesData)
          ? resourcesData.filter((resource) => {
              const resourceInstitutionId = normaliseId(
                resource?.institution ||
                  resource?.institutionId ||
                  resource?.institution_id ||
                  resource?.institutionDetails
              );
              if (resourceInstitutionId && sanitizedInstitutionIds.has(resourceInstitutionId)) {
                return true;
              }

              const resourceCourseId = normaliseId(
                resource?.course ||
                  resource?.courseId ||
                  resource?.course_id ||
                  resource?.unit?.course ||
                  resource?.unit?.courseId
              );

              if (resourceCourseId && courseById.has(resourceCourseId)) {
                const course = courseById.get(resourceCourseId);
                const courseInstitutionId = normaliseId(
                  course?.institution || course?.institutionId || course?.institution_id || course?.institutionDetails
                );
                return courseInstitutionId && sanitizedInstitutionIds.has(courseInstitutionId);
              }

              return false;
            })
          : [];

        const totalStudents = sortedInstitutions.reduce((sum, institution) => {
          const numericValue = getInstitutionStudentCount(institution);
          return Number.isFinite(numericValue) && numericValue > 0 ? sum + numericValue : sum;
        }, 0);

        const totalInstitutions = sortedInstitutions.length;
        const totalProgrammes = relevantCourses.length;
        const totalResources = relevantResources.length;

        const dynamicStats = BASE_STATS.map((stat) => {
          if (stat.id === 'students') {
            return {
              ...stat,
              value: totalStudents > 0 ? totalStudents.toLocaleString() : '—',
              caption: totalStudents > 0 ? 'Across active partner campuses' : undefined
            };
          }
          if (stat.id === 'programmes') {
            return {
              ...stat,
              value: totalProgrammes > 0 ? totalProgrammes.toLocaleString() : '—',
              caption: totalProgrammes > 0 ? 'Verified programmes available today' : undefined
            };
          }
          if (stat.id === 'resources') {
            return {
              ...stat,
              value: totalResources > 0 ? totalResources.toLocaleString() : '—',
              caption: totalResources > 0 ? 'Premium study assets ready to download' : undefined
            };
          }
          return stat;
        });

        setHomeStats(dynamicStats);
        setHeroMetrics({
          totalInstitutions,
          totalProgrammes: totalProgrammes > 0 ? totalProgrammes : null,
          totalStudents: totalStudents > 0 ? totalStudents : null,
          topInstitutions: sortedInstitutions.slice(0, 6)
        });

        // Build dynamic featured courses from courses data
        const featured = (Array.isArray(coursesData) ? coursesData : [])
          .slice(0, 6)
          .map((c) => ({
            id: c._id || c.id || c.code,
            name: c.name,
            institution: (typeof c.institution === 'object' && (c.institution?.shortName || c.institution?.name)) || '—',
            description: c.description || 'Curated study packs with lecture videos, notes and assessments.',
            tags: Array.isArray(c.subcourses) && c.subcourses.length > 0 ? c.subcourses.slice(0, 3) : [c.department].filter(Boolean),
            icon: (Array.isArray(c.careerProspects) && c.careerProspects.length > 0) ? 'article' : 'video'
          }));
        if (featured.length > 0) setFeaturedCourses(featured);
        // Apply stories strictly from database; if empty, hide the section
        setSuccessStoriesData(Array.isArray(storiesData) ? storiesData : []);

      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleInstitutionChange = (institutionId) => {
    setSelectedInstitution(institutionId);
  };

  const handleExploreInstitution = () => {
    if (selectedInstitution) {
      navigate(`/institution/${selectedInstitution}`);
    } else {
      navigate('/institutions');
    }
  };

  const handleFeaturedCourse = (course) => {
    if (course?.id) {
      navigate(`/course/${course.id}`);
    }
  };

  const featuredCoursesMemo = useMemo(() => featuredCourses && featuredCourses.length > 0 ? featuredCourses : FEATURED_COURSES_FALLBACK, [featuredCourses]);
  const workflowSteps = useMemo(() => WORKFLOW_STEPS, []);
  const successStories = useMemo(() => successStoriesData, [successStoriesData]);

  const sectionVariant = {
    hidden: { opacity: 0, y: 48 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.19, 1, 0.22, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18,
        delayChildren: 0.15
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <LinearProgress color="primary" sx={{ position: 'sticky', top: 0, left: 0, zIndex: 10 }} />
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Stack spacing={4}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              alignItems="center"
              sx={{ p: 4, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.08) }}
            >
              <Skeleton variant="circular" width={80} height={80}>
                <SchoolIcon />
              </Skeleton>
              <Box sx={{ flexGrow: 1, width: '100%' }}>
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="rectangular" width="100%" height={16} sx={{ mt: 2, borderRadius: 2 }} />
              </Box>
            </Stack>

            <Stack spacing={2}>
              <Skeleton variant="text" width="55%" height={32} />
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 3 }} />
            </Stack>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Stack
      component={motion.div}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <HeroSection
        institutions={institutions}
        selectedInstitution={selectedInstitution}
        onInstitutionChange={handleInstitutionChange}
        onExplore={handleExploreInstitution}
        isAuthenticated={isAuthenticated}
        metrics={heroMetrics}
      />

      <Box component={motion.div} variants={sectionVariant}>
        <StatsSection stats={homeStats} />
      </Box>

      <Box component={motion.div} variants={sectionVariant}>
        <FeaturedCoursesSection courses={featuredCoursesMemo} onExplore={handleFeaturedCourse} />
      </Box>

      <Box component={motion.div} variants={sectionVariant}>
        <HowItWorksSection steps={workflowSteps} />
      </Box>

      <Box component={motion.div} variants={sectionVariant}>
        <StudentSuccessStories stories={successStories} />
      </Box>

      <Box component={motion.div} variants={sectionVariant}>
        <CTASection
          isAuthenticated={isAuthenticated}
          onPrimaryAction={() => navigate(isAuthenticated ? '/resources' : '/register')}
          onSecondaryAction={() => navigate('/login')}
        />
      </Box>
    </Stack>
  );
};

export default HomePage;
