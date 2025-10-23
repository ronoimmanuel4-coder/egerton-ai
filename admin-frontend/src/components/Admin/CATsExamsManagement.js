import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListSubheader,
  Stack,
  Tooltip,
  IconButton,
  Menu
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  Image as ImageIcon,
  Security as SecurityIcon,
  AccessTime as TimeIcon,
  ContentCopy as DuplicateIcon,
  Public as PublishIcon,
  PublicOff as UnpublishIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const createInitialFormState = () => ({
  title: '',
  courseId: '',
  unitId: '',
  unitName: '',
  description: '',
  dueDate: '',
  totalMarks: '',
  duration: '',
  instructions: '',
  image: null,
  academicYear: '',
  period: ''
});

const getAssessmentEndpoint = (type, id = '') => {
  const base = type === 'cat' ? '/api/admin/cats' : '/api/admin/exams';
  return id ? `${base}/${id}` : base;
};

const CATsExamsManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [cats, setCats] = useState([]);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseUnits, setCourseUnits] = useState([]);
  const [filterUnits, setFilterUnits] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [dialogContext, setDialogContext] = useState('create'); // create | edit | duplicate
  const [selectedType, setSelectedType] = useState('cat'); // 'cat' or 'exam'
  const [filters, setFilters] = useState({
    courseId: 'all',
    unitId: 'all',
    academicYear: 'all',
    period: 'all'
  });
  const [formData, setFormData] = useState(createInitialFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [previewDialog, setPreviewDialog] = useState({ open: false, content: null });
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, assessment: null, type: null });

  const formatDateTimeLocal = useCallback((value) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }, []);
  useEffect(() => {
    fetchCourses();
    fetchAssessments();
  }, []);

  const normalizeUnits = useCallback((unitsArray = []) => {
    return unitsArray
      .filter(Boolean)
      .map((unit) => {
        const derivedYear = Number(unit.year ?? unit.unitYear ?? unit.level ?? unit?.duration?.year ?? 1);
        const derivedPeriod = Number(unit.semester ?? unit.term ?? unit.period ?? unit?.duration?.semester ?? unit?.duration?.term ?? 1);

        return {
          ...unit,
          year: Number.isFinite(derivedYear) && derivedYear > 0 ? derivedYear : 1,
          semester: Number.isFinite(derivedPeriod) && derivedPeriod > 0 ? derivedPeriod : 1
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.semester !== b.semester) return a.semester - b.semester;
        return (a.code || a.unitCode || '').localeCompare(b.code || b.unitCode || a.unitName || '');
      });
  }, []);

  const normalizeAcademicYear = useCallback((value, fallbackDate) => {
    if (value && typeof value === 'string') {
      return value;
    }

    const referenceDate = fallbackDate ? new Date(fallbackDate) : new Date();
    const startYear = referenceDate.getMonth() >= 7
      ? referenceDate.getFullYear()
      : referenceDate.getFullYear() - 1;

    return `${startYear}/${startYear + 1}`;
  }, []);

  const normalizePeriod = useCallback((value, fallbackDate) => {
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }

    const referenceDate = fallbackDate ? new Date(fallbackDate) : new Date();
    return referenceDate.getMonth() < 6 ? '1' : '2';
  }, []);

  const enrichAssessment = useCallback((assessment) => {
    if (!assessment) {
      return assessment;
    }

    const academicYear = normalizeAcademicYear(
      assessment.academicYear || assessment.metadata?.academicYear,
      assessment.dueDate
    );
    const period = normalizePeriod(
      assessment.period || assessment.metadata?.period,
      assessment.dueDate
    );

    return {
      ...assessment,
      academicYear,
      period
    };
  }, [normalizeAcademicYear, normalizePeriod]);

  const fetchAssessments = async () => {
    try {
      console.log('📚 Fetching assessments from server...');
      
      // Fetch all assessments for this admin
      const response = await api.get('/api/admin/assessments');
      const assessments = (response.data.assessments || []).map(enrichAssessment);
      
      console.log('📋 Fetched assessments:', assessments);
      
      // Separate CATs and Exams
      const catsData = assessments.filter(a => a.type === 'cats' || a.assessmentType === 'cat');
      const examsData = assessments.filter(a => a.type === 'pastExams' || a.assessmentType === 'exam');
      
      setCats(catsData);
      setExams(examsData);
      
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setError('Failed to load assessments. Please try again.');
      setCats([]);
      setExams([]);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [coursesResponse] = await Promise.allSettled([
        api.get('/api/courses')
      ]);

      // Try to fetch user's submitted assessments (pending approval)
      try {
        const userAssessments = await api.get('/api/admin/my-assessments');
        const assessments = (userAssessments.data.assessments || []).map(enrichAssessment);
        
        // Separate CATs and Exams
        const cats = assessments.filter(a => a.type === 'cats' || a.assessmentType === 'cat');
        const exams = assessments.filter(a => a.type === 'pastExams' || a.assessmentType === 'exam');
        
        setCats(cats);
        setExams(exams);
      } catch (error) {
        console.log('No user assessments endpoint, using empty arrays');
        setCats([]);
        setExams([]);
      }

      // Process Courses
      if (coursesResponse.status === 'fulfilled') {
        setCourses(coursesResponse.value.data.courses || []);
      } else {
        // Mock Courses data
        setCourses([
          {
            _id: 'course1',
            name: 'Computer Science',
            code: 'CS',
            units: [
              {
                _id: 'cs101',
                code: 'CS101',
                unitName: 'Computer Science Fundamentals',
                year: 1,
                semester: 1
              },
              {
                _id: 'cs102',
                code: 'CS102',
                unitName: 'Programming Fundamentals',
                year: 1,
                semester: 2
              }
            ]
          }
        ]);
      }

      // Initialize units - will be loaded when course is selected
      setCourseUnits([]);
      setFilterUnits([]);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Using sample data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitsForCourse = useCallback(async (courseId) => {
    try {
      const response = await api.get(`/api/courses/${courseId}`);
      const course = response.data.course;
      if (course && course.units) {
        const normalized = normalizeUnits(course.units);
        setCourseUnits(normalized);
        setFilterUnits(normalized);
      } else {
        setCourseUnits([]);
        setFilterUnits([]);
      }
    } catch (error) {
      console.error('Error fetching course units:', error);
      // Try to find course in local state
      const selectedCourse = courses.find(c => c._id === courseId);
      if (selectedCourse && selectedCourse.units) {
        const normalized = normalizeUnits(selectedCourse.units);
        setCourseUnits(normalized);
        setFilterUnits(normalized);
      } else {
        setCourseUnits([]);
        setFilterUnits([]);
      }
    }
  }, [courses, normalizeUnits]);

  const handleOpenDialog = (type, context = 'create', assessment = null) => {
    setSelectedType(type);
    setDialogContext(context);
    setEditingAssessment(assessment);

    if (assessment) {
      setFormData({
        title: assessment.title || '',
        courseId: assessment.courseId || '',
        unitId: assessment.unitId || '',
        unitName: assessment.unitName || '',
        description: assessment.description || '',
        dueDate: formatDateTimeLocal(assessment.dueDate),
        totalMarks: assessment.totalMarks || '',
        duration: assessment.duration || '',
        instructions: assessment.instructions || '',
        image: null,
        academicYear: assessment.academicYear || '',
        period: assessment.period || ''
      });
    } else {
      setFormData(createInitialFormState());
    }

    setImagePreview(assessment?.imageUrl || '');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData(createInitialFormState());
    setEditingAssessment(null);
    setDialogContext('create');
    setImagePreview('');
    setError('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Load units when course is selected
    if (field === 'courseId') {
      if (value) {
        fetchUnitsForCourse(value);
      } else {
        setCourseUnits([]);
        setFilterUnits([]);
      }
      // Reset unit selection when course changes
      setFormData(prev => ({
        ...prev,
        unitId: '',
        unitName: '',
        academicYear: prev.academicYear,
        period: prev.period
      }));
    }

    // Auto-fill unit name when unit is selected
    if (field === 'unitId') {
      const selectedUnit = courseUnits.find(unit => unit._id === value);
      if (selectedUnit) {
        setFormData(prev => ({
          ...prev,
          unitId: value,
          unitName: selectedUnit.unitName || selectedUnit.name || prev.unitName
        }));
      }
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.courseId || !formData.unitId || !formData.dueDate || !formData.image) {
        setError('Please fill in all required fields including course, unit, and an assessment image');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('courseId', formData.courseId);
      formDataToSend.append('unitId', formData.unitId);
      formDataToSend.append('unitName', formData.unitName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('dueDate', formData.dueDate);
      formDataToSend.append('totalMarks', formData.totalMarks);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('instructions', formData.instructions);
      formDataToSend.append('assessmentType', selectedType); // cats, assignments, or pastExams
      const academicYear = normalizeAcademicYear(formData.academicYear, formData.dueDate);
      const period = normalizePeriod(formData.period, formData.dueDate);
      formDataToSend.append('academicYear', academicYear);
      formDataToSend.append('period', period);
      formDataToSend.append('file', formData.image); // The assessment file

      // Use the assessment upload endpoint that requires approval
      const endpoint = '/api/upload/assessment';
      const response = await api.post(endpoint, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`${selectedType.toUpperCase()} submitted for approval! It will appear to students once approved by Super Admin.`);
      handleCloseDialog();
      
      // Refresh the assessments list from server instead of using local state
      await fetchAssessments();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error creating CAT/Exam:', error);
      setError(`Failed to create ${selectedType}. Please try again.`);
    }
  };

  const handlePreview = (content) => {
    setPreviewDialog({ open: true, content });
  };

  const handleDuplicateAssessment = (assessment, type) => {
    if (!assessment) return;

    handleOpenDialog(type, 'duplicate', {
      ...assessment,
      title: `${assessment.title} (Copy)`
    });
  };

  const handleEditAssessment = (assessment, type) => {
    if (!assessment) return;

    handleOpenDialog(type, 'edit', assessment);
  };

  const openActionMenu = (event, assessment, type) => {
    setActionMenu({ anchorEl: event.currentTarget, assessment, type });
  };

  const closeActionMenu = () => {
    setActionMenu({ anchorEl: null, assessment: null, type: null });
  };

  const handleMenuAction = (action) => {
    const { assessment, type } = actionMenu;
    if (!assessment || !type) {
      closeActionMenu();
      return;
    }

    closeActionMenu();

    switch (action) {
      case 'preview':
        handlePreview(assessment);
        break;
      case 'edit':
        handleEditAssessment(assessment, type);
        break;
      case 'duplicate':
        handleDuplicateAssessment(assessment, type);
        break;
      case 'publish':
        handleTogglePublish(assessment, type);
        break;
      case 'delete':
        handleDelete(assessment._id, type);
        break;
      default:
        break;
    }
  };

  const handleTogglePublish = async (assessment, type) => {
    if (!assessment) return;

    const nextStatus = assessment.status === 'published' ? 'draft' : 'published';

    try {
      const endpoint = getAssessmentEndpoint(type, `${assessment._id}/publish`);
      await api.patch(endpoint, { status: nextStatus });

      setSuccess(`Assessment ${nextStatus === 'published' ? 'published' : 'set to draft'} successfully.`);
      fetchAssessments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error toggling assessment publish status:', err);
      setError('Failed to update publish status. Please try again.');
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await api.delete(getAssessmentEndpoint(type, id));

        setSuccess(`${type.toUpperCase()} deleted successfully!`);
        fetchAssessments(); // Refresh data
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        setError(`Failed to delete ${type}. Please try again. Error: ${error.message}`);
      }
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'scheduled': return 'info';
      case 'completed': return 'default';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const availableAcademicYears = useMemo(() => {
    const yearSet = new Set();
    [...cats, ...exams].forEach((assessment) => {
      const yearValue = normalizeAcademicYear(assessment.academicYear, assessment.dueDate);
      if (yearValue) {
        yearSet.add(yearValue);
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [cats, exams, normalizeAcademicYear]);

  const availablePeriods = useMemo(() => {
    const periodSet = new Set();
    [...cats, ...exams].forEach((assessment) => {
      const yearMatches = filters.academicYear === 'all'
        ? true
        : normalizeAcademicYear(assessment.academicYear, assessment.dueDate) === filters.academicYear;

      if (!yearMatches) {
        return;
      }

      const periodValue = normalizePeriod(assessment.period, assessment.dueDate);
      if (periodValue) {
        periodSet.add(periodValue);
      }
    });

    return Array.from(periodSet).sort();
  }, [cats, exams, filters.academicYear, normalizeAcademicYear, normalizePeriod]);

  const filteredCats = useMemo(() => {
    return cats.filter((cat) => {
      const matchesCourse = filters.courseId === 'all' || cat.courseId === filters.courseId;
      const matchesUnit = filters.unitId === 'all' || cat.unitId === filters.unitId;
      const matchesYear = filters.academicYear === 'all'
        || normalizeAcademicYear(cat.academicYear, cat.dueDate) === filters.academicYear;
      const matchesPeriod = filters.period === 'all'
        || normalizePeriod(cat.period, cat.dueDate) === filters.period;

      return matchesCourse && matchesUnit && matchesYear && matchesPeriod;
    });
  }, [cats, filters, normalizeAcademicYear, normalizePeriod]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesCourse = filters.courseId === 'all' || exam.courseId === filters.courseId;
      const matchesUnit = filters.unitId === 'all' || exam.unitId === filters.unitId;
      const matchesYear = filters.academicYear === 'all'
        || normalizeAcademicYear(exam.academicYear, exam.dueDate) === filters.academicYear;
      const matchesPeriod = filters.period === 'all'
        || normalizePeriod(exam.period, exam.dueDate) === filters.period;

      return matchesCourse && matchesUnit && matchesYear && matchesPeriod;
    });
  }, [exams, filters, normalizeAcademicYear, normalizePeriod]);

  const groupedCats = useMemo(() => {
    const groups = {};
    filteredCats.forEach((cat) => {
      const academicYear = normalizeAcademicYear(cat.academicYear, cat.dueDate) || 'Unknown Year';
      const period = normalizePeriod(cat.period, cat.dueDate) || 'N/A';
      const course = cat.courseName || cat.courseCode || 'Unassigned Course';
      const unit = cat.unitName || 'Unassigned Unit';

      groups[academicYear] = groups[academicYear] || {};
      groups[academicYear][period] = groups[academicYear][period] || {};
      const unitKey = `${course} • ${unit}`;
      groups[academicYear][period][unitKey] = groups[academicYear][period][unitKey] || [];
      groups[academicYear][period][unitKey].push(cat);
    });
    return groups;
  }, [filteredCats, normalizeAcademicYear, normalizePeriod]);

  const groupedExams = useMemo(() => {
    const groups = {};
    filteredExams.forEach((exam) => {
      const academicYear = normalizeAcademicYear(exam.academicYear, exam.dueDate) || 'Unknown Year';
      const period = normalizePeriod(exam.period, exam.dueDate) || 'N/A';
      const course = exam.courseName || exam.courseCode || 'Unassigned Course';
      const unit = exam.unitName || 'Unassigned Unit';

      groups[academicYear] = groups[academicYear] || {};
      groups[academicYear][period] = groups[academicYear][period] || {};
      const unitKey = `${course} • ${unit}`;
      groups[academicYear][period][unitKey] = groups[academicYear][period][unitKey] || [];
      groups[academicYear][period][unitKey].push(exam);
    });
    return groups;
  }, [filteredExams, normalizeAcademicYear, normalizePeriod]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === 'courseId') {
        next.unitId = 'all';
      }

      return next;
    });

    if (field === 'courseId') {
      if (value !== 'all') {
        fetchUnitsForCourse(value);
      } else {
        setCourseUnits([]);
        setFilterUnits([]);
      }
    }
  };

  const courseOptions = useMemo(() => {
    return courses.map((course) => ({
      id: course._id,
      label: `${course.code} - ${course.name}`
    }));
  }, [courses]);

  const unitOptions = useMemo(() => {
    if (filters.courseId === 'all') {
      return filterUnits;
    }

    return filterUnits.filter((unit) => {
      const matchesCourse = unit.courseId === filters.courseId || unit.course === filters.courseId;
      if (!matchesCourse) return false;

      const matchesYear = filters.academicYear === 'all' || String(unit.year) === String(filters.academicYear.split('/')[0]);
      const matchesPeriod = filters.period === 'all' || String(unit.semester) === String(filters.period);

      return matchesYear && matchesPeriod;
    });
  }, [filterUnits, filters.courseId, filters.academicYear, filters.period]);

  const groupedUnitOptions = useMemo(() => {
    return unitOptions.reduce((acc, unit) => {
      const groupKey = `Year ${unit.year} • ${unit.semester === 1 ? 'Semester 1' : unit.semester === 2 ? 'Semester 2' : `Term ${unit.semester}`}`;
      acc[groupKey] = acc[groupKey] || [];
      acc[groupKey].push(unit);
      return acc;
    }, {});
  }, [unitOptions]);

  const groupedCourseUnits = useMemo(() => {
    return courseUnits.reduce((acc, unit) => {
      const groupKey = `Year ${unit.year} • ${unit.semester === 1 ? 'Semester 1' : unit.semester === 2 ? 'Semester 2' : `Term ${unit.semester}`}`;
      acc[groupKey] = acc[groupKey] || [];
      acc[groupKey].push(unit);
      return acc;
    }, {});
  }, [courseUnits]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          📝 CATs & Exams Management
          <SecurityIcon color="error" />
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create and manage secure CATs and Exams with image-based questions. All images are protected against screenshots.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card variant="outlined" sx={{ p: 2, mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Filter assessments
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                label="Course"
                value={filters.courseId}
                onChange={(e) => handleFilterChange('courseId', e.target.value)}
              >
                <MenuItem value="all">All courses</MenuItem>
                {courseOptions.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl
              fullWidth
              size="small"
              disabled={filters.courseId === 'all' && unitOptions.length === 0}
            >
              <InputLabel>Unit</InputLabel>
              <Select
                label="Unit"
                value={filters.unitId}
                onChange={(e) => handleFilterChange('unitId', e.target.value)}
                renderValue={(selected) => {
                  if (selected === 'all') {
                    return 'All units';
                  }

                  const selectedUnit = unitOptions.find((unit) => unit._id === selected);
                  if (!selectedUnit) {
                    return 'Select a unit';
                  }

                  const baseLabel = selectedUnit.code
                    ? `${selectedUnit.code} - ${selectedUnit.unitName || selectedUnit.name}`
                    : selectedUnit.unitName || selectedUnit.name;

                  return `${baseLabel} • Year ${selectedUnit.year}, ${selectedUnit.semester === 1 ? 'Semester 1' : selectedUnit.semester === 2 ? 'Semester 2' : `Term ${selectedUnit.semester}`}`;
                }}
              >
                <MenuItem value="all">All units</MenuItem>
                {Object.keys(groupedUnitOptions).length === 0 && (
                  <MenuItem disabled value="__no_units">
                    No units available. Select a course first.
                  </MenuItem>
                )}
                {Object.entries(groupedUnitOptions).map(([groupLabel, unitsInGroup]) => (
                  <React.Fragment key={`filter-${groupLabel}`}>
                    <ListSubheader disableSticky>{groupLabel}</ListSubheader>
                    {unitsInGroup.map((unit) => (
                      <MenuItem key={unit._id} value={unit._id}>
                        {unit.code ? `${unit.code} - ` : ''}{unit.unitName || unit.name}
                      </MenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select
                label="Academic Year"
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
              >
                <MenuItem value="all">All academic years</MenuItem>
                {availableAcademicYears.map((yearOption) => (
                  <MenuItem key={yearOption} value={yearOption}>
                    {yearOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small" disabled={availablePeriods.length === 0}>
              <InputLabel>Semester / Term</InputLabel>
              <Select
                label="Semester / Term"
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
              >
                <MenuItem value="all">All periods</MenuItem>
                {availablePeriods.map((periodOption) => (
                  <MenuItem key={periodOption} value={periodOption}>
                    {periodOption === '1' ? 'Semester 1' : periodOption === '2' ? 'Semester 2' : `Period ${periodOption}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Create New Assessment
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<QuizIcon />}
                onClick={() => handleOpenDialog('cat')}
                fullWidth
              >
                Create CAT
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AssignmentIcon />}
                onClick={() => handleOpenDialog('exam')}
                fullWidth
              >
                Create Exam
              </Button>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="success.main">
              📊 Quick Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">{cats.length}</Typography>
                  <Typography variant="caption">Active CATs</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">{exams.length}</Typography>
                  <Typography variant="caption">Scheduled Exams</Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`CATs (${cats.length})`} icon={<QuizIcon />} />
          <Tab label={`Exams (${exams.length})`} icon={<AssignmentIcon />} />
        </Tabs>

        <CardContent>
          {/* CATs Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📋 Continuous Assessment Tests (CATs)
              </Typography>
              {filteredCats.length === 0 ? (
                <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                  <QuizIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No CATs Created Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create your first CAT to get started with assessments.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('cat')}
                  >
                    Create First CAT
                  </Button>
                </Card>
              ) : (
                Object.keys(groupedCats).sort((a, b) => b.localeCompare(a)).map((yearKey) => (
                  <Card key={yearKey} variant="outlined" sx={{ mb: 3 }}>
                    <CardHeader
                      title={`Academic Year ${yearKey}`}
                      subheader={`${Object.keys(groupedCats[yearKey]).length} term${Object.keys(groupedCats[yearKey]).length > 1 ? 's' : ''}`}
                    />
                    <CardContent sx={{ pt: 0 }}>
                      <Grid container spacing={2}>
                        {Object.keys(groupedCats[yearKey]).sort().map((periodKey) => (
                          <Grid item xs={12} key={periodKey}>
                            <Card variant="outlined" sx={{ borderColor: 'primary.light' }}>
                              <CardHeader
                                title={periodKey === '1' ? 'Semester 1' : periodKey === '2' ? 'Semester 2' : `Academic Period ${periodKey}`}
                                subheader={`${Object.keys(groupedCats[yearKey][periodKey]).length} unit${Object.keys(groupedCats[yearKey][periodKey]).length > 1 ? 's' : ''}`}
                              />
                              <CardContent sx={{ pt: 1 }}>
                                <Grid container spacing={2}>
                                  {Object.keys(groupedCats[yearKey][periodKey]).map((unitKey) => (
                                    <Grid item xs={12} md={6} key={unitKey}>
                                      <Card variant="outlined">
                                        <CardHeader
                                          title={unitKey}
                                          subheader={`${groupedCats[yearKey][periodKey][unitKey].length} CAT${groupedCats[yearKey][periodKey][unitKey].length > 1 ? 's' : ''}`}
                                          avatar={<SchoolIcon color="primary" />}
                                        />
                                        <CardContent sx={{ pt: 0 }}>
                                          <List dense disablePadding>
                                            {groupedCats[yearKey][periodKey][unitKey].map((cat) => (
                                              <ListItem
                                                key={cat._id}
                                                sx={{
                                                  alignItems: 'flex-start',
                                                  borderBottom: '1px dashed',
                                                  borderColor: 'divider',
                                                  '&:last-of-type': { borderBottom: 'none' },
                                                  py: 1.5
                                                }}
                                              >
                                                <ListItemAvatar>
                                                  <Avatar>
                                                    <QuizIcon fontSize="small" />
                                                  </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                  primary={
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {cat.title}
                                                      </Typography>
                                                      <Chip
                                                        label={cat.status?.toUpperCase() || 'Pending'}
                                                        color={getStatusColor(cat.status)}
                                                        size="small"
                                                      />
                                                    </Stack>
                                                  }
                                                  secondary={
                                                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                                                      <Typography variant="caption" color="text.secondary">
                                                        📚 {cat.unitName}
                                                      </Typography>
                                                      <Typography variant="caption" color="text.secondary">
                                                        📅 Scheduled {formatDate(cat.dueDate)} • ⏱️ {cat.duration || '--'} min • 📊 {cat.totalMarks || '--'} marks
                                                      </Typography>
                                                      {cat.description && (
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                          {cat.description}
                                                        </Typography>
                                                      )}
                                                    </Stack>
                                                  }
                                                />
                                                <ListItemSecondaryAction>
                                                  <Tooltip title="Actions">
                                                    <IconButton
                                                      edge="end"
                                                      onClick={(e) => openActionMenu(e, cat, 'cat')}
                                                    >
                                                      <MoreVertIcon />
                                                    </IconButton>
                                                  </Tooltip>
                                                </ListItemSecondaryAction>
                                              </ListItem>
                                            ))}
                                          </List>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}

          {/* Exams Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📝 Final Examinations
              </Typography>
              {filteredExams.length === 0 ? (
                <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Exams Scheduled Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Schedule your first exam to begin final assessments.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('exam')}
                  >
                    Schedule First Exam
                  </Button>
                </Card>
              ) : (
                Object.keys(groupedExams).sort((a, b) => b.localeCompare(a)).map((yearKey) => (
                  <Card key={yearKey} variant="outlined" sx={{ mb: 3 }}>
                    <CardHeader
                      title={`Academic Year ${yearKey}`}
                      subheader={`${Object.keys(groupedExams[yearKey]).length} term${Object.keys(groupedExams[yearKey]).length > 1 ? 's' : ''}`}
                    />
                    <CardContent sx={{ pt: 0 }}>
                      <Grid container spacing={2}>
                        {Object.keys(groupedExams[yearKey]).sort().map((periodKey) => (
                          <Grid item xs={12} key={periodKey}>
                            <Card variant="outlined" sx={{ borderColor: 'secondary.light' }}>
                              <CardHeader
                                title={periodKey === '1' ? 'Semester 1' : periodKey === '2' ? 'Semester 2' : `Examination Period ${periodKey}`}
                                subheader={`${Object.keys(groupedExams[yearKey][periodKey]).length} unit${Object.keys(groupedExams[yearKey][periodKey]).length > 1 ? 's' : ''}`}
                              />
                              <CardContent sx={{ pt: 1 }}>
                                <Grid container spacing={2}>
                                  {Object.keys(groupedExams[yearKey][periodKey]).map((unitKey) => (
                                    <Grid item xs={12} md={6} key={unitKey}>
                                      <Card variant="outlined">
                                        <CardHeader
                                          title={unitKey}
                                          subheader={`${groupedExams[yearKey][periodKey][unitKey].length} Exam${groupedExams[yearKey][periodKey][unitKey].length > 1 ? 's' : ''}`}
                                          avatar={<AssignmentIcon color="secondary" />}
                                        />
                                        <CardContent sx={{ pt: 0 }}>
                                          <List dense disablePadding>
                                            {groupedExams[yearKey][periodKey][unitKey].map((exam) => (
                                              <ListItem
                                                key={exam._id}
                                                sx={{
                                                  alignItems: 'flex-start',
                                                  borderBottom: '1px dashed',
                                                  borderColor: 'divider',
                                                  '&:last-of-type': { borderBottom: 'none' },
                                                  py: 1.5
                                                }}
                                              >
                                                <ListItemAvatar>
                                                  <Avatar>
                                                    <AssignmentIcon fontSize="small" />
                                                  </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                  primary={
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {exam.title}
                                                      </Typography>
                                                      <Chip
                                                        label={exam.status?.toUpperCase() || 'Pending'}
                                                        color={getStatusColor(exam.status)}
                                                        size="small"
                                                      />
                                                    </Stack>
                                                  }
                                                  secondary={
                                                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                                                      <Typography variant="caption" color="text.secondary">
                                                        📚 {exam.unitName}
                                                      </Typography>
                                                      <Typography variant="caption" color="text.secondary">
                                                        📅 Scheduled {formatDate(exam.dueDate)} • ⏱️ {exam.duration || '--'} min • 📊 {exam.totalMarks || '--'} marks
                                                      </Typography>
                                                      {exam.description && (
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                          {exam.description}
                                                        </Typography>
                                                      )}
                                                    </Stack>
                                                  }
                                                />
                                                <ListItemSecondaryAction>
                                                  <Tooltip title="Actions">
                                                    <IconButton edge="end" onClick={(e) => openActionMenu(e, exam, 'exam')}>
                                                      <MoreVertIcon />
                                                    </IconButton>
                                                  </Tooltip>
                                                </ListItemSecondaryAction>
                                              </ListItem>
                                            ))}
                                          </List>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={closeActionMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleMenuAction('preview')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Preview" />
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('duplicate')}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Duplicate" />
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('publish')}>
          <ListItemIcon>
            {actionMenu.assessment?.status === 'published' ? (
              <UnpublishIcon fontSize="small" color="warning" />
            ) : (
              <PublishIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText primary={actionMenu.assessment?.status === 'published' ? 'Unpublish' : 'Publish'} />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleMenuAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Create CAT/Exam Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedType === 'cat' ? '📋 Create New CAT' : '📝 Schedule New Exam'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={`Enter ${selectedType} title`}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Course</InputLabel>
                <Select
                  value={formData.courseId}
                  onChange={(e) => handleInputChange('courseId', e.target.value)}
                  label="Course"
                >
                  {courses.map((course) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.code} - {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!formData.courseId}>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unitId}
                  onChange={(e) => handleInputChange('unitId', e.target.value)}
                  label="Unit"
                  renderValue={(selected) => {
                    if (!selected) {
                      return 'Select unit';
                    }

                    const selectedUnit = courseUnits.find((unit) => unit._id === selected);
                    if (!selectedUnit) {
                      return 'Select unit';
                    }

                    const baseLabel = selectedUnit.code
                      ? `${selectedUnit.code} - ${selectedUnit.unitName || selectedUnit.name}`
                      : selectedUnit.unitName || selectedUnit.name;

                    return `${baseLabel} • Year ${selectedUnit.year}, ${selectedUnit.semester === 1 ? 'Semester 1' : selectedUnit.semester === 2 ? 'Semester 2' : `Term ${selectedUnit.semester}`}`;
                  }}
                >
                  {courseUnits.length === 0 && (
                    <MenuItem disabled value="">
                      {formData.courseId ? 'No units available for this course' : 'Select a course first'}
                    </MenuItem>
                  )}
                  {Object.entries(groupedCourseUnits).map(([groupLabel, unitsInGroup]) => (
                    <React.Fragment key={`dialog-${groupLabel}`}>
                      <ListSubheader disableSticky>{groupLabel}</ListSubheader>
                      {unitsInGroup.map((unit) => (
                        <MenuItem key={unit._id} value={unit._id}>
                          {unit.code ? `${unit.code} - ` : ''}{unit.unitName || unit.name}
                        </MenuItem>
                      ))}
                    </React.Fragment>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date & Time"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Marks"
                type="number"
                value={formData.totalMarks}
                onChange={(e) => handleInputChange('totalMarks', e.target.value)}
                placeholder="100"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="60"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadIcon />}
                sx={{ height: '56px' }}
              >
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the assessment"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={3}
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Special instructions for students"
              />
            </Grid>
            
            {imagePreview && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Image Preview:
                </Typography>
                <Box sx={{ 
                  border: 1, 
                  borderColor: 'grey.300', 
                  borderRadius: 1, 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'grey.50'
                }}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px',
                      objectFit: 'contain'
                    }} 
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.title || !formData.unitId || !formData.dueDate || !formData.image}
          >
            Create {selectedType.toUpperCase()}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, content: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {previewDialog.content?.assessmentType?.toUpperCase() || previewDialog.content?.type?.toUpperCase()} Preview: {previewDialog.content?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Course: {previewDialog.content?.courseName || 'Unknown Course'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Unit: {previewDialog.content?.unitName || 'Unknown Unit'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Marks: {previewDialog.content?.totalMarks || 'Not specified'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Duration: {previewDialog.content?.duration || 'Not specified'} minutes
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Status: {previewDialog.content?.status || 'Pending Approval'}
          </Typography>
          
          {previewDialog.content?.description && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Description:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {previewDialog.content.description}
              </Typography>
            </>
          )}

          {previewDialog.content?.instructions && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Instructions:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {previewDialog.content.instructions}
              </Typography>
            </>
          )}

          {previewDialog.content?.filename && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Assessment File:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📄 {previewDialog.content.filename}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, content: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CATsExamsManagement;
