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
  Stack,
  DialogContentText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import UnitManagement from './UnitManagement';

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const clampInt = (value, min, max, fallback) => {
  const parsed = toPositiveInt(value);
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

const normalizeFrontendSchedule = (value) => {
  if (typeof value !== 'string') {
    return 'semester';
  }
  const lowered = value.toLowerCase();
  if (lowered === 'term' || lowered === 'terms') {
    return 'term';
  }
  return 'semester';
};

const mapScheduleForBackend = (value) => (value === 'term' ? 'terms' : 'semesters');

const mapScheduleFromBackend = (value) => normalizeFrontendSchedule(value);

const buildDurationState = (duration = {}, scheduleOverride = 'semester') => {
  const normalizedSchedule = normalizeFrontendSchedule(scheduleOverride || duration.scheduleType);

  const years = clampInt(duration.years, 1, 6, 1);
  const rawPeriods = duration.semesters ?? duration.terms ?? duration.periods;
  const minPeriods = normalizedSchedule === 'term' ? Math.max(3, years) : Math.max(2, years);
  const maxPeriods = normalizedSchedule === 'term' ? 180 : 24;
  const defaultPeriods = normalizedSchedule === 'term'
    ? Math.max(minPeriods, years * 3)
    : Math.max(minPeriods, years * 2);
  const periods = clampInt(rawPeriods, minPeriods, maxPeriods, defaultPeriods);

  return {
    years,
    scheduleType: normalizedSchedule,
    semesters: periods,
    terms: periods
  };
};

const sanitizeDurationForSubmit = (duration, scheduleType = 'semester') => {
  const normalizedSchedule = normalizeFrontendSchedule(scheduleType);
  const normalized = buildDurationState(duration, normalizedSchedule);
  const { years, semesters } = normalized;
  const periodsPerYear = years > 0 ? Math.max(1, Math.round(semesters / years)) : 1;

  return {
    years,
    scheduleType: mapScheduleForBackend(normalizedSchedule),
    periodsPerYear,
    terms: semesters,
    semesters
  };
};

const scheduleOptions = [
  { value: 'semester', label: 'Semesters (2 per year minimum)' },
  { value: 'term', label: 'Terms (3 per year minimum)' }
];

const ProgramManagement = ({ institution, userRole = 'mini_admin', onBack }) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSubcourse, setSelectedSubcourse] = useState('');
  const [subcourseDialogOpen, setSubcourseDialogOpen] = useState(false);
  const [pendingProgram, setPendingProgram] = useState(null);
  const [pendingSubcourse, setPendingSubcourse] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    level: 'Diploma',
    scheduleType: 'semester',
    duration: buildDurationState({ years: 1, semesters: 2 }, 'semester'),
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const periodInputLabel = formData.scheduleType === 'term' ? 'Duration (Terms)' : 'Duration (Semesters)';
  const periodHelperText = formData.scheduleType === 'term'
    ? 'Total terms across the full program'
    : 'Total semesters across the full program';
  const minPeriodsForSchedule = formData.scheduleType === 'term' ? 3 : 2;
  const maxPeriodsForSchedule = formData.scheduleType === 'term' ? 180 : 24;

  const programLevels = [
    'Certificate',
    'Diploma',
    'Undergraduate',
    'Postgraduate',
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
      const scheduleType = mapScheduleFromBackend(program.scheduleType || program.duration?.scheduleType);
      const normalizedLevel = program.level && programLevels.includes(program.level) ? program.level : 'Diploma';
      setEditingProgram(program);
      setFormData({
        name: program.name || '',
        code: program.code || '',
        department: program.department || '',
        level: normalizedLevel,
        scheduleType,
        duration: buildDurationState(program.duration, scheduleType),
        description: program.description || '',
        entryRequirements: program.entryRequirements || '',
        careerProspects: program.careerProspects || [],
        subcourses: Array.isArray(program.subcourses) ? program.subcourses : [],
        fees: {
          local: program.fees?.local || '',
          international: program.fees?.international || '',
          currency: program.fees?.currency || 'KSH'
        }
      });
    } else {
      setEditingProgram(null);
      setFormData({
        name: '',
        code: '',
        department: '',
        level: 'Diploma',
        scheduleType: 'semester',
        duration: buildDurationState({ years: 1, semesters: 2 }, 'semester'),
        description: '',
        entryRequirements: '',
        careerProspects: [],
        subcourses: [],
        fees: { local: '', international: '', currency: 'KSH' }
      });
    }
    setSubcourseInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProgram(null);
    setSubcourseInput('');
  };

  const handleInputChange = (field, value, nested = null) => {
    if (field === 'scheduleType') {
      setFormData(prev => ({
        ...prev,
        scheduleType: value,
        duration: buildDurationState(prev.duration, value)
      }));
      return;
    }

    if (nested) {
      if (nested === 'duration') {
        setFormData(prev => ({
          ...prev,
          duration: buildDurationState({
            ...prev.duration,
            [field]: value
          }, prev.scheduleType)
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
      return;
    }

    setFormData(prev => ({
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
      if (prev.subcourses.includes(value)) {
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

  const handleSubmit = async () => {
    try {
      const sanitizedSubcourses = Array.from(new Set(
        (formData.subcourses || [])
          .map(sub => (typeof sub === 'string' ? sub.trim() : ''))
          .filter(Boolean)
      ));

      const frontendSchedule = normalizeFrontendSchedule(formData.scheduleType);
      const normalizedDuration = sanitizeDurationForSubmit(formData.duration, frontendSchedule);
      const backendScheduleType = mapScheduleForBackend(frontendSchedule);

      const programData = {
        ...formData,
        scheduleType: backendScheduleType,
        duration: normalizedDuration,
        level: programLevels.includes(formData.level) ? formData.level : 'Diploma',
        subcourses: sanitizedSubcourses,
        institution: institution._id
      };

      if (editingProgram) {
        await api.put(`/api/courses/${editingProgram._id}`, programData);
      } else {
        await api.post('/api/courses', programData);
      }
      
      await fetchPrograms();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving program:', error);
      setError('Failed to save program. Please try again.');
    }
  };

  const openDeleteDialog = (program) => {
    setProgramToDelete(program);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProgramToDelete(null);
  };

  const handleDelete = async () => {
    if (!programToDelete) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/api/courses/${programToDelete._id}`);
      if (editingProgram?._id === programToDelete._id) {
        handleCloseDialog();
      }
      closeDeleteDialog();
      if (selectedProgram?._id === programToDelete._id) {
        setSelectedProgram(null);
        setTabValue(0);
      }
      await fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      setError('Failed to delete program. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSelectProgramForUnits = (program) => {
    if (Array.isArray(program.subcourses) && program.subcourses.length > 0) {
      setPendingProgram(program);
      setPendingSubcourse('');
      setSubcourseDialogOpen(true);
    } else {
      setSelectedProgram(program);
      setSelectedSubcourse('');
      setTabValue(1);
    }
  };

  const handleConfirmSubcourse = () => {
    if (!pendingProgram) {
      setSubcourseDialogOpen(false);
      return;
    }

    if (!pendingSubcourse) {
      // Require selection before proceeding
      return;
    }

    setSelectedProgram(pendingProgram);
    setSelectedSubcourse(pendingSubcourse);
    setTabValue(1);
    setSubcourseDialogOpen(false);
    setPendingProgram(null);
    setPendingSubcourse('');
  };

  const handleCancelSubcourseDialog = () => {
    setSubcourseDialogOpen(false);
    setPendingProgram(null);
    setPendingSubcourse('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
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
            {ArrowBackIcon ? <ArrowBackIcon /> : 'Back'}
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h2" color="primary" sx={{ fontWeight: 600 }}>
              Programs - {institution.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {institution.shortName} • {programs.length} programs
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={AddIcon ? <AddIcon /> : null}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2 }}
          >
            Add Program
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Programs" />
            <Tab label="Unit Management" disabled={!selectedProgram} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {programs.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  {SchoolIcon ? (
                    <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  ) : null}
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No programs found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Start by adding the first program for this institution.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={AddIcon ? <AddIcon /> : null}
                    onClick={() => handleOpenDialog()}
                  >
                    Add First Program
                  </Button>
                </Paper>
              </Grid>
            ) : (
              (Array.isArray(programs) ? programs.filter((program) => program && typeof program === 'object' && !Array.isArray(program)) : []).map((program, index) => {
                if (!program || typeof program !== 'object') {
                  return null;
                }

                const duration = program.duration && typeof program.duration === 'object'
                  ? program.duration
                  : {};
                const scheduleTypeRaw = typeof program.scheduleType === 'string'
                  ? program.scheduleType.toLowerCase()
                  : undefined;
                const scheduleType = scheduleTypeRaw === 'term' ? 'term' : 'semester';
                const periodLabelText = scheduleType === 'term' ? 'Terms' : 'Semesters';
                const yearsValue = duration.years ?? duration.Years ?? duration.year;
                const periodsValue = duration.semesters ?? duration.terms ?? duration.Semesters;
                const durationYears = typeof yearsValue === 'number' ? yearsValue : Number(yearsValue);
                const durationPeriods = typeof periodsValue === 'number' ? periodsValue : Number(periodsValue);
                const hasYears = Number.isFinite(durationYears) && durationYears > 0;
                const hasPeriods = Number.isFinite(durationPeriods) && durationPeriods > 0;
                const perYear = hasYears && hasPeriods ? durationPeriods / durationYears : null;
                const periodsLabel = hasPeriods
                  ? `${durationPeriods} ${periodLabelText}${Number.isFinite(perYear) ? ` • ${(durationYears > 0 ? perYear.toFixed(2) : '0.00')} per year` : ''}`
                  : null;

                return (
                  <Grid item xs={12} md={6} lg={4} key={program._id || index}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {program.name}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {[program.code, program.department].filter(Boolean).join(' • ')}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            {program.level && (
                              <Chip
                                label={program.level}
                                color="primary"
                                size="small"
                              />
                            )}
                            {hasYears && (
                              <Chip
                                icon={AccessTimeIcon ? <AccessTimeIcon /> : undefined}
                                label={`${durationYears} Years`}
                                color="secondary"
                                size="small"
                              />
                            )}
                            {periodsLabel && (
                              <Chip
                                icon={MenuBookIcon ? <MenuBookIcon /> : undefined}
                                label={periodsLabel}
                                color="info"
                                size="small"
                              />
                            )}
                          </Box>

                          <Typography variant="body2" sx={{ mb: 2, minHeight: 60 }}>
                            {program.description?.substring(0, 120)}
                            {program.description?.length > 120 && '...'}
                          </Typography>

                          {Array.isArray(program.subcourses) && program.subcourses.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Subcourses:
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                {program.subcourses.slice(0, 3).join(', ')}
                                {program.subcourses.length > 3 && '...'}
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={SettingsIcon ? <SettingsIcon /> : null}
                              onClick={() => handleSelectProgramForUnits(program)}
                            >
                              Units
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(program)}
                              color="primary"
                            >
                              {EditIcon ? <EditIcon /> : 'Edit'}
                            </IconButton>

                            <Button
                              size="small"
                              color="error"
                              startIcon={DeleteIcon ? <DeleteIcon /> : null}
                              onClick={() => openDeleteDialog(program)}
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
          <UnitManagement 
            program={selectedProgram}
            institution={institution}
            userRole={userRole}
            selectedSubcourse={selectedSubcourse}
            onBack={() => setTabValue(0)}
          />
        )}

        <Dialog open={subcourseDialogOpen} onClose={handleCancelSubcourseDialog}>
          <DialogTitle>Select Subcourse</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Subcourse</InputLabel>
              <Select
                label="Subcourse"
                value={pendingSubcourse}
                onChange={(event) => setPendingSubcourse(event.target.value)}
              >
                {pendingProgram?.subcourses?.map((subcourse) => (
                  <MenuItem key={subcourse} value={subcourse}>
                    {subcourse}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!pendingSubcourse && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                Please select a subcourse to continue.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelSubcourseDialog}>Cancel</Button>
            <Button onClick={handleConfirmSubcourse} variant="contained" disabled={!pendingSubcourse}>
              Continue
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Program Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingProgram ? 'Edit Program' : 'Add New Program'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Program Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Program Code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Academic Schedule</InputLabel>
                  <Select
                    value={formData.scheduleType}
                    label="Academic Schedule"
                    onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                  >
                    {scheduleOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Duration (Years)"
                  type="number"
                  value={formData.duration.years}
                  onChange={(e) => handleInputChange('years', parseInt(e.target.value, 10) || 0, 'duration')}
                  inputProps={{ min: 1, max: 6 }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={periodInputLabel}
                  type="number"
                  value={formData.duration.semesters}
                  helperText={periodHelperText}
                  onChange={(e) => handleInputChange('semesters', parseInt(e.target.value, 10) || 0, 'duration')}
                  inputProps={{
                    min: Math.max(minPeriodsForSchedule, formData.duration.years || 1),
                    max: maxPeriodsForSchedule
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  minRows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Entry Requirements"
                  value={formData.entryRequirements}
                  onChange={(e) => handleInputChange('entryRequirements', e.target.value)}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Subcourses
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <TextField
                      label="Add Subcourse"
                      value={subcourseInput}
                      onChange={(e) => setSubcourseInput(e.target.value)}
                      onKeyDown={handleSubcourseKeyDown}
                      size="small"
                    />
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddSubcourse}>
                      Add
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {formData.subcourses.map((subcourse) => (
                      <Chip
                        key={subcourse}
                        label={subcourse}
                        onDelete={() => handleRemoveSubcourse(subcourse)}
                        deleteIcon={<DeleteIcon />}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            {editingProgram && (
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => openDeleteDialog(editingProgram)}
              >
                Delete Program
              </Button>
            )}
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingProgram ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
          <DialogTitle>Delete Program</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the program "{programToDelete?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

export default ProgramManagement;
