import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Avatar,
  Badge,
  Stack,
  useTheme,
  alpha,
  LinearProgress,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardActionArea,
  Collapse,
} from '@mui/material';
import {
  School,
  PlayCircleOutline,
  GetApp,
  Quiz,
  Schedule,
  People,
  Star,
  BookmarkBorder,
  Share,
  ExpandMore,
  VideoLibrary,
  Description,
  Assignment,
  YouTube,
  Lock,
  CheckCircle,
  Security,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import AuthenticatedVideo from '../components/AuthenticatedVideo';
import SubscriptionDialog from '../components/SubscriptionDialog';
import SecureContentViewer from '../components/SecureContentViewer';
import SecureImageViewer from '../components/SecureImageViewer';
import { 
  slideFromLeft, 
  slideFromRight, 
  fadeInUp, 
  magneticHover, 
  buttonPress,
  staggerGrid 
} from '../utils/motionPresets';

const CoursePage = () => {
  const [course, setCourse] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSubcourse, setSelectedSubcourse] = useState('');
  const [subscriptions, setSubscriptions] = useState({});
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [error, setError] = useState(null);
  const [expandedUnitId, setExpandedUnitId] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [assessmentYearSelection, setAssessmentYearSelection] = useState({});
  const courseAcademicYearLabels = useMemo(() => {
    if (!Array.isArray(course?.academicYears)) {
      return [];
    }
    return course.academicYears
      .map((year) => (typeof year?.name === 'string' ? year.name.trim() : ''))
      .filter((name, index, arr) => name && arr.indexOf(name) === index);
  }, [course?.academicYears]);
  const courseActiveAcademicYear = useMemo(() => {
    if (!Array.isArray(course?.academicYears)) {
      return '';
    }
    const active = course.academicYears.find((year) => year?.isActive);
    return typeof active?.name === 'string' ? active.name.trim() : '';
  }, [course?.academicYears]);

  const normalizeAcademicYearLabel = useCallback((rawLabel) => {
    const trimmed = typeof rawLabel === 'string' ? rawLabel.trim() : '';
    if (!trimmed) {
      return '';
    }
    const match = courseAcademicYearLabels.find(
      (label) => label.toLowerCase() === trimmed.toLowerCase()
    );
    return match || trimmed;
  }, [courseAcademicYearLabels]);

  // Subscription dialog state
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionYear, setSubscriptionYear] = useState(1);
  const [subscriptionCourseInfo, setSubscriptionCourseInfo] = useState({
    courseId: null,
    courseName: '',
    unitCode: '',
    unitName: '',
    year: 1,
    semester: null
  });
  
  // Secure content viewer state
  const [secureViewerOpen, setSecureViewerOpen] = useState(false);
  const [secureContent, setSecureContent] = useState(null);
  
  // Secure image viewer state (for CATs and Exams)
  const [secureImageViewerOpen, setSecureImageViewerOpen] = useState(false);
  const [secureImageContent, setSecureImageContent] = useState(null);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const backNavigationTimeout = useRef(null);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    try {
      window.history.scrollRestoration = 'manual';
    } catch (err) {
      console.warn('Scroll restoration not supported', err);
    }
    return () => {
      try {
        window.history.scrollRestoration = previousScrollRestoration || 'auto';
      } catch (err) {
        console.warn('Unable to reset scroll restoration', err);
      }
    };
  }, []);

  const getSelectedAssessmentYear = (unitId, assessmentType, availableLabels = []) => {
    const existing = assessmentYearSelection[unitId]?.[assessmentType];
    if (existing && availableLabels.includes(existing)) {
      return existing;
    }
    if (availableLabels.includes(courseActiveAcademicYear)) {
      return courseActiveAcademicYear;
    }
    return availableLabels[0] || '';
  };

  const handleAssessmentYearChange = (unitId, assessmentType, yearLabel) => {
    const normalizedLabel = normalizeAcademicYearLabel(yearLabel);
    setAssessmentYearSelection((prev) => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] || {}),
        [assessmentType]: normalizedLabel
      }
    }));
  };

  const handleBack = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    setIsNavigatingAway(true);
    setLoading(true);
    if (backNavigationTimeout.current) {
      clearTimeout(backNavigationTimeout.current);
    }
    backNavigationTimeout.current = window.setTimeout(() => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }, 120);
  }, [navigate]);

  const scheduleTypeRaw = typeof course?.scheduleType === 'string'
    ? course.scheduleType.toLowerCase()
    : (typeof course?.duration?.scheduleType === 'string' ? course.duration.scheduleType.toLowerCase() : undefined);
  const normalizedPeriods = Number.isInteger(course?.duration?.semesters)
    ? course.duration.semesters
    : (Number.isInteger(course?.duration?.terms) ? course.duration.terms : undefined);
  const normalizedYears = Number.isInteger(course?.duration?.years) && course.duration.years > 0
    ? course.duration.years
    : undefined;
  const inferredTerms = normalizedYears && normalizedPeriods
    ? (normalizedPeriods / normalizedYears) >= 3
    : false;
  const isTermSchedule = scheduleTypeRaw === 'term' || scheduleTypeRaw === 'terms' || inferredTerms;
  const periodLabelSingular = isTermSchedule ? 'Term' : 'Semester';
  const periodLabelPlural = isTermSchedule ? 'Terms' : 'Semesters';

  const safeTotalYears = Number.isInteger(course?.duration?.years) && course.duration.years > 0
    ? course.duration.years
    : 1;
  const rawTotalPeriods = isTermSchedule
    ? (Number.isInteger(course?.duration?.terms) && course.duration.terms > 0
      ? course.duration.terms
      : course?.duration?.semesters)
    : (Number.isInteger(course?.duration?.semesters) && course.duration.semesters > 0
      ? course.duration.semesters
      : course?.duration?.terms);
  const safeTotalPeriods = Number.isInteger(rawTotalPeriods) && rawTotalPeriods > 0
    ? rawTotalPeriods
    : safeTotalYears * (isTermSchedule ? 3 : 2);
  const basePeriodsPerYear = Math.floor(safeTotalPeriods / safeTotalYears);
  const extraPeriodYears = safeTotalPeriods % safeTotalYears;
  const fallbackPeriodsPerYear = basePeriodsPerYear > 0 ? basePeriodsPerYear : 1;

  const getPeriodsForYear = useCallback((year) => {
    const normalizedYearIndex = Math.max(0, Math.min(Number(year) - 1, safeTotalYears - 1));
    const distributedPeriods = basePeriodsPerYear + (normalizedYearIndex < extraPeriodYears ? 1 : 0);
    const periodCount = Math.max(distributedPeriods, fallbackPeriodsPerYear, 1);
    return Array.from({ length: periodCount }, (_, idx) => idx + 1);
  }, [safeTotalYears, basePeriodsPerYear, extraPeriodYears, fallbackPeriodsPerYear]);

  const availableYears = useMemo(() => Array.from({ length: safeTotalYears }, (_, idx) => idx + 1), [safeTotalYears]);

  const periodsByYear = useMemo(() => {
    return availableYears.reduce((acc, yearNumber) => {
      acc[yearNumber] = getPeriodsForYear(yearNumber);
      return acc;
    }, {});
  }, [availableYears, getPeriodsForYear]);

  useEffect(() => {
    const handleScrollReset = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };

    if (!loading) {
      setIsNavigatingAway(false);
      requestAnimationFrame(handleScrollReset);
    }
  }, [loading]);

  useEffect(() => {
    fetchCourseData();
    return () => {
      if (backNavigationTimeout.current) {
        clearTimeout(backNavigationTimeout.current);
      }
      setIsNavigatingAway(false);
      setLoading(false);
    };
  }, [id]);

  useEffect(() => {
    const availableSubcourses = course?.subcourses || [];
    if (availableSubcourses.length === 0) {
      if (selectedSubcourse !== '') {
        setSelectedSubcourse('');
      }
      return;
    }

    setSelectedSubcourse((prev) => {
      if (prev && availableSubcourses.includes(prev)) {
        return prev;
      }
      return availableSubcourses[0];
    });
  }, [course?.subcourses, selectedSubcourse]);

  useEffect(() => {
    if (!course?.units) {
      return;
    }

    setExpandedUnitId(null);
    setExpandedTopics({});

    const unitsForSubcourse = course.units.filter(
      (unit) => !selectedSubcourse || unit.subcourse === selectedSubcourse
    );

    if (unitsForSubcourse.length === 0) {
      setSelectedYear(1);
      return;
    }

    const nextYear = unitsForSubcourse.reduce((minYear, unit) => {
      const unitYear = unit.year || 1;
      return unitYear < minYear ? unitYear : minYear;
    }, unitsForSubcourse[0].year || 1);

    setSelectedYear((prevYear) => (prevYear !== nextYear ? nextYear : prevYear));
  }, [selectedSubcourse, course?.units]);

  const filteredUnits = useMemo(() => {
    if (!course?.units) {
      return [];
    }

    if (!selectedSubcourse) {
      return course.units;
    }

    return course.units.filter((unit) => unit.subcourse === selectedSubcourse);
  }, [course?.units, selectedSubcourse]);

  const filteredResources = useMemo(() => {
    if (!selectedSubcourse) {
      return resources;
    }

    return resources.filter((resource) => {
      const resourceSubcourse = resource.unit?.subcourse || resource.subcourse;
      return resourceSubcourse === selectedSubcourse;
    });
  }, [resources, selectedSubcourse]);

  const periodsForSelectedYear = useMemo(() => {
    const basePeriods = getPeriodsForYear(selectedYear);
    const unitPeriods = filteredUnits
      .filter((unit) => unit.year === selectedYear)
      .map((unit) => {
        const numericSemester = Number(unit.semester);
        return Number.isFinite(numericSemester) && numericSemester > 0 ? numericSemester : null;
      })
      .filter((value) => value != null);

    const periodSet = new Set([...basePeriods, ...unitPeriods]);
    if (periodSet.size === 0) {
      periodSet.add(1);
    }

    return Array.from(periodSet).sort((a, b) => a - b);
  }, [selectedYear, filteredUnits, getPeriodsForYear]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch real course data from API
      const courseResponse = await api.get(`/api/courses/${id}`);
      setCourse(courseResponse.data.course);
      
      // Fetch approved content for students
      try {
        const contentResponse = await api.get(`/api/student/course/${id}/content`);
        setResources(contentResponse.data.content || []);
        setSubscriptions(contentResponse.data.subscriptions || {});
        setSubscriptionInfo(contentResponse.data.subscriptionInfo);
        console.log('📚 Loaded approved content:', contentResponse.data);
      } catch (contentError) {
        console.log('No approved content found for this course');
        setResources([]);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Failed to load course data. Please try again later.');
      setCourse(null);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setExpandedUnitId(null);
    setExpandedTopics({});
  };

  const handleSubcourseSelect = (value) => {
    setSelectedSubcourse(value);
  };

  const handleUnitSelect = (unit) => {
    const unitId = unit._id || unit.id;
    setExpandedUnitId((prev) => {
      const isSame = prev === unitId;
      if (isSame) {
        setExpandedTopics((prevTopics) => {
          if (!prevTopics[unitId]) return prevTopics;
          const updated = { ...prevTopics };
          delete updated[unitId];
          return updated;
        });
        return null;
      }
      return unitId;
    });
    if (unit.year !== selectedYear) {
      setSelectedYear(unit.year);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return <VideoLibrary />;
      case 'notes': return <Description />;
      case 'cats': return <Quiz />;
      case 'assignments': return <Assignment />;
      case 'pastExams': return <School />;
      case 'youtube': return <YouTube />;
      default: return <Description />;
    }
  };

  const getResourceColor = (type) => {
    switch (type) {
      case 'video': return theme.palette.primary.main;
      case 'notes': return theme.palette.secondary.main;
      case 'cats': return theme.palette.warning.main;
      case 'assignments': return theme.palette.success.main;
      case 'pastExams': return theme.palette.info.main;
      case 'youtube': return '#ff0000';
      default: return theme.palette.grey[500];
    }
  };

  const getResourceTypeLabel = (type) => {
    switch (type) {
      case 'video': return 'Lecture Video';
      case 'notes': return 'PDF Notes';
      case 'cats': return 'CAT';
      case 'assignments': return 'Assignment';
      case 'pastExams': return 'Past Exam';
      case 'youtube': return 'YouTube Video';
      default: return type;
    }
  };

  const getResourceUnitId = (resource) => resource.unit?._id || resource.unit?.id || resource.unitId || resource.unit?.unitId;
  const getResourceUnitYear = (resource) => resource.unit?.year ?? resource.unitYear ?? resource.year;
  const getResourceUnitSemester = (resource) => resource.unit?.semester ?? resource.unitSemester ?? resource.semester;
  const getResourceAcademicYear = (resource) => resource.academicYear || resource.unit?.academicYear || ''; 

  const isUnitExpanded = (unitId) => expandedUnitId === unitId;

  const getUnitResources = (unitId, unitYear) => {
    return filteredResources.filter((resource) => {
      const resourceUnitId = getResourceUnitId(resource);
      const resourceUnitYear = getResourceUnitYear(resource);
      if (resourceUnitYear !== unitYear || resourceUnitId !== unitId) {
        return false;
      }

      if (!selectedSubcourse) {
        return true;
      }

      const resourceSubcourse = resource.unit?.subcourse || resource.subcourse;
      return resourceSubcourse === selectedSubcourse;
    });
  };

  const handleTopicSelect = (unitId, topicKey) => {
    const isCurrentlyExpanded = expandedTopics[unitId] === topicKey;
    setExpandedTopics((prev) => ({
      ...prev,
      [unitId]: isCurrentlyExpanded ? null : topicKey,
    }));

    if (!isCurrentlyExpanded) {
      requestAnimationFrame(() => {
        const panel = document.getElementById(`topic-panel-${unitId}-${topicKey}`);
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  };

  const isTopicExpanded = (unitId, topicKey) => expandedTopics[unitId] === topicKey;

  const groupResourcesByTopic = (unitId, unitYear) => {
    const unitResources = getUnitResources(unitId, unitYear);
    const topicMap = new Map();

    unitResources.forEach((resource) => {
      const topic = resource.topic || {};
      const topicNumber = topic.number;
      
      // Skip resources without a proper topic (no General Resources section)
      if (!topic._id && !topic.id && topicNumber == null) {
        return;
      }
      
      const topicTitle = topic.title || (topicNumber != null ? `Topic ${topicNumber}` : 'Untitled Topic');
      const topicDescription = topic.description;
      const topicKey = topic._id || topic.id || `topic-${topicNumber}`;

      if (!topicMap.has(topicKey)) {
        topicMap.set(topicKey, {
          key: topicKey,
          number: topicNumber,
          title: topicTitle,
          description: topicDescription,
          resources: [],
        });
      }

      topicMap.get(topicKey).resources.push(resource);
    });

    const unitData = filteredUnits.find((unit) => {
      const currentId = unit._id || unit.id;
      return currentId === unitId && unit.year === unitYear;
    });

    if (unitData?.topics?.length) {
      unitData.topics.forEach((topic) => {
        const topicKey = topic._id || topic.id || (topic.topicNumber != null ? `topic-${topic.topicNumber}` : `topic-${topic.title}`);
        if (!topicMap.has(topicKey)) {
          topicMap.set(topicKey, {
            key: topicKey,
            number: topic.topicNumber,
            title: topic.title || (topic.topicNumber != null ? `Topic ${topic.topicNumber}` : 'Untitled Topic'),
            description: topic.description,
            resources: [],
          });
        }
      });
    }

    return Array.from(topicMap.values()).sort((a, b) => {
      const aNumber = a.number ?? Number.POSITIVE_INFINITY;
      const bNumber = b.number ?? Number.POSITIVE_INFINITY;
      if (aNumber !== bNumber) {
        return aNumber - bNumber;
      }
      return a.title.localeCompare(b.title);
    });
  };

  const groupAssessmentsByTypeAndYear = useCallback((unitResources = []) => {
    const initializeMap = () => {
      const map = new Map();
      courseAcademicYearLabels.forEach((label) => {
        map.set(label, []);
      });
      return map;
    };

    const result = {
      cats: initializeMap(),
      pastExams: initializeMap()
    };

    unitResources.forEach((resource) => {
      if (!['cats', 'pastExams'].includes(resource.type)) {
        return;
      }

      const mapRef = result[resource.type];
      const normalized = normalizeAcademicYearLabel(getResourceAcademicYear(resource));
      const fallbackLabel = normalized
        || courseActiveAcademicYear
        || courseAcademicYearLabels[0]
        || `Academic Year ${getResourceUnitYear(resource) || '-'}`;
      const yearLabel = fallbackLabel || 'Unassigned';
      if (!mapRef.has(yearLabel)) {
        mapRef.set(yearLabel, []);
      }
      mapRef.get(yearLabel).push(resource);
    });

    if (courseAcademicYearLabels.length === 0) {
      ['cats', 'pastExams'].forEach((type) => {
        if (result[type].size === 0) {
          result[type].set('Unassigned', []);
        }
      });
    }

    return result;
  }, [courseAcademicYearLabels, courseActiveAcademicYear, normalizeAcademicYearLabel]);

  const renderAssessmentCard = (resource, unitMeta, displayYearLabel) => {
    const resourceUnitYear = getResourceUnitYear(resource);
    const resourceUnitSemester = getResourceUnitSemester(resource);
    const academicYearLabel = displayYearLabel
      || normalizeAcademicYearLabel(getResourceAcademicYear(resource))
      || `Academic Year ${resourceUnitYear || '-'}`;
    const hasPremiumAccess = hasSubscription(resourceUnitYear);
    const canAccess = Boolean(resource.hasAccess && hasPremiumAccess);
    const uploadDateLabel = resource.uploadDate ? new Date(resource.uploadDate).toLocaleDateString() : '—';
    const marksLabel = resource.totalMarks ? `${resource.totalMarks} Marks` : null;
    const dueDateLabel = resource.dueDate ? new Date(resource.dueDate).toLocaleDateString() : null;
    const actionColor = resource.type === 'cats' ? 'warning' : 'info';
    const primaryLabel = resource.type === 'cats' ? 'CAT' : 'Exam';

    const handlePrimaryAction = () => {
      if (canAccess) {
        handleSecureImageView(resource);
      } else {
        handleSubscriptionClick(resourceUnitYear, {
          unitCode: unitMeta?.unitCode || resource.unit?.unitCode,
          unitName: unitMeta?.unitName || resource.unit?.unitName || resource.unitName,
          semester: resourceUnitSemester
        });
      }
    };

    return (
      <Box
        key={resource._id || resource.id}
        component={motion.div}
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.28, ease: [0.19, 1, 0.22, 1] }}
        sx={{ minWidth: { xs: 240, sm: 260 } }}
      >
        <Paper
          elevation={canAccess ? 6 : 1}
          sx={{
            height: '100%',
            borderRadius: 3,
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            bgcolor: canAccess ? alpha(theme.palette[actionColor].main, 0.05) : 'background.paper'
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={academicYearLabel} size="small" color={canAccess ? 'success' : 'default'} variant={canAccess ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
              {resourceUnitSemester && (
                <Chip label={`${periodLabelSingular} ${resourceUnitSemester}`} size="small" variant="outlined" />
              )}
            </Stack>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {resource.title || `${unitMeta?.unitCode || unitMeta?.unitName || ''} ${primaryLabel}`}
            </Typography>
            {resource.description && (
              <Typography variant="body2" color="text.secondary" sx={{ height: 48, overflow: 'hidden' }}>
                {resource.description}
              </Typography>
            )}
          </Stack>
          <Stack spacing={0.5}>
            {marksLabel && (
              <Typography variant="caption" color="text.secondary">
                Total Marks: {marksLabel}
              </Typography>
            )}
            {dueDateLabel && (
              <Typography variant="caption" color="text.secondary">
                Due: {dueDateLabel}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Uploaded: {uploadDateLabel}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 'auto' }}>
            <Button
              variant={canAccess ? 'contained' : 'outlined'}
              color={actionColor}
              size="small"
              onClick={handlePrimaryAction}
              startIcon={canAccess ? <Quiz /> : <Lock />}
            >
              {canAccess ? `Open ${primaryLabel}` : `Unlock ${primaryLabel}`}
            </Button>
            {resource.examType && (
              <Chip label={resource.examType.toUpperCase()} size="small" color="info" variant="outlined" />
            )}
          </Stack>
          {resource.requiresSubscription && !canAccess && (
            <Typography variant="caption" color="warning.main">
              Subscription required to view
            </Typography>
          )}
        </Paper>
      </Box>
    );
  };

  const renderAssessmentsSection = (unit, unitResources = []) => {
    const grouped = groupAssessmentsByTypeAndYear(unitResources);
    const unitId = unit._id || unit.id;
    const sections = [
      { key: 'cats', title: 'Continuous Assessment Tests (CATs)', icon: <Quiz fontSize="small" /> },
      { key: 'pastExams', title: 'Exams & Past Papers', icon: <School fontSize="small" /> }
    ];

    return (
      <Stack spacing={3}>
        {sections.map((section) => {
          const entries = Array.from(grouped[section.key].entries());
          const assessedYearLabels = entries.map(([label]) => label);
          const baseYearLabels = courseAcademicYearLabels.length > 0 ? courseAcademicYearLabels : assessedYearLabels;
          const yearLabels = baseYearLabels.filter((label, idx) => label && baseYearLabels.indexOf(label) === idx);
          const sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
          const selectedYearLabel = getSelectedAssessmentYear(unitId, section.key, yearLabels);
          const selectedAssessments = selectedYearLabel
            ? grouped[section.key].get(selectedYearLabel) || []
            : [];
          const totalAssessments = assessedYearLabels.reduce((sum, label) => sum + (grouped[section.key].get(label)?.length || 0), 0);

          return (
            <Box key={section.key}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {section.icon}
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                  <Chip label={`${totalAssessments} ${totalAssessments === 1 ? 'Item' : 'Items'}`} size="small" />
                </Stack>
                {yearLabels.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id={`${unitId}-${section.key}-year-select`}>Academic Year</InputLabel>
                    <Select
                      labelId={`${unitId}-${section.key}-year-select`}
                      label="Academic Year"
                      value={selectedYearLabel || ''}
                      onChange={(event) => handleAssessmentYearChange(unitId, section.key, event.target.value)}
                    >
                      {yearLabels.map((label) => (
                        <MenuItem key={label} value={label}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Stack>

              {yearLabels.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                  <Typography variant="body2" color="text.secondary">
                    No {section.key === 'cats' ? 'CATs' : 'Exams'} published for this unit yet.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ overflowX: 'auto', pb: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    component={motion.div}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    sx={{ minWidth: '100%' }}
                  >
                    {selectedAssessments.length > 0 ? (
                      selectedAssessments.map((resource) => renderAssessmentCard(resource, unit, selectedYearLabel))
                    ) : (
                      <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 3, minWidth: { xs: 260, sm: 320 } }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                          No {section.key === 'cats' ? 'CATs' : 'Exams'} uploaded for {selectedYearLabel} yet.
                        </Typography>
                      </Paper>
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    );
  };

  const renderResourceCard = (resource, meta = {}) => {
    const resourceUnitYear = getResourceUnitYear(resource);
    const resourceUnitSemester = getResourceUnitSemester(resource);
    const hasPremiumAccess = hasSubscription(resourceUnitYear);
    const canAccessResource = Boolean(resource.hasAccess && hasPremiumAccess);
    return (
    <motion.div
      key={resource._id || resource.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%' }}
    >
      <Card 
        variant="outlined"
        sx={{
          width: '100%',
          overflow: 'hidden',
          border: resource.isPremium ? '2px solid #ffa726' : '1px solid #e0e0e0'
        }}
      >
        <CardContent sx={{ p: 0, width: '100%' }}>
          <Box sx={{ p: 3, pb: 2, width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'stretch', sm: 'flex-start' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 },
                mb: 2
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(getResourceColor(resource.type), 0.1),
                  color: getResourceColor(resource.type),
                  width: 50,
                  height: 50,
                  mr: { xs: 0, sm: 2 }
                }}
              >
                {getResourceIcon(resource.type)}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1,
                    mb: 1
                  }}
                >
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    {resource.title}
                  </Typography>
                  {resource.isPremium && (
                    <Chip 
                      label="PREMIUM" 
                      size="small" 
                      color="warning"
                      icon={<Lock />}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: { xs: 1, sm: 0 } }}>
                  {periodLabelSingular} {resourceUnitSemester}
                </Typography>
                {resource.topic && (
                  <Typography variant="caption" color="text.secondary">
                    Topic {resource.topic.number}: {resource.topic.title}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label={getResourceTypeLabel(resource.type)}
                size="small"
                sx={{ 
                  bgcolor: alpha(getResourceColor(resource.type), 0.1),
                  color: getResourceColor(resource.type),
                  fontWeight: 600
                }}
              />
              {resource.duration && (
                <Chip 
                  label={resource.duration}
                  size="small"
                  variant="outlined"
                />
              )}
              {resource.fileSize && (
                <Chip 
                  label={`${(resource.fileSize / 1024 / 1024).toFixed(1)} MB`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            {resource.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {resource.description}
              </Typography>
            )}
          </Box>

          {resource.type === 'video' && canAccessResource && resource.filename && (
            <Box sx={{ px: 3, pb: 3, width: '100%' }}>
              <AuthenticatedVideo 
                filename={resource.filename}
                backendUrl={process.env.REACT_APP_BACKEND_URL}
                isPremium={resource.isPremium}
                hasSubscription={hasPremiumAccess}
              />
            </Box>
          )}

          {resource.type === 'video' && !canAccessResource && (
            <Box sx={{ px: 3, pb: 3, width: '100%' }}>
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: 'grey.100',
                  border: '2px dashed #ffa726'
                }}
              >
                <Lock sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Premium Content
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Subscribe to access this video lecture
                </Typography>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => handleSubscriptionClick(resourceUnitYear, {
                    unitCode: meta?.unit?.unitCode || resource.unit?.unitCode,
                    unitName: meta?.unit?.unitName || resource.unit?.unitName || resource.unitName,
                    semester: resourceUnitSemester
                  })}
                  startIcon={<Star />}
                >
                  Subscribe for KSH {subscriptionInfo?.price || 100}
                </Button>
              </Paper>
            </Box>
          )}

          <Box
            sx={{
              p: 3,
              pt: 0,
              display: 'flex',
              justifyContent: { xs: 'center', sm: 'space-between' },
              alignItems: { xs: 'stretch', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap',
              gap: 2,
              width: '100%'
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              {resource.type === 'notes' && resource.filename && (
                resource.accessRules?.canDownload ? (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<GetApp />}
                    onClick={() => handleDownloadClick(resource, {
                      year: resourceUnitYear,
                      unitCode: meta?.unit?.unitCode || resource.unit?.unitCode,
                      unitName: meta?.unit?.unitName || resource.unit?.unitName || resource.unitName,
                      semester: resourceUnitSemester
                    })}
                    sx={{ borderRadius: 2 }}
                  >
                    Download PDF
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Lock />}
                    onClick={() => handleSubscriptionClick(resourceUnitYear, {
                      unitCode: meta?.unit?.unitCode || resource.unit?.unitCode,
                      unitName: meta?.unit?.unitName || resource.unit?.unitName || resource.unitName,
                      semester: resourceUnitSemester
                    })}
                    sx={{ borderRadius: 2 }}
                  >
                    Subscribe to Download
                  </Button>
                )
              )}

              {resource.type === 'youtube' && resource.url && canAccessResource && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<YouTube />}
                  href={resource.url}
                  target="_blank"
                  sx={{ borderRadius: 2 }}
                >
                  Watch on YouTube
                </Button>
              )}

              {resource.type === 'assignments' && resource.filename && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Assignment />}
                  href={`${process.env.REACT_APP_BACKEND_URL}/api/upload/file/${resource.filename}`}
                  target="_blank"
                  sx={{ borderRadius: 2, bgcolor: 'success.main' }}
                >
                  Download Assignment (Free)
                </Button>
              )}

              {['cats', 'pastExams'].includes(resource.type) && resource.filename && (
                canAccessResource ? (
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ borderRadius: 2, bgcolor: 'warning.main' }}
                    onClick={() => handleSecureImageView(resource)}
                  >
                    🔒 View {getResourceTypeLabel(resource.type)} (Secure)
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Lock />}
                    onClick={() => handleSubscriptionClick(resourceUnitYear, {
                      unitCode: meta?.unit?.unitCode || resource.unit?.unitCode,
                      unitName: meta?.unit?.unitName || resource.unit?.unitName || resource.unitName,
                      semester: resourceUnitSemester
                    })}
                    sx={{ borderRadius: 2 }}
                  >
                    Subscribe to Access
                  </Button>
                )
              )}

              {resource.type === 'video' && !canAccessResource && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Lock />}
                  onClick={() => handleSubscriptionClick(resourceUnitYear, {
                    unitCode: meta?.unit?.unitCode || resource.unit?.unitCode,
                    unitName: meta?.unit?.unitName || resource.unit?.unitName || resource.unitName,
                    semester: resourceUnitSemester
                  })}
                  sx={{ borderRadius: 2 }}
                >
                  Subscribe to Stream
                </Button>
              )}

              {resource.type === 'youtube' && !canAccessResource && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Lock />}
                  onClick={() => handleSubscriptionClick(resourceUnitYear, {
                    unitCode: meta?.unit?.unitCode || resource.unit?.unitCode,
                    unitName: meta?.unit?.unitName || resource.unit?.unitName || resource.unitName,
                    semester: resourceUnitSemester
                  })}
                  sx={{ borderRadius: 2 }}
                >
                  Subscribe to Access
                </Button>
              )}

              {hasPremiumAccess && (
                <Chip
                  label="Premium Active"
                  color="success"
                  size="small"
                  icon={<CheckCircle />}
                />
              )}

              <IconButton size="small">
                <BookmarkBorder />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
              Uploaded: {new Date(resource.uploadDate).toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
  };

  // Helper functions
  const hasSubscription = (year) => {
    return subscriptions[year] || false;
  };

  const handleSubscriptionClick = (year, meta = {}) => {
    const resolvedYear = Number.isFinite(Number(year)) && Number(year) > 0
      ? Number(year)
      : (Number.isFinite(Number(meta.year)) && Number(meta.year) > 0 ? Number(meta.year) : 1);

    setSubscriptionYear(resolvedYear);
    setSubscriptionCourseInfo({
      courseId: id,
      courseName: course?.name || '',
      unitCode: meta.unitCode || '',
      unitName: meta.unitName || '',
      year: resolvedYear,
      semester: meta.semester ?? null
    });
    setShowSubscriptionDialog(true);
  };

  const handleSubscriptionSuccess = (subscription) => {
    // Update subscriptions state
    setSubscriptions(prev => ({
      ...prev,
      [subscription.year]: true
    }));
    
    // Refresh content to get updated access
    fetchCourseData();
  };

  const handleSecureView = (content) => {
    const targetYear = content.unit?.year ?? content.year ?? selectedYear;

    if (!hasSubscription(targetYear)) {
      handleSubscriptionClick(targetYear, {
        unitCode: content.unit?.unitCode,
        unitName: content.unit?.unitName || content.unitName,
        semester: content.unit?.semester || content.semester
      });
      return;
    }

    if (content.accessRules?.preventScreenshot || content.accessRules?.viewOnlyOnSite) {
      setSecureContent(content);
      setSecureViewerOpen(true);
    }
  };

  const handleSecureImageView = (content) => {
    if (!content || !['cats', 'pastExams'].includes(content.type)) {
      return;
    }

    const targetYear = content.unit?.year ?? content.year ?? selectedYear;

    if (!hasSubscription(targetYear)) {
      handleSubscriptionClick(targetYear, {
        unitCode: content.unit?.unitCode || content.unitCode,
        unitName: content.unit?.unitName || content.unitName,
        semester: content.unit?.semester || content.semester
      });
      return;
    }

    let rawIdentifier = content.assessmentId || content._id || content.id;
    if (typeof rawIdentifier === 'string' && !/^[a-f\d]{24}$/i.test(rawIdentifier)) {
      const matches = rawIdentifier.match(/[a-f\d]{24}/gi);
      if (matches && matches.length > 0) {
        rawIdentifier = matches[0];
      }
    }

    const isValidObjectId = typeof rawIdentifier === 'string' && /^[a-f\d]{24}$/i.test(rawIdentifier);

    if (!isValidObjectId) {
      console.warn('Secure content missing valid ID, skipping viewer.', { content, rawIdentifier });
      setError('This secure resource is not yet available. Please contact support if the issue persists.');
      return;
    }

    const normalizedContent = {
      ...content,
      _id: rawIdentifier,
      id: rawIdentifier
    };

    setSecureImageContent(normalizedContent);
    setSecureImageViewerOpen(true);
  };

  const handleDownloadClick = async (content, meta = {}) => {
    const targetYear = content.unit?.year || meta.year;
    if (content.accessRules?.downloadRequiresSubscription && !hasSubscription(targetYear)) {
      handleSubscriptionClick(targetYear, {
        unitCode: meta.unitCode || content.unit?.unitCode,
        unitName: meta.unitName || content.unit?.unitName || content.unitName,
        semester: meta.semester || content.unit?.semester || content.semester
      });
      return;
    } else if (content.accessRules?.canDownload) {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('We could not find your login session. Please sign in again to download this content.');
        return;
      }

      const courseId = course?._id || course?.id || id;
      if (!courseId) {
        setError('Unable to determine course information for this download.');
        return;
      }

      const payload = {
        courseId,
        year: content.unit?.year ?? selectedYear,
        unitId: content.unit?.id || content.unit?._id || content.unitId,
        unitName: content.unit?.name || content.unit?.unitName,
        topicId: content.topic?.id || content.topic?._id,
        topicTitle: content.topic?.title,
        resourceId: content.id || content.resourceId || content.filename,
        resourceTitle: content.title,
        filename: content.filename,
        fileSize: content.fileSize
      };

      try {
        await api.post('/api/student-downloads', payload);
      } catch (registrationError) {
        if (registrationError.response?.status !== 403) {
          console.error('Failed to register download:', registrationError);
          setError(registrationError.response?.data?.message || 'Unable to save download reference.');
        }
      }

      setSecureContent({
        ...content,
        filename: content.filename,
        title: content.title,
        accessRules: {
          ...content.accessRules,
          preventScreenshot: true,
          viewOnlyOnSite: true
        }
      });
      setSecureViewerOpen(true);
    }
  };

  if (loading || isNavigatingAway) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <LinearProgress color="primary" sx={{ position: 'sticky', top: 0, left: 0, zIndex: 10 }} />
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Stack spacing={4}>
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              <Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.25)' }}>
                    <School sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box sx={{ flexGrow: 1, width: '100%' }}>
                    <Skeleton variant="text" width="65%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.4)' }} />
                    <Skeleton variant="text" width="45%" height={28} sx={{ bgcolor: 'rgba(255,255,255,0.25)' }} />
                    <Skeleton variant="rectangular" width="100%" height={16} sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                  </Box>
                </Stack>
              </Paper>
            </motion.div>

            <Grid container spacing={3}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={`overview-skeleton-${index}`}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton variant="rectangular" width="100%" height={8} sx={{ mt: 2, borderRadius: 2 }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Loading resources...
              </Typography>
              <Grid container spacing={3}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Grid item xs={12} key={`resource-skeleton-${index}`}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Skeleton variant="circular" width={56} height={56} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width="40%" height={28} />
                          <Skeleton variant="text" width="25%" height={20} />
                          <Skeleton variant="rectangular" width="100%" height={12} sx={{ mt: 1, borderRadius: 2 }} />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      {/* Course Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: 6,
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
                      width: 70,
                      height: 70,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      mr: 3,
                    }}
                  >
                    <School sx={{ fontSize: 35 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                      {course?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label={course?.code}
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontWeight: 600 
                        }}
                      />
                      <Chip 
                        label={course?.department}
                        sx={{ 
                          bgcolor: theme.palette.secondary.main,
                          color: 'white',
                          fontWeight: 600 
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.6 }}>
                  {course?.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule sx={{ fontSize: 20 }} />
                    <Typography variant="body1">
                      {course?.duration.years} Years
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People sx={{ fontSize: 20 }} />
                    <Typography variant="body1">
                      {course?.totalStudents} Students
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ fontSize: 20, color: '#ffc107' }} />
                    <Typography variant="body1">
                      {course?.rating} Rating
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayCircleOutline />}
                    sx={{
                      bgcolor: theme.palette.secondary.main,
                      '&:hover': { bgcolor: theme.palette.secondary.dark },
                    }}
                  >
                    Start Learning
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
                    Course Progress
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Completion</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {course?.completionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={course?.completionRate || 0} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Resources</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{filteredResources.length}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Institution</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {course?.institution?.shortName || course?.institution?.name || 'N/A'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ borderRadius: 3, textTransform: 'none' }}
          >
            Back
          </Button>
        </Box>
        {/* Year Navigation */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Course Content
          </Typography>

          {course?.subcourses && course.subcourses.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }} elevation={0} variant="outlined">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Choose a subcourse to view its units and resources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel id="subcourse-select-label">Subcourse</InputLabel>
                  <Select
                    labelId="subcourse-select-label"
                    label="Subcourse"
                    value={selectedSubcourse || ''}
                    onChange={(event) => handleSubcourseSelect(event.target.value)}
                  >
                    <MenuItem value="" disabled>
                      Select a subcourse
                    </MenuItem>
                    {course.subcourses.map((subcourse) => (
                      <MenuItem key={subcourse} value={subcourse}>
                        {subcourse}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label={selectedSubcourse ? `Viewing: ${selectedSubcourse}` : 'Viewing all units'}
                    sx={{
                      bgcolor: selectedSubcourse ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                      color: selectedSubcourse ? theme.palette.primary.main : 'text.secondary',
                      borderColor: selectedSubcourse ? alpha(theme.palette.primary.main, 0.5) : theme.palette.divider,
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  />
                  <Chip
                    label={`${filteredUnits.length} ${filteredUnits.length === 1 ? 'Unit' : 'Units'}`}
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                      borderColor: alpha(theme.palette.secondary.main, 0.2),
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  />
                  <Chip
                    label={`${filteredResources.length} ${filteredResources.length === 1 ? 'Resource' : 'Resources'}`}
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.dark,
                      borderColor: alpha(theme.palette.info.main, 0.2),
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: course?.duration?.years || 3 }, (_, i) => i + 1).map((year, index) => (
              <Button
                key={year}
                component={motion.button}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                custom={index}
                whileHover="hover"
                whileTap="tap"
                {...buttonPress}
                variant={selectedYear === year ? "contained" : "outlined"}
                onClick={() => handleYearSelect(year)}
                sx={{
                  minWidth: 120,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  background: selectedYear === year 
                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    : 'transparent',
                  '&::before': selectedYear === year ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 2s infinite',
                  } : {},
                  '@keyframes shimmer': {
                    '0%': { left: '-100%' },
                    '100%': { left: '100%' },
                  },
                }}
              >
                Year {year}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Course Units Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Course Units - Year {selectedYear}
          </Typography>
          
          {filteredUnits.length > 0 ? (
            <Grid container spacing={2}>
              <AnimatePresence mode="wait">
                {periodsForSelectedYear.map((semester, semesterIndex) => {
                  const semesterNumber = Number(semester);
                  const semesterUnits = filteredUnits.filter(
                    unit => unit.year === selectedYear && Number(unit.semester) === semesterNumber
                  );
                  
                  return (
                    <Grid item xs={12} md={6} key={semesterNumber}>
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={semesterIndex % 2 === 0 ? slideFromLeft : slideFromRight}
                        custom={semesterIndex}
                      >
                        <Paper 
                          sx={{ 
                            p: 3,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.secondary.main, 0.03)})`,
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
                              transform: 'translateY(-4px)',
                            }
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            color="primary" 
                            gutterBottom
                            sx={{ 
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Box
                              component={motion.div}
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                              }}
                            >
                              {semesterNumber}
                            </Box>
                            {periodLabelSingular} {semesterNumber}
                          </Typography>
                          
                          {semesterUnits.length === 0 ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                {selectedSubcourse
                                  ? `No units available for ${selectedSubcourse} in ${periodLabelSingular} ${semesterNumber} of Year ${selectedYear}.`
                                  : `No units available for this ${periodLabelSingular.toLowerCase()}.`}
                              </Typography>
                            </motion.div>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <AnimatePresence mode="popLayout">
                                {semesterUnits.map((unit, unitIndex) => {
                                  const unitId = unit._id || unit.id;
                                  const expanded = isUnitExpanded(unitId);
                                  const unitResources = getUnitResources(unitId, unit.year);
                                  const topicGroups = groupResourcesByTopic(unitId, unit.year);
                                  const hasResources = unitResources.length > 0;
                                  const hasTopics = topicGroups.length > 0;

                                  return (
                                    <motion.div
                                      key={unitId}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      variants={unitIndex % 2 === 0 ? slideFromLeft : slideFromRight}
                                      custom={unitIndex}
                                      layout
                                    >
                                      <Card 
                                        component={motion.div}
                                        whileHover={{ 
                                          scale: 1.02, 
                                          y: -4,
                                          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.2)}`
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        variant="outlined"
                                        sx={{
                                          width: '100%',
                                          borderColor: expanded ? theme.palette.primary.main : undefined,
                                          boxShadow: expanded ? '0 0 0 2px rgba(33,150,243,0.15)' : undefined,
                                          borderRadius: 3,
                                          overflow: 'hidden',
                                        }}
                                      >
                                <CardActionArea
                                  onClick={() => handleUnitSelect(unit)}
                                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}
                                >
                                  <CardContent sx={{ p: 2, width: '100%' }}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: { xs: 'stretch', sm: 'flex-start' },
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: { xs: 1.5, sm: 0 },
                                        mb: 1
                                      }}
                                    >
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {unit.unitCode}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                                        {unit.subcourse && (
                                          <Chip
                                            label={unit.subcourse}
                                            size="small"
                                            color="secondary"
                                            variant="outlined"
                                          />
                                        )}
                                        <Chip 
                                          label={`${unit.creditHours} CH`}
                                          size="small"
                                          color="primary"
                                        />
                                        <Chip
                                          label={`${unitResources.length} ${unitResources.length === 1 ? 'Resource' : 'Resources'}`}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      {unit.unitName}
                                    </Typography>
                                    {unit.description && (
                                      <Typography variant="body2" sx={{ mt: 1 }}>
                                        {unit.description}
                                      </Typography>
                                    )}
                                    {unit.prerequisites && unit.prerequisites.length > 0 && (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" color="warning.main">
                                          Prerequisites: {unit.prerequisites.join(', ')}
                                        </Typography>
                                      </Box>
                                    )}
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                                      {expanded ? 'Tap to collapse resources' : 'Tap to view learning resources'}
                                    </Typography>
                                  </CardContent>
                                </CardActionArea>

                                <Collapse in={expanded} timeout="auto" unmountOnExit>
                                  <Divider />
                                  <CardContent sx={{ pt: 3, bgcolor: 'grey.50' }}>
                                    <Stack spacing={3}>
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                          Learning Resources
                                        </Typography>
                                        {!hasResources && !hasTopics ? (
                                          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                                            <Typography variant="body2" color="text.secondary">
                                              No topics or resources have been published for this unit yet.
                                            </Typography>
                                          </Paper>
                                        ) : (
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            {hasTopics ? topicGroups.map((topic) => {
                                              const topicExpanded = isTopicExpanded(unitId, topic.key);
                                              return (
                                                <Card key={topic.key} variant="outlined" sx={{ overflow: 'hidden', width: '100%' }}>
                                                  <CardActionArea onClick={() => handleTopicSelect(unitId, topic.key)}>
                                                    <CardContent sx={{ backgroundColor: 'background.default', width: '100%' }}>
                                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box>
                                                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                            {topic.number != null ? `Topic ${topic.number}: ${topic.title}` : topic.title}
                                                          </Typography>
                                                          {topic.description && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                              {topic.description}
                                                            </Typography>
                                                          )}
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                          <Chip
                                                            label={`${topic.resources.length} ${topic.resources.length === 1 ? 'Resource' : 'Resources'}`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                          />
                                                          <ExpandMore sx={{ transform: topicExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                                        </Box>
                                                      </Box>
                                                    </CardContent>
                                                  </CardActionArea>
                                                  <Collapse in={topicExpanded} timeout="auto" unmountOnExit>
                                                    <Box
                                                      id={`topic-panel-${unitId}-${topic.key}`}
                                                      sx={{ p: 3, pt: 0, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
                                                    >
                                                      {topic.resources.length > 0 ? (
                                                        topic.resources.map((resource) =>
                                                          renderResourceCard(resource, {
                                                            unit,
                                                            topic
                                                          })
                                                        )
                                                      ) : (
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.paper' }}>
                                                          <Typography variant="body2" color="text.secondary">
                                                            Content for this topic is coming soon.
                                                          </Typography>
                                                        </Paper>
                                                      )}
                                                    </Box>
                                                  </Collapse>
                                                </Card>
                                              );
                                            }) : (
                                              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', width: '100%' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                  Resources will appear here once they are approved.
                                                </Typography>
                                              </Paper>
                                            )}
                                          </Box>
                                        )}
                                      </Box>

                                      <Divider sx={{ borderStyle: 'dashed' }} />

                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                          General Section (Assessments)
                                        </Typography>
                                        {renderAssessmentsSection(unit, unitResources)}
                                      </Box>
                                    </Stack>

                                  </CardContent>
                                </Collapse>
                              </Card>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </Box>
                          )}
                        </Paper>
                      </motion.div>
                    </Grid>
                  );
                })}
              </AnimatePresence>
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {selectedSubcourse
                  ? `No units available for ${selectedSubcourse} yet.`
                  : `No units available for Year ${selectedYear} yet.`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Units will appear here once they are added by administrators.
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Course Information Accordions */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Course Information
          </Typography>
          
          {course?.entryRequirements && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Entry Requirements</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">{course.entryRequirements}</Typography>
              </AccordionDetails>
            </Accordion>
          )}

          {course?.careerProspects && course.careerProspects.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Career Prospects</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="ul" sx={{ pl: 2 }}>
                  {course.careerProspects.map((prospect, index) => (
                    <Box component="li" key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">{prospect}</Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {course?.description && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Course Description</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">{course.description}</Typography>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      </Container>

      {/* Subscription Dialog */}
      <SubscriptionDialog
        open={showSubscriptionDialog}
        onClose={() => setShowSubscriptionDialog(false)}
        courseId={subscriptionCourseInfo.courseId || id}
        courseName={subscriptionCourseInfo.courseName || course?.name}
        year={subscriptionCourseInfo.year || subscriptionYear}
        unitCode={subscriptionCourseInfo.unitCode}
        unitName={subscriptionCourseInfo.unitName}
        semester={subscriptionCourseInfo.semester}
        availableYears={availableYears}
        periodLabelSingular={periodLabelSingular}
        periodsByYear={periodsByYear}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />

      {/* Secure Content Viewer (for other content types) */}
      <Dialog
        open={secureViewerOpen}
        onClose={() => setSecureViewerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {secureContent && (
            <SecureContentViewer
              filename={secureContent.filename}
              contentType={secureContent.type === 'cats' || secureContent.type === 'pastExams' ? 'pdf' : 'image'}
              title={secureContent.title}
              backendUrl={process.env.REACT_APP_BACKEND_URL}
              preventScreenshot={true}
              preventRecording={true}
              onClose={() => setSecureViewerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Secure Image Viewer (for CATs and Exams) */}
      {secureImageContent && (
        <SecureImageViewer
          type={secureImageContent.type}
          id={secureImageContent._id || secureImageContent.id}
          open={secureImageViewerOpen}
          onClose={() => {
            setSecureImageViewerOpen(false);
            setSecureImageContent(null);
          }}
        />
      )}
    </Box>
  );
};

export default CoursePage;
