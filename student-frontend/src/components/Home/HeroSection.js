import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  Chip
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { School as SchoolIcon } from '@mui/icons-material';
import { AnimatePresence, motion, useScroll, useTransform, useSpring, useMotionValue, animate } from 'framer-motion';
import { scrollReveal, hoverLift } from '../../utils/motionPresets';

const HeroSection = ({
  institutions,
  metrics,
  selectedInstitution,
  onInstitutionChange,
  onExplore,
  isAuthenticated
}) => {
  const theme = useTheme();
  const heroRef = useRef(null);
  const [marqueeOffset, setMarqueeOffset] = useState(0);

  const hasInstitutions = Array.isArray(institutions) && institutions.length > 0;

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const scrollTilt = useSpring(useTransform(scrollYProgress, [0, 1], [0, -10]), {
    stiffness: 120,
    damping: 28,
    mass: 0.4
  });

  const scrollParallax = useSpring(useTransform(scrollYProgress, [0, 1], [0, -120]), {
    stiffness: 110,
    damping: 26,
    mass: 0.45
  });

  const activeInstitution = useMemo(() => {
    if (!hasInstitutions) return null;
    return institutions.find((institution) => (institution._id || institution.id) === selectedInstitution) || institutions[0];
  }, [hasInstitutions, institutions, selectedInstitution]);

  const heroHighlights = useMemo(() => {
    const highlightSource = Array.isArray(metrics?.topInstitutions) && metrics.topInstitutions.length > 0
      ? metrics.topInstitutions
      : institutions;

    if (!Array.isArray(highlightSource) || highlightSource.length === 0) return [];

    return highlightSource
      .slice(0, 4)
      .map((institution) => institution.shortName || institution.name)
      .filter(Boolean);
  }, [institutions, metrics?.topInstitutions]);

  const aggregatedStats = useMemo(() => {
    if (!hasInstitutions) {
      return { totalInstitutions: 0, totalProgrammes: null, totalStudents: null };
    }

    const totalProgrammes = institutions.reduce((acc, institution) => {
      if (Array.isArray(institution.programmes)) {
        return acc + institution.programmes.length;
      }
      if (Number.isFinite(institution.programmesCount)) {
        return acc + institution.programmesCount;
      }
      return acc;
    }, 0);

    const totalStudents = institutions.reduce((acc, institution) => {
      const estimate = Number.isFinite(institution.studentCount)
        ? institution.studentCount
        : Number.isFinite(institution.students)
          ? institution.students
          : 0;
      return acc + estimate;
    }, 0);

    return {
      totalInstitutions: institutions.length,
      totalProgrammes,
      totalStudents
    };
  }, [hasInstitutions, institutions]);

  const formatMetricValue = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toLocaleString();
    }
    return '—';
  };

  const effectiveTotals = useMemo(() => {
    if (metrics && (metrics.totalInstitutions || metrics.totalProgrammes || metrics.totalStudents)) {
      return {
        totalInstitutions: metrics.totalInstitutions ?? aggregatedStats.totalInstitutions,
        totalProgrammes: metrics.totalProgrammes ?? aggregatedStats.totalProgrammes,
        totalStudents: metrics.totalStudents ?? aggregatedStats.totalStudents
      };
    }
    return aggregatedStats;
  }, [metrics, aggregatedStats]);

  const heroMetrics = useMemo(() => {
    if (!hasInstitutions && !metrics) {
      return [];
    }

    const computed = [
      {
        id: 'coverage',
        label: 'Kenyan institutions',
        value: formatMetricValue(effectiveTotals.totalInstitutions)
      }
    ];

    if (effectiveTotals.totalProgrammes) {
      computed.push({
        id: 'programmes',
        label: 'Curated programmes',
        value: formatMetricValue(effectiveTotals.totalProgrammes)
      });
    }

    if (effectiveTotals.totalStudents) {
      computed.push({
        id: 'students',
        label: 'Students onboarded',
        value: formatMetricValue(effectiveTotals.totalStudents)
      });
    }

    return computed;
  }, [effectiveTotals, hasInstitutions, metrics]);

  // Animated number utility
  const AnimatedNumber = ({ value, duration = 1.2 }) => {
    const nodeRef = useRef(null);
    const motionVal = useMotionValue(0);

    useEffect(() => {
      const numeric = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : value;
      const target = Number.isFinite(numeric) ? numeric : 0;
      const controls = animate(motionVal, target, { duration, ease: [0.19, 1, 0.22, 1] });
      return controls.stop;
    }, [value, duration, motionVal]);

    const [display, setDisplay] = useState('0');
    useEffect(() => {
      const unsub = motionVal.on("change", (latest) => {
        try {
          const rounded = Math.round(latest);
          setDisplay(rounded.toLocaleString());
        } catch {
          setDisplay(String(Math.round(latest)));
        }
      });
      return () => unsub();
    }, [motionVal]);

    return <span ref={nodeRef}>{display}</span>;
  };

  const activeProgrammesCount = activeInstitution
    ? Array.isArray(activeInstitution.programmes)
      ? activeInstitution.programmes.length
      : activeInstitution.programmesCount
    : null;

  const activeStudentCount = activeInstitution
    ? (Number.isFinite(activeInstitution.studentCount)
        ? activeInstitution.studentCount
        : Number.isFinite(activeInstitution.students)
          ? activeInstitution.students
          : null)
    : null;

  const heroTitle = activeInstitution
    ? `Explore ${activeInstitution.name}`
    : effectiveTotals.totalInstitutions > 0
      ? `Explore ${effectiveTotals.totalInstitutions.toLocaleString()} Kenyan institutions`
      : 'Explore Kenyan institutions with verified support';

  const heroSubtitle = activeInstitution
    ? [
        `Stay ahead at ${activeInstitution.name}`,
        activeInstitution.location?.town ? `in ${activeInstitution.location.town}` : null,
        activeProgrammesCount ? `across ${Number(activeProgrammesCount).toLocaleString()} programme${activeProgrammesCount === 1 ? '' : 's'}` : null,
        activeStudentCount ? `with ${Number(activeStudentCount).toLocaleString()} peers onboard.` : 'Access faculty notices, curated study packs, and mentorship alerts aligned to your timetable.'
      ]
        .filter(Boolean)
        .join(' ')
    : effectiveTotals.totalProgrammes && effectiveTotals.totalInstitutions
      ? `Browse ${effectiveTotals.totalInstitutions.toLocaleString()} accredited institutions and unlock ${effectiveTotals.totalProgrammes.toLocaleString()} curated programmes with live faculty updates.`
      : 'Browse accredited Kenyan institutions, unlock curated study kits, and stay ahead with live updates from your faculty.';

  const heroPrimaryMetric = heroMetrics[0] || {
    id: 'coverage',
    label: 'Kenyan institutions',
    value:
      effectiveTotals.totalInstitutions > 0
        ? effectiveTotals.totalInstitutions.toLocaleString()
        : '—'
  };

  const heroVariant = {
    hidden: { opacity: 0, y: 36 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1], when: 'beforeChildren', staggerChildren: 0.12 }
    }
  };

  const highlightVariant = {
    hidden: { opacity: 0, y: 18 },
    visible: (index = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, delay: index * 0.08, ease: [0.19, 1, 0.22, 1] }
    })
  };

  const metricVariant = {
    initial: { opacity: 0, y: 18, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } },
    exit: { opacity: 0, y: -18, scale: 0.9, transition: { duration: 0.25 } }
  };

  const floatingGlow = {
    initial: { opacity: 0.15, scale: 0.85 },
    animate: {
      opacity: [0.15, 0.25, 0.15],
      scale: [0.85, 1.05, 0.85],
      rotate: [0, 8, -6, 0]
    }
  };

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        py: { xs: 6, md: 10 },
        position: 'relative',
        overflow: 'hidden'
      }}
      ref={heroRef}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0.35, scale: 0.9 }}
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [0.9, 1.02, 0.9] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: { xs: 320, md: 520 },
          height: { xs: 320, md: 520 },
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${alpha('#ffffff', 0.22)}, transparent 65%)`,
          filter: 'blur(2px)'
        }}
        style={{ y: scrollParallax }}
      />
      <Box
        component={motion.div}
        variants={floatingGlow}
        initial="initial"
        animate="animate"
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          bottom: '-12%',
          left: '-5%',
          width: { xs: 260, md: 400 },
          height: { xs: 260, md: 400 },
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha('#ffffff', 0.18)} 0%, transparent 70%)`,
          filter: 'blur(3px)'
        }}
        style={{ y: scrollParallax }}
      />
      <Container maxWidth="lg">
        <Stack
          component={motion.div}
          variants={heroVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 6, md: 8 }}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack spacing={3} sx={{ maxWidth: 620 }}>
            <Stack
              component={motion.div}
              direction="row"
              spacing={2}
              alignItems="center"
              variants={scrollReveal.item}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.8 }}
            >
              <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 72, height: 72 }}>
                <SchoolIcon sx={{ fontSize: 38 }} />
              </Avatar>
              <Typography variant="subtitle1" sx={{ opacity: 0.85 }}>
                Kenya's smart campus companion
              </Typography>
            </Stack>

            <Typography
              component={motion.h1}
              variants={heroVariant}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              sx={{ fontWeight: 800, lineHeight: 1.08, fontSize: { xs: '2.4rem', md: '3.2rem' } }}
            >
              {heroTitle}
            </Typography>

            <Typography
              component={motion.p}
              variants={heroVariant}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              sx={{ opacity: 0.85, fontWeight: 300, fontSize: { xs: '1.05rem', md: '1.2rem' } }}
            >
              {heroSubtitle}
            </Typography>

            {heroHighlights.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" component={motion.div} variants={heroVariant}>
                <AnimatePresence>
                  {heroHighlights.map((highlight, index) => (
                    <Chip
                      component={motion.div}
                      variants={highlightVariant}
                      custom={index}
                      key={highlight}
                      label={highlight}
                      whileHover={{ scale: 1.08, y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
                      sx={{
                        bgcolor: alpha('#ffffff', 0.18),
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.35)',
                        fontWeight: 600
                      }}
                    />
                  ))}
                </AnimatePresence>
              </Stack>
            )}

            {/* Subtle marquee of institution short names */}
            {Array.isArray(institutions) && institutions.length > 0 && (
              <Box sx={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)', py: 1 }}>
                <Box
                  component={motion.div}
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  sx={{ display: 'flex', gap: 2, whiteSpace: 'nowrap' }}
                >
                  {[...institutions, ...institutions].map((inst, idx) => (
                    <Chip
                      key={(inst._id || inst.id || idx) + '-marquee'}
                      label={inst.shortName || inst.name}
                      size="small"
                      sx={{ bgcolor: alpha('#ffffff', 0.12), color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Paper
              component={motion.div}
              variants={heroVariant}
              elevation={4}
              whileHover={{ y: -6, boxShadow: '0 42px 120px rgba(15, 23, 42, 0.28)' }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                bgcolor: alpha(theme.palette.background.paper, 0.95),
                color: 'text.primary',
                boxShadow: '0 30px 90px rgba(15, 23, 42, 0.25)'
              }}
            >
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {activeInstitution ? `${activeInstitution.shortName || activeInstitution.name} student hub` : 'Jump into your campus portal'}
                  </Typography>
                  {activeInstitution?.location?.county && (
                    <Typography variant="caption" color="text.secondary">
                      {activeInstitution.location.county}
                    </Typography>
                  )}
                </Stack>
                <FormControl fullWidth>
                  <InputLabel>Select institution</InputLabel>
                  <Select
                    value={selectedInstitution || (activeInstitution?._id || activeInstitution?.id || '')}
                    label="Select institution"
                    onChange={(event) => onInstitutionChange(event.target.value)}
                    disabled={!hasInstitutions}
                  >
                    {hasInstitutions ? (
                      institutions.map((institution) => (
                        <MenuItem key={institution._id || institution.id} value={institution._id || institution.id}>
                          {institution.name || institution.shortName || 'Unnamed Institution'}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">No institutions available yet</MenuItem>
                    )}
                  </Select>
                </FormControl>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={onExplore}
                    disabled={!activeInstitution}
                    sx={{ flexGrow: 1 }}
                    component={motion.button}
                    whileHover={hoverLift.whileHover}
                    transition={hoverLift.transition}
                  >
                    {isAuthenticated ? 'Open my institution' : 'Preview portal'}
                  </Button>
                  {!isAuthenticated && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="large"
                      onClick={onExplore}
                      component={motion.button}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      sx={{ flexGrow: 1 }}
                    >
                      Browse programmes
                    </Button>
                  )}
                </Stack>

                {heroMetrics.length > 0 && (
                  <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap">
                    <AnimatePresence>
                      {heroMetrics.map((metric) => (
                        <Stack
                          key={metric.id}
                          component={motion.div}
                          variants={metricVariant}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          spacing={0.5}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            <AnimatedNumber value={metric.value} />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {metric.label}
                          </Typography>
                        </Stack>
                      ))}
                    </AnimatePresence>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Stack>

          <Box
            component={motion.div}
            variants={heroVariant}
            sx={{
              width: { xs: 300, md: 360 },
              height: { xs: 300, md: 360 },
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              component={motion.div}
              animate={{ rotate: [0, 10, -6, 0], scale: [1, 1.03, 0.97, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.35)',
                background: `radial-gradient(circle at 20% 20%, ${alpha('#ffffff', 0.22)}, transparent 70%)`,
                position: 'absolute'
              }}
              style={{ rotateX: scrollTilt }}
            />
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
              sx={{
                position: 'absolute',
                width: '72%',
                height: '72%',
                borderRadius: '50%',
                background: alpha('#ffffff', 0.14)
              }}
            />
            <Stack spacing={1.5} alignItems="center" sx={{ position: 'relative', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                <AnimatedNumber value={heroPrimaryMetric.value} />
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {heroPrimaryMetric.label}
              </Typography>
              {activeInstitution?.shortName && (
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  Currently viewing • {activeInstitution.shortName}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default HeroSection;
