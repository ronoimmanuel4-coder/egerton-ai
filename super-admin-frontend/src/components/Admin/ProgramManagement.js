import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack, School, AccessTime, MenuBook, Settings } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import UnitManagement from './UnitManagement';

const toIntOrNull = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const clampInt = (value, min, max, fallback) => {
  const parsed = toIntOrNull(value);

  if (parsed === null) {
    return fallback;
  }

  if (typeof min === 'number' && parsed < min) {
    return min;
  }

  if (typeof max === 'number' && parsed > max) {
    return max;
  }

  return parsed;
};

const normalizeDuration = (duration = {}, scheduleType = 'semesters') => {
  const years = clampInt(duration.years, 1, 6, 1);
  const providedPeriods = scheduleType === 'terms'
    ? duration.terms ?? duration.semesters
    : duration.semesters ?? duration.terms;
  const minPeriods = scheduleType === 'terms' ? 3 : 2;
  const maxPeriods = 12;
  const defaultPeriods = scheduleType === 'terms'
    ? 3
    : Math.max(2, Math.min(12, years * 2));
  const periods = clampInt(
    providedPeriods,
    minPeriods,
    maxPeriods,
    defaultPeriods
  );

  return {
    years,
    semesters: periods,
    terms: periods
  };
};

const sanitizeStringArray = (values = []) => {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  );
};

const sanitizeFees = (fees = {}) => {
  const parseAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return 0;
    }

    if (typeof amount === 'number') {
      return Number.isFinite(amount) ? amount : 0;
    }

    if (typeof amount === 'string') {
      const sanitized = amount.replace(/,/g, '').trim();
      if (!sanitized) {
        return 0;
      }

      const parsed = Number(sanitized);
      return Number.isFinite(parsed) ? parsed : sanitized;
    }

    return 0;
  };

  return {
    local: parseAmount(fees.local),
    international: parseAmount(fees.international),
    currency:
      typeof fees.currency === 'string' && fees.currency.trim()
        ? fees.currency.trim().toUpperCase()
        : 'KSH'
  };
};

const normalizeLevel = (level, allowedLevels) => {
  if (typeof level !== 'string') {
    return undefined;
  }

  const trimmed = level.trim();
  if (allowedLevels.includes(trimmed)) {
    return trimmed;
  }

  if (trimmed.toLowerCase() === 'postgraduate') {
    return 'Masters';
  }

  return undefined;
};

const ProgramManagement = ({ institution, userRole = 'super_admin', onBack }) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    level: '',
    scheduleType: 'semesters',
    duration: normalizeDuration({ years: 1, semesters: 2 }, 'semesters'),
    description: '',
    entryRequirements: '',
    careerProspects: [],
    subcourses: [],
    fees: {
      local: '',
      international: '',
      currency: 'KSH'
    }
  });
  const [subcourseInput, setSubcourseInput] = useState('');

  const programLevels = [
    'Certificate',
    'Diploma',
    'Undergraduate',
    'Masters',
    'PhD'
  ];

  const commonDepartments = [
    'School of Medicine',
    'School of Engineering',
    'School of Business',
    'School of Education',
    'School of Sciences',
    'School of Arts',
    'School of Nursing',
    'School of Agriculture',
    'School of Law',
    'School of Computing'
  ];

  useEffect(() => {
    if (institution) {
      fetchPrograms();
    }
  }, [institution]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/courses?institution=${institution._id}`);
      setPrograms(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load programs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name || '',
        code: program.code || '',
        department: program.department || '',
        level: normalizeLevel(program.level, programLevels) ?? '',
        scheduleType: 'semesters',
        duration: normalizeDuration(program.duration, 'semesters'),
        description: program.description || '',
        entryRequirements: program.entryRequirements || '',
        careerProspects: sanitizeStringArray(program.careerProspects),
        subcourses: sanitizeStringArray(program.subcourses),
        fees: {
          local: program.fees?.local ?? '',
          international: program.fees?.international ?? '',
          currency: program.fees?.currency || 'KSH'
        }
      });
      setSubcourseInput('');
    } else {
      setEditingProgram(null);
      setFormData({
        name: '',
        code: '',
        department: '',
        level: '',
        scheduleType: 'semesters',
        duration: normalizeDuration({ years: 1, semesters: 2 }, 'semesters'),
        description: '',
        entryRequirements: '',
        careerProspects: [],
        subcourses: [],
        fees: { local: '', international: '', currency: 'KSH' }
      });
      setSubcourseInput('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProgram(null);
    setSubcourseInput('');
  };

  const handleInputChange = (field, value, nested = null) => {
    if (nested === 'duration') {
      setFormData((prev) => ({
        ...prev,
        duration: normalizeDuration({
          ...prev.duration,
          [field]: value
        }, prev.scheduleType)
      }));
      return;
    }

    if (nested === 'fees') {
      setFormData((prev) => ({
        ...prev,
        fees: {
          ...prev.fees,
          [field]: value
        }
      }));
      return;
    }

    if (nested) {
      setFormData((prev) => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCareerProspectsChange = (value) => {
    const prospects = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      careerProspects: prospects
    }));
  };

  const handleAddSubcourse = () => {
    const value = subcourseInput.trim();
    if (!value) return;
    setFormData(prev => {
      const exists = prev.subcourses.some(
        (item) => item.trim().toLowerCase() === value.toLowerCase()
      );
      if (exists) {
        return prev;
      }
      return {
        ...prev,
        subcourses: [...prev.subcourses, value]
      };
    });
    setSubcourseInput('');
  };

  const handleRemoveSubcourse = (value) => {
    setFormData(prev => ({
      ...prev,
      subcourses: prev.subcourses.filter(sub => sub !== value)
    }));
  };

  const handleSubcourseKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddSubcourse();
    }
  };

  const validateForm = () => {
    const errors = [];
    const scheduleLabel = 'semesters';
    
    if (!formData.name || formData.name.trim().length < 2) {
      errors.push('Program name must be at least 2 characters');
    }
    
    if (!formData.code || formData.code.trim().length < 2) {
      errors.push('Program code must be at least 2 characters');
    }
    
    if (!formData.department || formData.department.trim().length < 2) {
      errors.push('Department must be at least 2 characters');
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    
    if (!formData.duration.years || formData.duration.years < 1 || formData.duration.years > 6) {
      errors.push('Duration years must be between 1 and 6');
    }
    
    if (!formData.duration.semesters || formData.duration.semesters < 2 || formData.duration.semesters > 12) {
      errors.push(`Duration ${scheduleLabel} must be between 2 and 12`);
    }

    return errors;
  };

  const handleSubmit = async () => {
    try {
      // Validate form first
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(`Please fix the following errors: ${validationErrors.join(', ')}`);
        return;
      }

      setError(null);

      const sanitizedSubcourses = sanitizeStringArray(formData.subcourses);
      const sanitizedCareerProspects = sanitizeStringArray(formData.careerProspects);
      const normalizedScheduleType = 'semesters';
      const normalizedDuration = normalizeDuration(formData.duration, normalizedScheduleType);
      const normalizedLevel = normalizeLevel(formData.level, programLevels);
      const sanitizedFees = sanitizeFees(formData.fees);

      const programData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        department: formData.department.trim(),
        duration: normalizedDuration,
        scheduleType: normalizedScheduleType,
        description: formData.description.trim(),
        entryRequirements: formData.entryRequirements.trim(),
        careerProspects: sanitizedCareerProspects,
        subcourses: sanitizedSubcourses,
        fees: sanitizedFees,
        institution: institution._id
      };

      if (normalizedLevel) {
        programData.level = normalizedLevel;
      }

      console.log('📤 Sending program data:', programData);

      if (editingProgram) {
        await api.put(`/api/courses/${editingProgram._id}`, programData);
      } else {
        await api.post('/api/courses', programData);
      }
      
      await fetchPrograms();
      handleCloseDialog();
    } catch (error) {
      console.error('❌ Error saving program:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors.map(err => `${err.path}: ${err.msg}`).join(', ');
        setError(`Validation failed: ${validationErrors}`);
      } else if (error.response?.data?.message) {
        setError(`Failed to save program: ${error.response.data.message}`);
      } else {
        setError('Failed to save program. Please try again.');
      }
    }
  };

  const handleDelete = async (programId) => {
    if (window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      try {
        await api.delete(`/api/courses/${programId}`);
        await fetchPrograms();
      } catch (error) {
        console.error('Error deleting program:', error);
        setError('Failed to delete program. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Programs</Typography>
        <Box flexGrow={1} />
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Program
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(event, value) => setTabValue(value)} sx={{ mb: 3 }}>
        <Tab label="Programs" />
        <Tab label="Unit Management" disabled={!selectedProgram} />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {programs.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No programs found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add your first program to get started.
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                  Add Program
                </Button>
              </Paper>
            </Grid>
          ) : (
            programs.map((program) => {
              const displayScheduleType = 'semesters';

              return (
                <Grid item xs={12} md={6} key={program._id}>
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card>
                      <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                        {program.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {[program.code, program.department].filter(Boolean).join(' • ')}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                        {program.level && <Chip label={program.level} color="primary" size="small" />}
                        {program.duration?.years && (
                          <Chip
                            icon={<AccessTime />}
                            label={`${program.duration.years} Years`}
                            color="secondary"
                            size="small"
                          />
                        )}
                        {program.duration?.semesters && (
                          <Chip
                            icon={<MenuBook />}
                            label={`${program.duration.semesters} Semesters`}
                            color="info"
                            size="small"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2, minHeight: 60 }}>
                        {program.description?.substring(0, 120)}
                        {program.description?.length > 120 && '...'}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Settings />}
                          onClick={() => {
                            setSelectedProgram(program);
                            setTabValue(1);
                          }}
                        >
                          Units
                        </Button>
                        <IconButton color="primary" size="small" onClick={() => handleOpenDialog(program)}>
                          <Edit />
                        </IconButton>
                        <Button
                          color="error"
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleDelete(program._id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              );
            })
          )}
        </Grid>
      )}

      {tabValue === 1 && selectedProgram && (
        <UnitManagement program={selectedProgram} institution={institution} userRole={userRole} onBack={() => setTabValue(0)} />
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingProgram ? 'Edit Program' : 'Add New Program'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Program Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Program Code"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
            fullWidth
            required
          />
          <TextField
            label="Department"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>Program Level</InputLabel>
            <Select
              value={formData.level}
              label="Program Level"
              onChange={(e) => handleInputChange('level', e.target.value)}
            >
              {programLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Duration (Years)"
            type="number"
            value={formData.duration.years}
            onChange={(e) => handleInputChange('years', parseInt(e.target.value, 10) || 0, 'duration')}
            fullWidth
            required
          />
          <TextField
            label="Duration (Semesters)"
            type="number"
            value={formData.duration.semesters}
            onChange={(e) => handleInputChange('semesters', parseInt(e.target.value, 10) || 0, 'duration')}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label="Entry Requirements"
            value={formData.entryRequirements}
            onChange={(e) => handleInputChange('entryRequirements', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Career Prospects (comma-separated)"
            value={formData.careerProspects.join(', ')}
            onChange={(e) => handleCareerProspectsChange(e.target.value)}
            fullWidth
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Subcourses
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                label="Add Subcourse"
                value={subcourseInput}
                onChange={(e) => setSubcourseInput(e.target.value)}
                onKeyDown={handleSubcourseKeyDown}
                size="small"
              />
              <Button variant="outlined" startIcon={<Add />} onClick={handleAddSubcourse}>
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {formData.subcourses.map((subcourse) => (
                <Chip
                  key={subcourse}
                  label={subcourse}
                  onDelete={() => handleRemoveSubcourse(subcourse)}
                  deleteIcon={<CloseIcon />}
                />
              ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProgram ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProgramManagement;
