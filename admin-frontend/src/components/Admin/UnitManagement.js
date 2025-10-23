import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SchoolIcon from '@mui/icons-material/School';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UploadIcon from '@mui/icons-material/Upload';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import TopicManagement from './TopicManagement';

const UnitManagement = ({ program, institution, userRole = 'mini_admin', onBack, selectedSubcourse = '' }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [managementView, setManagementView] = useState('units'); // 'units', 'topics'
  const [catDialog, setCatDialog] = useState(false);
  const [examDialog, setExamDialog] = useState(false);
  const [selectedUnitForAssessment, setSelectedUnitForAssessment] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [yearFormData, setYearFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false
  });
  const [savingYear, setSavingYear] = useState(false);
  const [yearDialogError, setYearDialogError] = useState('');
  const [formData, setFormData] = useState({
    year: 1,
    semester: 1,
    subcourse: selectedSubcourse || '',
    unitCode: '',
    unitName: '',
    creditHours: 3,
    description: '',
    prerequisites: [],
    academicYear: ''
  });
  const [catFormData, setCatFormData] = useState({
    title: '',
    description: '',
    totalMarks: 30,
    duration: 60,
    instructions: '',
    image: null,
    questions: [],
    academicYear: ''
  });
  const [examFormData, setExamFormData] = useState({
    title: '',
    description: '',
    totalMarks: 100,
    duration: 180,
    instructions: '',
    image: null,
    questions: [],
    academicYear: ''
  });
  const [catImagePreview, setCatImagePreview] = useState('');
  const [examImagePreview, setExamImagePreview] = useState('');

  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    if (program) {
      fetchUnits();
      fetchAcademicYears();
    }
  }, [program]);

  const fetchAcademicYears = useCallback(async () => {
    if (!program?._id) {
      return;
    }

    try {
      const response = await api.get(`/api/courses/${program._id}`);
      const years = response.data?.course?.academicYears || [];
    } catch (error) {
      console.error('Error fetching academic years:', error.response?.data || error.message || error);
    }
  }, [program?._id]);

  const fallbackAcademicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2019;
    const options = [];

    for (let year = startYear; year <= currentYear; year += 1) {
      options.push({
        _id: `fallback-${year}`,
        name: `${year}/${year + 1}`,
        isActive: false
      });
    }

    if (options.length > 0) {
      options[options.length - 1].isActive = true;
    }

    return options;
  }, []);

  const academicYearOptions = academicYears.length > 0 ? academicYears : fallbackAcademicYearOptions;
  const academicYearOptionsAvailable = academicYearOptions.length > 0;
  const usingFallbackAcademicYears = academicYears.length === 0;

  const getDefaultAcademicYearName = useCallback(() => {
    if (!academicYearOptionsAvailable) {
      return '';
    }

    const activeYear = academicYearOptions.find((year) => year.isActive);
    return activeYear?.name || academicYearOptions[0].name || '';
  }, [academicYearOptionsAvailable, academicYearOptions]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the full course data to get updated units with embedded topics
      const response = await api.get(`/api/courses/${program._id}`);
      const courseUnits = response.data.course.units || [];
      
      const enrichedUnits = await Promise.all(courseUnits.map(async (embeddedUnit) => {
        let assessments = [];
        let topics = [];
        
        try {
          // Fetch assessments for this unit
          if (embeddedUnit.assessmentIds && embeddedUnit.assessmentIds.length > 0) {
            const assessRes = await api.get(`/api/assessments?unitId=${embeddedUnit._id}`);
            assessments = assessRes.data.assessments || [];
          }
        } catch (e) {
          console.warn('Failed to fetch assessments for unit:', embeddedUnit._id, e);
        }
        
        try {
          // Fetch topics from the course endpoint which includes topics
          const topicRes = await api.get(`/api/courses/${program._id}/units/${embeddedUnit._id}/topics`);
          topics = topicRes.data.topics || [];
        } catch (e) {
          // Silently fallback to embedded topics if API endpoint doesn't exist or fails
          topics = embeddedUnit.topics || [];
        }
        
        return { 
          ...embeddedUnit, 
          assessments: { 
            cats: assessments.filter(a => a.type === 'cat'),
            assignments: assessments.filter(a => a.type === 'assignment'),
            pastExams: assessments.filter(a => a.type === 'pastExam')
          },
          topics 
        };
      }));
      
      setUnits(enrichedUnits);
    } catch (error) {
      console.error('Error fetching units:', error);
      setError('Failed to load units. Please try again.');
      // Fallback to program units if API fails
      setUnits(program.units || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!openDialog && !editingUnit) {
      setFormData(prev => ({
        ...prev,
        subcourse: selectedSubcourse || ''
      }));
    }
  }, [selectedSubcourse, openDialog, editingUnit]);

  const scheduleTypeRaw = typeof program?.scheduleType === 'string'
    ? program.scheduleType.toLowerCase()
    : (typeof program?.duration?.scheduleType === 'string' ? program.duration.scheduleType.toLowerCase() : undefined);
  const normalizedPeriods = Number.isInteger(program?.duration?.semesters)
    ? program.duration.semesters
    : (Number.isInteger(program?.duration?.terms) ? program.duration.terms : undefined);
  const normalizedYears = Number.isInteger(program?.duration?.years) && program.duration.years > 0
    ? program.duration.years
    : undefined;
  const inferredTerms = normalizedYears && normalizedPeriods
    ? (normalizedPeriods / normalizedYears) >= 3
    : false;
  const isTermSchedule = scheduleTypeRaw === 'term' || inferredTerms;
  const periodLabelSingular = isTermSchedule ? 'Term' : 'Semester';
  const periodLabelPlural = isTermSchedule ? 'Terms' : 'Semesters';

  const safeTotalYears = Number.isInteger(program?.duration?.years) && program.duration.years > 0
    ? program.duration.years
    : 1;
  const rawTotalPeriods = isTermSchedule
    ? (Number.isInteger(program?.duration?.terms) && program.duration.terms > 0
      ? program.duration.terms
      : program?.duration?.semesters)
    : (Number.isInteger(program?.duration?.semesters) && program.duration.semesters > 0
      ? program.duration.semesters
      : program?.duration?.terms);
  const safeTotalSemesters = Number.isInteger(rawTotalPeriods) && rawTotalPeriods > 0
    ? rawTotalPeriods
    : safeTotalYears * (isTermSchedule ? 3 : 2);
  const baseTermsPerYear = Math.floor(safeTotalSemesters / safeTotalYears);
  const extraTermYears = safeTotalSemesters % safeTotalYears;
  const fallbackTermsPerYear = baseTermsPerYear > 0 ? baseTermsPerYear : 1;

  const getSemestersForYear = (year) => {
    const normalizedYearIndex = Math.max(0, Math.min(Number(year) - 1, safeTotalYears - 1));
    const distributedTerms = baseTermsPerYear + (normalizedYearIndex < extraTermYears ? 1 : 0);
    const termCount = Math.max(distributedTerms, fallbackTermsPerYear, 1);
    return Array.from({ length: termCount }, (_, idx) => idx + 1);
  };

  const normalizeSemester = (year, semester) => {
    const numericSemester = parseInt(semester, 10);
    const available = getSemestersForYear(year);
    if (Number.isInteger(numericSemester) && available.includes(numericSemester)) {
      return numericSemester;
    }
    return available[0] || 1;
  };

  const handleOpenDialog = (unit = null) => {
    if (unit) {
      const normalizedYear = unit.year || 1;
      setEditingUnit(unit);
      setFormData({
        year: normalizedYear,
        semester: normalizeSemester(normalizedYear, unit.semester || 1),
        subcourse: unit.subcourse || '',
        unitCode: unit.unitCode || '',
        unitName: unit.unitName || '',
        creditHours: unit.creditHours || 3,
        description: unit.description || '',
        prerequisites: unit.prerequisites || [],
        academicYear: unit.academicYear || getDefaultAcademicYearName()
      });
    } else {
      setEditingUnit(null);
      const defaultYear = 1;
      setFormData({
        year: defaultYear,
        semester: normalizeSemester(defaultYear, 1),
        subcourse: selectedSubcourse || '',
        unitCode: '',
        unitName: '',
        creditHours: 3,
        description: '',
        prerequisites: [],
        academicYear: getDefaultAcademicYearName()
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUnit(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      if (field === 'year') {
        const parsedValue = parseInt(value, 10);
        if (Number.isNaN(parsedValue)) {
          return {
            ...prev,
            year: ''
          };
        }
        return {
          ...prev,
          year: parsedValue,
          semester: normalizeSemester(parsedValue, prev.semester)
        };
      }

      if (field === 'semester') {
        return {
          ...prev,
          semester: normalizeSemester(prev.year || 1, value)
        };
      }

      if (field === 'creditHours') {
        const parsedValue = parseInt(value, 10);
        return {
          ...prev,
          creditHours: Number.isNaN(parsedValue) ? '' : parsedValue
        };
      }

      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handlePrerequisitesChange = (value) => {
    const prerequisites = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      prerequisites: prerequisites
    }));
  };

  // CAT and Exam Management Functions
  const handleOpenCatDialog = (unit) => {
    const defaultYear = getDefaultAcademicYearName();
    setSelectedUnitForAssessment(unit);
    setCatFormData({
      title: `${unit.unitCode} - CAT`,
      description: `Continuous Assessment Test for ${unit.unitName}`,
      totalMarks: 30,
      duration: 60,
      instructions: 'Answer all questions. Show all working clearly.',
      image: null,
      questions: [],
      academicYear: defaultYear
    });
    setCatImagePreview('');
    setCatDialog(true);
  };

  const handleOpenExamDialog = (unit) => {
    const defaultYear = getDefaultAcademicYearName();
    setSelectedUnitForAssessment(unit);
    setExamFormData({
      title: `${unit.unitCode} - Final Exam`,
      description: `Final Examination for ${unit.unitName}`,
      totalMarks: 100,
      duration: 180,
      instructions: 'Answer all questions. Show all working clearly.',
      image: null,
      questions: [],
      academicYear: defaultYear
    });
    setExamImagePreview('');
    setExamDialog(true);
  };

  const handleCloseCatDialog = () => {
    setCatDialog(false);
    setSelectedUnitForAssessment(null);
    setCatImagePreview('');
  };

  const handleCloseExamDialog = () => {
    setExamDialog(false);
    setSelectedUnitForAssessment(null);
    setExamImagePreview('');
  };

  const handleCatInputChange = (field, value) => {
    setCatFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExamInputChange = (field, value) => {
    setExamFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateAndPreviewImage = (file, setPreview) => {
    if (!file) {
      return false;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Image size must be less than 5MB.');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result || '');
    };
    reader.readAsDataURL(file);
    setError(null);
    return true;
  };

  const handleCatImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (validateAndPreviewImage(file, setCatImagePreview)) {
      setCatFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleExamImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (validateAndPreviewImage(file, setExamImagePreview)) {
      setExamFormData(prev => ({ ...prev, image: file }));
    }
  };

  const submitAssessment = async (formValues, type, endpoint, unitContext) => {
    if (!unitContext) {
      throw new Error('Unit context is required to submit an assessment.');
    }

    const selectedAcademicYear = formValues.academicYear || getDefaultAcademicYearName();
    if (!selectedAcademicYear) {
      throw new Error('Please set up an academic year for this course before creating assessments.');
    }

    const baseFields = {
      unitId: unitContext._id,
      unitCode: unitContext.unitCode,
      unitName: unitContext.unitName,
      courseId: program._id,
      courseName: program.name,
      institutionId: institution._id,
      institutionName: institution.name
    };

    const sharedFields = {
      title: formValues.title,
      description: formValues.description || '',
      totalMarks: formValues.totalMarks,
      duration: formValues.duration,
      instructions: formValues.instructions || '',
      questions: formValues.questions ?? [],
      type,
      academicYear: selectedAcademicYear,
      ...baseFields
    };

    if (formValues.image) {
      const formDataPayload = new FormData();
      Object.entries(sharedFields).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formDataPayload.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formDataPayload.append(key, value.toString());
        }
      });
      formDataPayload.append('image', formValues.image);

      await api.post(endpoint, formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return;
    }

    await api.post(endpoint, sharedFields);
  };

  const handleSubmitCat = async () => {
    if (!selectedUnitForAssessment) {
      setError('Please select a unit before creating a CAT.');
      return;
    }

    const selectedYear = catFormData.academicYear || getDefaultAcademicYearName();
    if (!selectedYear) {
      setError('Please add an academic year for this course before creating a CAT.');
      return;
    }

    try {
      const endpoint = `/api/courses/${program._id}/units/${selectedUnitForAssessment._id}/assessments/cats`;
      await submitAssessment(catFormData, 'cat', endpoint, selectedUnitForAssessment);

      await fetchUnits();
      handleCloseCatDialog();
      setError(null);
      alert('CAT created successfully!');
    } catch (error) {
      console.error('Error creating CAT:', error);
      setError('Failed to create CAT. Please try again.');
    }
  };

  const handleSubmitExam = async () => {
    if (!selectedUnitForAssessment) {
      setError('Please select a unit before creating an exam.');
      return;
    }

    const selectedYear = examFormData.academicYear || getDefaultAcademicYearName();
    if (!selectedYear) {
      setError('Please add an academic year for this course before creating an exam.');
      return;
    }

    try {
      const endpoint = `/api/courses/${program._id}/units/${selectedUnitForAssessment._id}/assessments/pastExams`;
      await submitAssessment(examFormData, 'exam', endpoint, selectedUnitForAssessment);

      await fetchUnits();
      handleCloseExamDialog();
      setError(null);
      alert('Exam created successfully!');
    } catch (error) {
      console.error('Error creating Exam:', error);
      setError('Failed to create Exam. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const year = parseInt(formData.year, 10);
      const semester = parseInt(formData.semester, 10);
      const creditHours = parseInt(formData.creditHours, 10);
      const trimmedUnitCode = formData.unitCode?.trim().toUpperCase();
      const academicYearName = formData.academicYear || getDefaultAcademicYearName();

      if (!Number.isInteger(year) || year < 1 || year > (program.duration?.years || 6)) {
        setError('Please select a valid year for this program.');
        return;
      }

      const availableSemesters = getSemestersForYear(year);
      if (!Number.isInteger(semester) || !availableSemesters.includes(semester)) {
        setError(`${periodLabelSingular} must be between 1 and ${availableSemesters.length} for Year ${year}.`);
        return;
      }

      if (!Number.isInteger(creditHours) || creditHours < 1 || creditHours > 6) {
        setError('Credit hours must be a whole number between 1 and 6.');
        return;
      }

      if (!trimmedUnitCode) {
        setError('Unit code is required.');
        return;
      }

      if (!trimmedUnitName) {
        setError('Unit name is required.');
        return;
      }

      if (!academicYearName) {
        setError('Please select an academic year for this unit.');
        return;
      }

      const duplicateUnit = units.some(unit => {
        const unitSubcourse = (unit.subcourse || '').trim().toLowerCase();
        const isSameCode = unit.unitCode?.toUpperCase() === trimmedUnitCode;
        const isSameSubcourse = unitSubcourse === normalizedSubcourse;
        const isDifferentUnit = !editingUnit || unit._id !== editingUnit._id;
        return isSameCode && isSameSubcourse && isDifferentUnit;
      });

      if (duplicateUnit) {
        setError('A unit with this code already exists in this subcourse. Please use a unique unit code within each subcourse.');
        return;
      }

      const unitData = {
        ...formData,
        year,
        semester: normalizeSemester(year, semester),
        creditHours,
        unitCode: trimmedUnitCode,
        unitName: trimmedUnitName,
        subcourse: formData.subcourse?.trim() || '',
        description: formData.description?.trim() || '',
        prerequisites: Array.isArray(formData.prerequisites)
          ? formData.prerequisites.map(item => item.trim()).filter(Boolean)
          : [],
        academicYear: academicYearName
      };

      if (editingUnit) {
        await api.put(`/api/courses/${program._id}/units/${editingUnit._id}`, unitData);
      } else {
        await api.post(`/api/courses/${program._id}/units`, unitData);
      }
      
      await fetchUnits();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving unit:', error.response?.data || error.message || error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (Array.isArray(error.response?.data?.errors)) {
        const messages = error.response.data.errors
          .map(err => err.msg)
          .filter(Boolean)
          .join(' ');
        setError(messages || 'Failed to save unit. Please review the form.');
      } else {
        setError('Failed to save unit. Please try again.');
      }
    }
  };

  const handleDelete = async (unitId) => {
    if (window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      try {
        await api.delete(`/api/courses/${program._id}/units/${unitId}`);
        await fetchUnits();
      } catch (error) {
        console.error('Error deleting unit:', error);
        setError('Failed to delete unit. Please try again.');
      }
    }
  };

  const filteredUnits = selectedSubcourse
    ? units.filter(unit => unit.subcourse === selectedSubcourse)
    : units;

  const groupedUnits = filteredUnits.reduce((acc, unit) => {
    const year = unit.year || 1;
    const semester = unit.semester || 1;

    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][semester]) {
      acc[year][semester] = [];
    }

    acc[year][semester].push(unit);
    return acc;
  }, {});

  const getYearArray = () => {
    return Array.from({ length: safeTotalYears }, (_, i) => i + 1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show topic management if a unit is selected
  if (managementView === 'topics' && selectedUnit) {
    return (
      <TopicManagement 
        unit={selectedUnit}
        program={program}
        institution={institution}
        userRole={userRole}
        onBack={() => {
          setManagementView('units');
          setSelectedUnit(null);
        }}
      />
    );
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h2" color="primary" sx={{ fontWeight: 600 }}>
              Unit Management - {program.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {program.code} • {institution.shortName}
              {selectedSubcourse ? ` • ${selectedSubcourse}` : ''} • {filteredUnits.length} units
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2 }}
          >
            Add Unit
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Program Overview */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <SchoolIcon sx={{ fontSize: 40 }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h6">{program.name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {program.level} • {program.duration?.years} Years • {(isTermSchedule ? (program.duration?.terms ?? program.duration?.semesters) : (program.duration?.semesters ?? program.duration?.terms)) || safeTotalSemesters} {periodLabelPlural}
              </Typography>
            </Grid>
            <Grid item>
              <Box textAlign="center">
                <Typography variant="h4">{units.length}</Typography>
                <Typography variant="body2">Total Units</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Units by Year */}
        {getYearArray().map((year) => (
          <Accordion key={year} defaultExpanded={year === 1}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">
                Year {year}
              </Typography>
              <Chip 
                label={`${Object.keys(groupedUnits[year] || {}).reduce((total, sem) => 
                  total + (groupedUnits[year][sem]?.length || 0), 0)} units`}
                size="small" 
                sx={{ ml: 2 }}
              />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {Array.from(new Set([
                  ...getSemestersForYear(year),
                  ...Object.keys(groupedUnits[year] || {}).map(Number)
                ])).sort((a, b) => a - b).map((semester) => (
                  <Grid item xs={12} md={6} key={semester}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 600 }}>
                          {periodLabelSingular} {semester}
                        </Typography>
                        <Chip 
                          label={`${groupedUnits[year]?.[semester]?.length || 0} units`}
                          size="small"
                          color="secondary"
                        />
                      </Box>
                      
                      {groupedUnits[year]?.[semester]?.length > 0 ? (
                        <List dense>
                          {groupedUnits[year][semester].map((unit, index) => (
                            <React.Fragment key={unit._id || index}>
                              <ListItem
                                secondaryAction={
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenCatDialog(unit)}
                                      color="success"
                                      title="Create CAT"
                                      sx={{ bgcolor: 'success.light', color: 'white', '&:hover': { bgcolor: 'success.main' } }}
                                    >
                                      <QuizIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenExamDialog(unit)}
                                      color="warning"
                                      title="Create Exam"
                                      sx={{ bgcolor: 'warning.light', color: 'white', '&:hover': { bgcolor: 'warning.main' } }}
                                    >
                                      <AssignmentIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedUnit(unit);
                                        setManagementView('topics');
                                      }}
                                      color="secondary"
                                      title="Manage Topics & Content"
                                    >
                                      <VideoLibraryIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenDialog(unit)}
                                      color="primary"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDelete(unit._id)}
                                      color="error"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Box>
                                }
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {unit.unitCode}
                                      </Typography>
                                      <Chip
                                        label={`${unit.creditHours} CH`}
                                        size="small"
                                        color="info"
                                      />
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2">
                                        {unit.unitName}
                                      </Typography>
                                      {unit.description && (
                                        <Typography variant="caption" color="text.secondary">
                                          {unit.description.substring(0, 100)}
                                          {unit.description.length > 100 && '...'}
                                        </Typography>
                                      )}
                                      {unit.prerequisites && unit.prerequisites.length > 0 && (
                                        <Typography variant="caption" color="warning.main" display="block">
                                          Prerequisites: {unit.prerequisites.join(', ')}
                                        </Typography>
                                      )}
                                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Chip
                                          label={`${unit.assessments?.cats?.length || 0} CATs`}
                                          size="small"
                                          color="success"
                                          variant="outlined"
                                        />
                                        <Chip
                                          label={`${unit.assessments?.pastExams?.length || 0} Exams`}
                                          size="small"
                                          color="warning"
                                          variant="outlined"
                                        />
                                        <Chip
                                          label={`${unit.topics?.length || 0} Topics`}
                                          size="small"
                                          color="info"
                                          variant="outlined"
                                        />
                                      </Box>
                                    </Box>
                                  }
                                />
                              </ListItem>
                              {index < groupedUnits[year][semester].length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <MenuBookIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No units added for this term
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                year,
                                semester: normalizeSemester(year, semester)
                              }));
                              handleOpenDialog();
                            }}
                            sx={{ mt: 1 }}
                          >
                            Add Unit
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Add/Edit Unit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingUnit ? 'Edit Unit' : 'Add New Unit'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    label="Year"
                  >
                    {getYearArray().map((year) => (
                      <MenuItem key={year} value={year}>
                        Year {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>{periodLabelSingular}</InputLabel>
                  <Select
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    label={periodLabelSingular}
                  >
                    {getSemestersForYear(formData.year || 1).map((semesterOption) => (
                      <MenuItem key={semesterOption} value={semesterOption}>
                        {periodLabelSingular} {semesterOption}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required error={!academicYearOptionsAvailable}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={formData.academicYear}
                    label="Academic Year"
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    disabled={!academicYearOptionsAvailable}
                  >
                    {academicYearOptions.map((year) => (
                      <MenuItem key={year._id || year.name} value={year.name}>
                        {year.name}
                        {year.isActive ? ' (Active)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {usingFallbackAcademicYears && (
                    <FormHelperText>
                      Using generated years. Add official academic years to customize.
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit Code"
                  value={formData.unitCode}
                  onChange={(e) => handleInputChange('unitCode', e.target.value.toUpperCase())}
                  required
                  helperText="e.g., MATH101, ENG201"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Credit Hours"
                  type="number"
                  value={formData.creditHours}
                  onChange={(e) => handleInputChange('creditHours', e.target.value)}
                  inputProps={{ min: 1, max: 6 }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Unit Name"
                  value={formData.unitName}
                  onChange={(e) => handleInputChange('unitName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Prerequisites (comma-separated unit codes)"
                  value={formData.prerequisites.join(', ')}
                  onChange={(e) => handlePrerequisitesChange(e.target.value)}
                  helperText="e.g., MATH101, PHYS102"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingUnit ? 'Update' : 'Add Unit'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* CAT Creation Dialog */}
        <Dialog open={catDialog} onClose={handleCloseCatDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QuizIcon color="success" />
              Create CAT for {selectedUnitForAssessment?.unitCode}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CAT Title"
                  value={catFormData.title}
                  onChange={(e) => handleCatInputChange('title', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={catFormData.description}
                  onChange={(e) => handleCatInputChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!academicYearOptionsAvailable}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={catFormData.academicYear}
                    label="Academic Year"
                    onChange={(e) => handleCatInputChange('academicYear', e.target.value)}
                    disabled={!academicYearOptionsAvailable}
                  >
                    {academicYearOptions.map((year) => (
                      <MenuItem key={year._id || year.name} value={year.name}>
                        {year.name}
                        {year.isActive ? ' (Active)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {usingFallbackAcademicYears && (
                    <FormHelperText>
                      Using generated years. Add official academic years to customize.
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={catFormData.duration}
                  onChange={(e) => handleCatInputChange('duration', parseInt(e.target.value))}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Total Marks"
                  type="number"
                  value={catFormData.totalMarks}
                  onChange={(e) => handleCatInputChange('totalMarks', parseInt(e.target.value))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  multiline
                  rows={3}
                  value={catFormData.instructions}
                  onChange={(e) => handleCatInputChange('instructions', e.target.value)}
                  placeholder="Enter instructions for students..."
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  📝 After creating the CAT, you can add questions and upload files in the assessment management section.
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                >
                  Upload CAT Image
                  <input type="file" hidden accept="image/*" onChange={handleCatImageUpload} />
                </Button>
              </Grid>
              {catImagePreview && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Image Preview:
                  </Typography>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: 'grey.300',
                      borderRadius: 1,
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'grey.50'
                    }}
                  >
                    <img
                      src={catImagePreview}
                      alt="CAT Preview"
                      style={{ maxWidth: '100%', maxHeight: 250, objectFit: 'contain' }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCatDialog}>Cancel</Button>
            <Button onClick={handleSubmitCat} variant="contained" color="success" startIcon={<PostAddIcon />}>
              Create CAT
            </Button>
          </DialogActions>
        </Dialog>

        {/* Exam Creation Dialog */}
        <Dialog open={examDialog} onClose={handleCloseExamDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon color="warning" />
              Create Exam for {selectedUnitForAssessment?.unitCode}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Exam Title"
                  value={examFormData.title}
                  onChange={(e) => handleExamInputChange('title', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={examFormData.description}
                  onChange={(e) => handleExamInputChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!academicYearOptionsAvailable}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={examFormData.academicYear}
                    label="Academic Year"
                    onChange={(e) => handleExamInputChange('academicYear', e.target.value)}
                    disabled={!academicYearOptionsAvailable}
                  >
                    {academicYearOptions.map((year) => (
                      <MenuItem key={year._id || year.name} value={year.name}>
                        {year.name}
                        {year.isActive ? ' (Active)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {usingFallbackAcademicYears && (
                    <FormHelperText>
                      Using generated years. Add official academic years to customize.
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={examFormData.duration}
                  onChange={(e) => handleExamInputChange('duration', parseInt(e.target.value))}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Total Marks"
                  type="number"
                  value={examFormData.totalMarks}
                  onChange={(e) => handleExamInputChange('totalMarks', parseInt(e.target.value))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  multiline
                  rows={3}
                  value={examFormData.instructions}
                  onChange={(e) => handleExamInputChange('instructions', e.target.value)}
                  placeholder="Enter instructions for students..."
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  📝 After creating the Exam, you can add questions and upload files in the assessment management section.
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                >
                  Upload Exam Image
                  <input type="file" hidden accept="image/*" onChange={handleExamImageUpload} />
                </Button>
              </Grid>
              {examImagePreview && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Image Preview:
                  </Typography>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: 'grey.300',
                      borderRadius: 1,
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'grey.50'
                    }}
                  >
                    <img
                      src={examImagePreview}
                      alt="Exam Preview"
                      style={{ maxWidth: '100%', maxHeight: 250, objectFit: 'contain' }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseExamDialog}>Cancel</Button>
            <Button onClick={handleSubmitExam} variant="contained" color="warning" startIcon={<PostAddIcon />}>
              Create Exam
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

export default UnitManagement;
