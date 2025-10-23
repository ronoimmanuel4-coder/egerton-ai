import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack, ExpandMore, MenuBook, School, VideoLibrary } from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import TopicManagement from './TopicManagement';

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

const sanitizeStringArray = (values = []) => {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  );
};

const normalizeUnitData = (formData, program) => {
  const duration = program?.duration || {};
  const maxYears = clampInt(duration.years, 1, 6, 6);
  const maxPeriods = clampInt(duration.semesters, 2, 12, 2);

  const year = clampInt(formData.year, 1, maxYears, 1);
  const semester = clampInt(formData.semester, 1, maxPeriods, 1);
  const creditHours = clampInt(formData.creditHours, 1, 6, 3);

  return {
    year,
    semester,
    unitCode: typeof formData.unitCode === 'string' ? formData.unitCode.trim().toUpperCase() : '',
    unitName: typeof formData.unitName === 'string' ? formData.unitName.trim() : '',
    creditHours,
    description: typeof formData.description === 'string' ? formData.description.trim() : '',
    prerequisites: sanitizeStringArray(formData.prerequisites)
  };
};

const UnitManagement = ({ program, institution, userRole = 'super_admin', onBack }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [managementView, setManagementView] = useState('units');
  const [formData, setFormData] = useState({
    year: 1,
    semester: 1,
    unitCode: '',
    unitName: '',
    creditHours: 3,
    description: '',
    prerequisites: []
  });

  useEffect(() => {
    if (program) {
      fetchUnits();
    }
  }, [program]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/courses/${program._id}`);
      setUnits(response.data.course.units || []);
    } catch (fetchError) {
      console.error('Error fetching units:', fetchError);
      setError('Failed to load units. Please try again.');
      setUnits(program.units || []);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        year: unit.year || 1,
        semester: unit.semester || 1,
        unitCode: unit.unitCode || '',
        unitName: unit.unitName || '',
        creditHours: unit.creditHours || 3,
        description: unit.description || '',
        prerequisites: Array.isArray(unit.prerequisites) ? unit.prerequisites : []
      });
    } else {
      setEditingUnit(null);
      setFormData({
        year: 1,
        semester: 1,
        unitCode: '',
        unitName: '',
        creditHours: 3,
        description: '',
        prerequisites: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUnit(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrerequisitesChange = (value) => {
    const prerequisites = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      prerequisites
    }));
  };

  const periodLabel = 'Semester';
  const maxPeriods = clampInt(program?.duration?.semesters, 2, 12, 2);

  const handleSubmit = async () => {
    try {
      const normalizedUnit = normalizeUnitData(formData, program);
      const validationErrors = [];

      if (normalizedUnit.year < 1 || normalizedUnit.year > (program.duration?.years || 6)) {
        validationErrors.push(`Year must be between 1 and ${program.duration?.years || 6}`);
      }

      if (normalizedUnit.semester < 1 || normalizedUnit.semester > maxPeriods) {
        validationErrors.push(`Semester must be between 1 and ${maxPeriods}`);
      }

      if (!normalizedUnit.unitCode || normalizedUnit.unitCode.length < 2) {
        validationErrors.push('Unit code must be at least 2 characters');
      }

      if (!normalizedUnit.unitName || normalizedUnit.unitName.length < 2) {
        validationErrors.push('Unit name must be at least 2 characters');
      }

      if (!Number.isInteger(normalizedUnit.creditHours) || normalizedUnit.creditHours < 1 || normalizedUnit.creditHours > 6) {
        validationErrors.push('Credit hours must be between 1 and 6');
      }

      if (validationErrors.length > 0) {
        setError(`Please fix the following: ${validationErrors.join(', ')}`);
        return;
      }

      setError(null);
      console.log('📤 Submitting unit data:', normalizedUnit);

      if (editingUnit) {
        await api.put(`/api/courses/${program._id}/units/${editingUnit._id}`, normalizedUnit);
      } else {
        await api.post(`/api/courses/${program._id}/units`, normalizedUnit);
      }

      await fetchUnits();
      handleCloseDialog();
    } catch (submitError) {
      console.error('Error saving unit:', submitError.response?.data || submitError);
      if (submitError.response?.data?.errors?.length) {
        const details = submitError.response.data.errors
          .map((err) => `${err.path || err.param}: ${err.msg}`)
          .join(', ');
        setError(`Failed to save unit: ${details}`);
      } else if (submitError.response?.data?.message) {
        setError(`Failed to save unit: ${submitError.response.data.message}`);
      } else {
        setError('Failed to save unit. Please try again.');
      }
    }
  };

  const handleDelete = async (unitId) => {
    if (!window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/courses/${program._id}/units/${unitId}`);
      await fetchUnits();
    } catch (deleteError) {
      console.error('Error deleting unit:', deleteError);
      setError('Failed to delete unit. Please try again.');
    }
  };

  const groupedUnits = units.reduce((acc, unit) => {
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
    const years = clampInt(program?.duration?.years, 1, 6, 4);
    return Array.from({ length: years }, (_, i) => i + 1);
  };

  const getSemesterArray = () => {
    const count = Math.max(2, maxPeriods);
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h2" color="primary" sx={{ fontWeight: 600 }}>
              Unit Management - {program.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[program.code, institution?.shortName, `${units.length} units`].filter(Boolean).join(' • ')}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2 }}>
            Add Unit
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <School sx={{ fontSize: 40 }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h6">{program.name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {program.level} • {program.duration?.years} Years • {program.duration?.semesters} Semesters
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

        {getYearArray().map((year) => (
          <Accordion key={year} defaultExpanded={year === 1}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" color="primary">
                Year {year}
              </Typography>
              <Chip
                label={`${Object.keys(groupedUnits[year] || {}).reduce(
                  (total, sem) => total + (groupedUnits[year][sem]?.length || 0),
                  0
                )} units`}
                size="small"
                sx={{ ml: 2 }}
              />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {getSemesterArray().map((semester) => (
                  <Grid item xs={12} md={6} key={semester}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 600 }}>
                          {`Semester ${semester}`}
                        </Typography>
                        <Chip label={`${groupedUnits[year]?.[semester]?.length || 0} units`} size="small" color="secondary" />
                      </Box>

                      {groupedUnits[year]?.[semester]?.length > 0 ? (
                        <List dense>
                          {groupedUnits[year][semester].map((unit, index) => (
                            <React.Fragment key={unit._id || `${year}-${semester}-${index}`}>
                              <ListItem>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {unit.unitCode}
                                      </Typography>
                                      <Chip label={`${unit.creditHours} CH`} size="small" color="info" />
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2">{unit.unitName}</Typography>
                                      {unit.description && (
                                        <Typography variant="caption" color="text.secondary">
                                          {unit.description.substring(0, 100)}
                                          {unit.description.length > 100 && '...'}
                                        </Typography>
                                      )}
                                      {unit.prerequisites?.length > 0 && (
                                        <Typography variant="caption" color="warning.main" display="block">
                                          Prerequisites: {unit.prerequisites.join(', ')}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedUnit(unit);
                                      setManagementView('topics');
                                    }}
                                    color="secondary"
                                    title="Manage Topics & Content"
                                  >
                                    <VideoLibrary />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleOpenDialog(unit)} color="primary">
                                    <Edit />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleDelete(unit._id)} color="error">
                                    <Delete />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                              {index < groupedUnits[year][semester].length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <MenuBook sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No units added for this semester
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, year, semester }));
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

        {units.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <MenuBook sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No units found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start by adding units for this program. Units are organized by year and semester.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
              Add First Unit
            </Button>
          </Paper>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={formData.year}
                    label="Year"
                    onChange={(e) => handleInputChange('year', Number(e.target.value))}
                  >
                    {getYearArray().map((yearOption) => (
                      <MenuItem key={yearOption} value={yearOption}>
                        Year {yearOption}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{periodLabel}</InputLabel>
                  <Select
                    value={formData.semester}
                    label={periodLabel}
                    onChange={(e) => handleInputChange('semester', Number(e.target.value))}
                  >
                    {getSemesterArray().map((semesterOption) => (
                      <MenuItem key=设备throw
