const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { upload } = require('../middleware/upload');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

const ensureSingleActiveAcademicYear = (course, activeYearId = null) => {
  if (!Array.isArray(course.academicYears)) {
    course.academicYears = [];
    return;
  }

  if (activeYearId) {
    course.academicYears.forEach((year) => {
      year.isActive = year._id.toString() === activeYearId.toString();
    });
  }

  const hasActive = course.academicYears.some((year) => year.isActive);
  if (!hasActive && course.academicYears.length > 0) {
    course.academicYears[0].isActive = true;
  }
};

const findAcademicYearIndex = (course, yearId) => {
  return course.academicYears.findIndex((year) => year._id.toString() === yearId.toString());
};

const validateAcademicYearPayload = (payload) => {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    errors.push({ msg: 'Invalid payload' });
    return errors;
  }

  if (!payload.name || typeof payload.name !== 'string' || payload.name.trim().length < 9) {
    errors.push({ param: 'name', msg: 'Academic year name must follow format e.g. 2023/2024', value: payload.name });
  }

  if (payload.startDate && Number.isNaN(Date.parse(payload.startDate))) {
    errors.push({ param: 'startDate', msg: 'Invalid start date', value: payload.startDate });
  }

  if (payload.endDate && Number.isNaN(Date.parse(payload.endDate))) {
    errors.push({ param: 'endDate', msg: 'Invalid end date', value: payload.endDate });
  }

  if (payload.startDate && payload.endDate) {
    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    if (start > end) {
      errors.push({ param: 'endDate', msg: 'End date must be after start date' });
    }
  }

  return errors;
};

// @route   POST /api/courses/:id/units/:unitId/topics
// @desc    Create a topic for a unit (normalized schema support)
// @access  Private (Mini Admin or Super Admin)
router.post('/:id/units/:unitId/topics', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const { id: courseId, unitId } = req.params;
    const { topicNumber, title, description, learningOutcomes, content } = req.body || {};

    const Unit = require('../models/Unit');
    const Topic = require('../models/Topic');
    const ContentAsset = require('../models/ContentAsset');

    const unit = await Unit.findById(unitId);
    if (!unit) {
      console.warn(`[topics] Unit not found. unitId=${unitId}`);
      return res.status(404).json({ message: 'Unit not found', unitId });
    }

    const unitObjectId = new mongoose.Types.ObjectId(unitId);

    // Determine safe topicNumber unique within unit
    let desiredNumber = Number(topicNumber);
    if (!Number.isInteger(desiredNumber) || desiredNumber < 1) {
      const last = await Topic.find({ unitId: unitObjectId }).sort({ topicNumber: -1 }).limit(1).lean();
      desiredNumber = last.length ? (Number(last[0].topicNumber) || 0) + 1 : 1;
    } else {
      // If number exists, find next available
      const existing = await Topic.findOne({ unitId: unitObjectId, topicNumber: desiredNumber }).lean();
      if (existing) {
        const last = await Topic.find({ unitId: unitObjectId }).sort({ topicNumber: -1 }).limit(1).lean();
        desiredNumber = last.length ? (Number(last[0].topicNumber) || 0) + 1 : desiredNumber + 1;
      }
    }

    // Create topic with retry on duplicate topicNumber
    let topic;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        topic = await Topic.create({
          unitId: unitObjectId,
          topicNumber: desiredNumber,
          title: title || 'Untitled Topic',
          description: description || '',
          learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
          createdBy: req.user?._id
        });
        break; // success
      } catch (err) {
        if (err && err.code === 11000) {
          // Bump the number and retry
          desiredNumber += 1;
          console.warn(`[topics] Duplicate topicNumber, retrying with ${desiredNumber} (attempt ${attempt + 1})`);
          continue;
        }
        throw err;
      }
    }
    if (!topic) {
      return res.status(409).json({ message: 'Unable to allocate unique topic number after retries' });
    }

    // Optionally create content assets based on payload
    const assets = [];
    if (content?.lectureVideo?.filename) {
      const videoStatus = req.user.role === 'super_admin' ? 'approved' : (content.lectureVideo.status || 'pending');
      assets.push(await ContentAsset.create({
        ownerType: 'topic',
        owner: topic._id,
        courseId: courseId,
        unitId: unitId,
        type: 'video',
        title: content.lectureVideo.title || title,
        status: videoStatus,
        isPremium: !!content.lectureVideo.isPremium,
        filename: content.lectureVideo.filename,
        filePath: content.lectureVideo.filePath,
        fileSize: content.lectureVideo.fileSize,
        metadata: { duration: content.lectureVideo.duration },
        gridFsFileId: content.lectureVideo.gridFsFileId,
        uploadedBy: content.lectureVideo.uploadedBy || req.user.id,
        uploadDate: new Date()
      }));
      console.log(`✅ Video ContentAsset created with courseId: ${courseId}, unitId: ${unitId}, status: ${videoStatus}`);
    }
    if (content?.notes?.filename) {
      const notesStatus = req.user.role === 'super_admin' ? 'approved' : (content.notes.status || 'pending');
      assets.push(await ContentAsset.create({
        ownerType: 'topic',
        owner: topic._id,
        courseId: courseId,
        unitId: unitId,
        type: 'notes',
        title: content.notes.title || `${title || 'Notes'}`,
        status: notesStatus,
        isPremium: !!content.notes.isPremium,
        filename: content.notes.filename,
        filePath: content.notes.filePath,
        fileSize: content.notes.fileSize,
        gridFsFileId: content.notes.gridFsFileId,
        uploadedBy: content.notes.uploadedBy || req.user.id,
        uploadDate: new Date()
      }));
      console.log(`✅ Notes ContentAsset created with courseId: ${courseId}, unitId: ${unitId}, status: ${notesStatus}`);
    }
    // Skipping youtubeResources creation here since ContentAsset requires filename/filePath

    res.status(201).json({ message: 'Topic created', topic: { ...topic.toObject(), assetsCreated: assets.length } });
  } catch (error) {
    console.error('Create topic error:', error && (error.stack || error.message || error));
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate topic number for unit', details: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug helper: verify a unit belongs to a course
// GET /api/courses/:id/units/:unitId/verify-link
router.get('/:id/units/:unitId/verify-link', async (req, res) => {
  try {
    const { id: courseId, unitId } = req.params;
    const Unit = require('../models/Unit');
    const unit = await Unit.findById(unitId).select('courseId unitCode unitName').lean();
    if (!unit) return res.status(404).json({ found: false, message: 'Unit not found' });
    const matches = String(unit.courseId) === String(courseId);
    res.json({ found: true, matches, courseId: String(unit.courseId), requestedCourseId: String(courseId), unit });
  } catch (error) {
    console.error('Verify link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/units/:unitId/topics/:topicId
// @desc    Update a topic and its assets (upsert) for normalized schema
// @access  Private (Mini Admin or Super Admin)
router.put('/:id/units/:unitId/topics/:topicId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const { id: courseId, unitId, topicId } = req.params;
    const { topicNumber, title, description, learningOutcomes, content } = req.body || {};

    const Unit = require('../models/Unit');
    const Topic = require('../models/Topic');
    const ContentAsset = require('../models/ContentAsset');

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    const topic = await Topic.findOneAndUpdate(
      { _id: topicId, unitId },
      {
        $set: {
          topicNumber: topicNumber != null ? Number(topicNumber) : undefined,
          title,
          description,
          learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : undefined
        }
      },
      { new: true, upsert: false }
    );
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Upsert assets by type
    const upserts = [];
    if (content?.lectureVideo) {
      const videoStatus = req.user.role === 'super_admin' ? 'approved' : (content.lectureVideo.status || 'pending');
      upserts.push(ContentAsset.findOneAndUpdate(
        { ownerType: 'topic', owner: topicId, type: 'video' },
        {
          $set: {
            courseId: courseId,
            unitId: unitId,
            title: content.lectureVideo.title || title,
            status: videoStatus,
            isPremium: !!content.lectureVideo.isPremium,
            filename: content.lectureVideo.filename,
            filePath: content.lectureVideo.filePath,
            fileSize: content.lectureVideo.fileSize,
            metadata: { duration: content.lectureVideo.duration },
            gridFsFileId: content.lectureVideo.gridFsFileId,
            uploadedBy: content.lectureVideo.uploadedBy || req.user.id,
            uploadDate: content.lectureVideo.uploadDate || new Date()
          }
        },
        { new: true, upsert: !!content.lectureVideo.filename }
      ));
      console.log(`✅ Video ContentAsset upserted with courseId: ${courseId}, unitId: ${unitId}, status: ${videoStatus}`);
    }
    if (content?.notes) {
      const notesStatus = req.user.role === 'super_admin' ? 'approved' : (content.notes.status || 'pending');
      upserts.push(ContentAsset.findOneAndUpdate(
        { ownerType: 'topic', owner: topicId, type: 'notes' },
        {
          $set: {
            courseId: courseId,
            unitId: unitId,
            title: content.notes.title || `${title || 'Notes'}`,
            status: notesStatus,
            isPremium: !!content.notes.isPremium,
            filename: content.notes.filename,
            filePath: content.notes.filePath,
            fileSize: content.notes.fileSize,
            gridFsFileId: content.notes.gridFsFileId,
            uploadedBy: content.notes.uploadedBy || req.user.id,
            uploadDate: content.notes.uploadDate || new Date()
          }
        },
        { new: true, upsert: !!content.notes.filename }
      ));
      console.log(`✅ Notes ContentAsset upserted with courseId: ${courseId}, unitId: ${unitId}, status: ${notesStatus}`);
    }
    // Skipping youtubeResources upsert for now (schema requires filename/filePath)
    await Promise.all(upserts);

    res.json({ message: 'Topic updated', topic });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id/units/:unitId/topics
// @desc    Get topics for a specific unit
// @access  Public
router.get('/:id/units/:unitId/topics', async (req, res) => {
  try {
    const { id: courseId, unitId } = req.params;
    const Topic = require('../models/Topic');
    
    const topics = await Topic.find({ unitId })
      .select('topicNumber title description learningOutcomes createdAt updatedAt')
      .sort({ topicNumber: 1 })
      .lean();
    
    res.json({ topics });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/units/:unitId/topics/:topicId
// @desc    Delete a topic and its associated content
// @access  Private (Mini Admin or Super Admin)
router.delete('/:id/units/:unitId/topics/:topicId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const { id: courseId, unitId, topicId } = req.params;
    const Topic = require('../models/Topic');
    const ContentAsset = require('../models/ContentAsset');
    
    // Delete the topic
    const deletedTopic = await Topic.findOneAndDelete({ _id: topicId, unitId });
    
    if (!deletedTopic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Delete all ContentAssets associated with this topic
    await ContentAsset.deleteMany({ ownerType: 'topic', owner: topicId });
    
    res.json({ message: 'Topic and associated content deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses
// @desc    Get courses by institution
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { institution, search, department } = req.query;
    let query = { isActive: true };

    if (institution) {
      query.institution = institution;
    }

    if (department) {
      query.department = new RegExp(department, 'i');
    }

    if (search) {
      query.$text = { $search: search };
    }

    const projection = 'name code department duration description requirements careerProspects subcourses fees popularity institution academicYears';

    const courses = await Course.find(query)
      .select(projection)
      .populate('institution', 'name shortName logo colors type location')
      .sort({ popularity: -1, name: 1 })
      .lean({ getters: true, virtuals: false });

    res.json({
      courses,
      total: courses.length
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID with units (normalized schema support)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('institution', 'name shortName logo colors');

    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Fetch units from normalized Unit collection for backward compatibility
    const Unit = require('../models/Unit');
    const Topic = require('../models/Topic');
    const units = await Unit.find({ courseId: course._id })
      .select('year semester subcourse unitCode unitName creditHours description prerequisites isCore')
      .lean();

    // Attach minimal topics per unit
    const unitIds = units.map(u => u._id);
    let topicsByUnit = new Map();
    if (unitIds.length > 0) {
      const topics = await Topic.find({ unitId: { $in: unitIds } })
        .select('unitId topicNumber title description')
        .lean();
      topicsByUnit = topics.reduce((map, t) => {
        if (!t.unitId) {
          return map;
        }
        const key = t.unitId.toString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({
          topicNumber: t.topicNumber,
          title: t.title,
          description: t.description
        });
        return map;
      }, new Map());
    }

    const enrichedUnits = units.map(u => ({
      _id: u._id,
      year: u.year,
      semester: u.semester,
      subcourse: u.subcourse || '',
      unitCode: u.unitCode,
      unitName: u.unitName,
      creditHours: u.creditHours,
      description: u.description,
      prerequisites: u.prerequisites || [],
      isCore: u.isCore !== false,
      topics: (topicsByUnit.get(u._id.toString()) || []).sort((a, b) => (a.topicNumber || 0) - (b.topicNumber || 0))
    }));

    // Increment popularity
    course.popularity += 1;
    await course.save();

    const courseObj = course.toObject();
    courseObj.units = enrichedUnits;

    res.json({ course: courseObj });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/academic-years
// @desc    Add academic year to course
// @access  Private (Mini Admin or Super Admin)
router.post('/:id/academic-years', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const validationErrors = validateAcademicYearPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const newYear = {
      name: req.body.name.trim(),
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      isActive: Boolean(req.body.isActive),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    course.academicYears.push(newYear);
    const createdYear = course.academicYears[course.academicYears.length - 1];

    if (createdYear.isActive) {
      ensureSingleActiveAcademicYear(course, createdYear._id);
    } else {
      ensureSingleActiveAcademicYear(course);
    }

    await course.save();

    res.status(201).json({
      message: 'Academic year added successfully',
      academicYear: createdYear,
      course
    });
  } catch (error) {
    console.error('Add academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/academic-years/:yearId
// @desc    Update academic year
// @access  Private (Mini Admin or Super Admin)
router.put('/:id/academic-years/:yearId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const validationErrors = validateAcademicYearPayload({ ...req.body, name: req.body.name ?? '' });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const index = findAcademicYearIndex(course, req.params.yearId);
    if (index === -1) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    const year = course.academicYears[index];

    year.name = req.body.name.trim();
    year.startDate = req.body.startDate ? new Date(req.body.startDate) : undefined;
    year.endDate = req.body.endDate ? new Date(req.body.endDate) : undefined;
    year.isActive = Boolean(req.body.isActive);
    year.updatedAt = new Date();

    if (year.isActive) {
      ensureSingleActiveAcademicYear(course, year._id);
    } else {
      ensureSingleActiveAcademicYear(course);
    }

    await course.save();

    res.json({
      message: 'Academic year updated successfully',
      academicYear: year,
      course
    });
  } catch (error) {
    console.error('Update academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/courses/:id/academic-years/:yearId/activate
// @desc    Set academic year as active
// @access  Private (Mini Admin or Super Admin)
router.patch('/:id/academic-years/:yearId/activate', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const index = findAcademicYearIndex(course, req.params.yearId);
    if (index === -1) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    ensureSingleActiveAcademicYear(course, req.params.yearId);
    course.academicYears[index].updatedAt = new Date();

    await course.save();

    res.json({
      message: 'Academic year activated successfully',
      academicYear: course.academicYears[index],
      course
    });
  } catch (error) {
    console.error('Activate academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/academic-years/:yearId
// @desc    Remove academic year from course
// @access  Private (Mini Admin or Super Admin)
router.delete('/:id/academic-years/:yearId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const index = findAcademicYearIndex(course, req.params.yearId);
    if (index === -1) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    course.academicYears.splice(index, 1);
    ensureSingleActiveAcademicYear(course);

    await course.save();

    res.json({
      message: 'Academic year deleted successfully',
      course
    });
  } catch (error) {
    console.error('Delete academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id/units/:year
// @desc    Get units for a specific year (normalized schema)
// @access  Public
router.get('/:id/units/:year', async (req, res) => {
  try {
    const { id, year } = req.params;
    const course = await Course.findById(id).select('name code isActive');

    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const Unit = require('../models/Unit');
    const units = await Unit.find({ courseId: id, year: parseInt(year, 10) })
      .select('year semester subcourse unitCode unitName creditHours description prerequisites isCore')
      .lean();

    const unitsBySemester = units.reduce((acc, unit) => {
      const sem = Number(unit.semester) || 1;
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push({
        _id: unit._id,
        year: unit.year,
        semester: unit.semester,
        subcourse: unit.subcourse || '',
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        creditHours: unit.creditHours,
        description: unit.description,
        prerequisites: unit.prerequisites || [],
        isCore: unit.isCore !== false
      });
      return acc;
    }, {});

    res.json({ 
      course: {
        id: course._id,
        name: course.name,
        code: course.code
      },
      year: parseInt(year, 10),
      units: unitsBySemester
    });
  } catch (error) {
    console.error('Get course units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// @desc    Soft delete course
// @access  Private (Mini Admin or Super Admin)
router.delete('/:id', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isActive) {
      return res.status(200).json({ message: 'Course already inactive' });
    }

    course.isActive = false;
    await course.save();

    res.json({
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/units
// @desc    Add unit to course
// @access  Private (Mini Admin or Super Admin)
router.post('/:id/units', [
  auth,
  authorize('mini_admin', 'super_admin'),
  body('year').isInt({ min: 1, max: 6 }),
  body('semester').isInt({ min: 1, max: 12 }),
  body('unitCode').trim().isLength({ min: 2 }),
  body('unitName').trim().isLength({ min: 2 }),
  body('creditHours').isInt({ min: 1, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const maxYears = Number.isInteger(course.duration?.years) ? course.duration.years : 6;
    const scheduleType = course.scheduleType === 'terms' ? 'terms' : 'semesters';
    const durationPeriods = Number.isInteger(course.duration?.semesters)
      ? course.duration.semesters
      : 12;

    const requestedYear = Number.parseInt(req.body.year, 10);
    if (!Number.isInteger(requestedYear) || requestedYear < 1 || requestedYear > maxYears) {
      return res.status(400).json({
        errors: [{
          param: 'year',
          msg: `Year must be between 1 and ${maxYears}`,
          value: req.body.year
        }]
      });
    }

    const requestedSemester = Number.parseInt(req.body.semester, 10);
    if (!Number.isInteger(requestedSemester) || requestedSemester < 1 || requestedSemester > durationPeriods) {
      const label = scheduleType === 'terms' ? 'Term' : 'Semester';
      return res.status(400).json({
        errors: [{
          param: 'semester',
          msg: `${label} must be between 1 and ${durationPeriods}`,
          value: req.body.semester
        }]
      });
    }

    // Normalize subcourse for comparison
    const requestedSubcourse = typeof req.body.subcourse === 'string'
      ? req.body.subcourse.trim().toLowerCase()
      : '';

    // Check if unit code already exists within the same subcourse for the course
    const existingUnit = course.units.find(unit => {
      const unitSubcourse = typeof unit.subcourse === 'string'
        ? unit.subcourse.trim().toLowerCase()
        : '';

      return (
        unit.unitCode === req.body.unitCode.toUpperCase() &&
        unitSubcourse === requestedSubcourse
      );
    });

    if (existingUnit) {
      return res.status(400).json({ 
        message: 'Unit with this code already exists in this subcourse for the course' 
      });
    }

    const newUnit = {
      year: req.body.year,
      semester: req.body.semester,
      subcourse: req.body.subcourse ? req.body.subcourse.trim() : '',
      unitCode: req.body.unitCode.toUpperCase(),
      unitName: req.body.unitName.trim(),
      creditHours: req.body.creditHours,
      description: req.body.description,
      prerequisites: req.body.prerequisites || [],
      isCore: req.body.isCore !== false
    };

    course.units.push(newUnit);

    // Add to course.unitIds array only if not present
    if (!course.unitIds) course.unitIds = [];
    if (!course.unitIds.map(id => id.toString()).includes(newUnit._id.toString())) {
      course.unitIds.push(newUnit._id);
    }

    await course.save();

    res.status(201).json({
      message: 'Unit added successfully',
      unit: newUnit,
      course
    });
  } catch (error) {
    console.error('Add unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/units/:unitId
// @desc    Update unit in course
// @access  Private (Mini Admin or Super Admin)
router.put('/:id/units/:unitId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const unitIndex = course.units.findIndex(unit => 
      unit._id.toString() === req.params.unitId
    );

    if (unitIndex === -1) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    const maxYears = Number.isInteger(course.duration?.years) ? course.duration.years : 6;
    const scheduleType = course.scheduleType === 'terms' ? 'terms' : 'semesters';
    const durationPeriods = Number.isInteger(course.duration?.semesters)
      ? course.duration.semesters
      : 12;

    if (req.body.year !== undefined) {
      const requestedYear = Number.parseInt(req.body.year, 10);
      if (!Number.isInteger(requestedYear) || requestedYear < 1 || requestedYear > maxYears) {
        return res.status(400).json({
          errors: [{
            param: 'year',
            msg: `Year must be between 1 and ${maxYears}`,
            value: req.body.year
          }]
        });
      }
    }

    if (req.body.semester !== undefined) {
      const requestedSemester = Number.parseInt(req.body.semester, 10);
      if (!Number.isInteger(requestedSemester) || requestedSemester < 1 || requestedSemester > durationPeriods) {
        const label = scheduleType === 'terms' ? 'Term' : 'Semester';
        return res.status(400).json({
          errors: [{
            param: 'semester',
            msg: `${label} must be between 1 and ${durationPeriods}`,
            value: req.body.semester
          }]
        });
      }
    }

    const requestedSubcourse = typeof req.body.subcourse === 'string'
      ? req.body.subcourse.trim().toLowerCase()
      : (course.units[unitIndex].subcourse || '').trim().toLowerCase();

    // Check if unit code already exists in other units within the same subcourse
    const existingUnit = course.units.find((unit, index) => {
      if (index === unitIndex) {
        return false;
      }

      const unitSubcourse = typeof unit.subcourse === 'string'
        ? unit.subcourse.trim().toLowerCase()
        : '';

      return (
        unit.unitCode === req.body.unitCode.toUpperCase() &&
        unitSubcourse === requestedSubcourse
      );
    });

    if (existingUnit) {
      return res.status(400).json({ 
        message: 'Unit with this code already exists in this subcourse for the course' 
      });
    }

    // Update the unit
    course.units[unitIndex] = {
      ...course.units[unitIndex].toObject(),
      ...req.body,
      subcourse: typeof req.body.subcourse === 'string' ? req.body.subcourse.trim() : course.units[unitIndex].subcourse,
      unitCode: req.body.unitCode.toUpperCase()
    };

    await course.save();

    res.json({
      message: 'Unit updated successfully',
      course
    });
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/units/:unitId
// @desc    Delete unit from course
// @access  Private (Mini Admin or Super Admin)
router.delete('/:id/units/:unitId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const unitIndex = course.units.findIndex(unit => 
      unit._id.toString() === req.params.unitId
    );

    if (unitIndex === -1) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    course.units.splice(unitIndex, 1);
    await course.save();

    res.json({
      message: 'Unit deleted successfully',
      course
    });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Legacy embedded-schema route removed - using normalized collections (see line 23)

// @route   PUT /api/courses/:id/units/:unitId/topics/:topicId
// @desc    Update topic in unit
// @access  Private (Mini Admin or Super Admin)
router.put('/:id/units/:unitId/topics/:topicId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const unit = course.units.id(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    const topic = unit.topics.id(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Update topic
    Object.assign(topic, req.body);
    await course.save();

    res.json({
      message: 'Topic updated successfully',
      course
    });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/units/:unitId/topics/:topicId
// @desc    Delete topic from unit
// @access  Private (Mini Admin or Super Admin)
router.delete('/:id/units/:unitId/topics/:topicId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const unit = course.units.id(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    unit.topics.pull(req.params.topicId);
    await course.save();

    res.json({
      message: 'Topic deleted successfully',
      course
    });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/units/:unitId/assessments/:type
// @desc    Add assessment to unit (cats, assignments, pastExams)
// @access  Private (Mini Admin or Super Admin)
router.post('/:id/units/:unitId/assessments/:type', [
  auth,
  authorize('mini_admin', 'super_admin'),
  upload.single('image'),
  body('title').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type } = req.params;
    if (!['cats', 'assignments', 'pastExams'].includes(type)) {
      return res.status(400).json({ message: 'Invalid assessment type' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const Unit = require('../models/Unit');
    const Assessment = require('../models/Assessment');
    const unitDoc = await Unit.findById(req.params.unitId);
    if (!unitDoc) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    const payload = { ...req.body };

    if (payload.academicYear && typeof payload.academicYear === 'string') {
      payload.academicYear = payload.academicYear.trim();
    }

    ['totalMarks', 'duration', 'year', 'semester'].forEach((field) => {
      if (payload[field] !== undefined) {
        const numericValue = Number(payload[field]);
        if (!Number.isNaN(numericValue)) {
          payload[field] = numericValue;
        }
      }
    });

    payload.uploadDate = new Date();
    payload.uploadedBy = req.user.id;
    payload.status = payload.status || 'pending';
    payload.courseId = course._id;
    payload.unitId = unitDoc._id;
    payload.type = (type === 'cats') ? 'cat' : (type === 'assignments' ? 'assignment' : 'pastExam');

    if (req.file) {
      const extension = req.file.mimetype?.split('/')?.[1] || req.file.originalname.split('.').pop();
      payload.filename = req.file.filename;
      payload.filePath = req.file.path;
      payload.fileSize = req.file.size;
      payload.imageType = extension?.toLowerCase();
    }

    // Create new Assessment document
    const newAssessment = await Assessment.create(payload);

    // Link assessment to unit
    if (!unitDoc.assessmentIds) unitDoc.assessmentIds = [];
    unitDoc.assessmentIds.push(newAssessment._id);
    await unitDoc.save();

    // Link assessment to course
    if (!course.assessmentIds) course.assessmentIds = [];
    course.assessmentIds.push(newAssessment._id);
    await course.save();

    // Add to legacy in-memory array for compatibility
    const unit = course.units.id(req.params.unitId);
    if (unit) {
      if (!unit.assessments) unit.assessments = { cats: [], assignments: [], pastExams: [] };
      unit.assessments[type].push(payload);
    }

    res.status(201).json({
      message: `${type.slice(0, -1)} added successfully`,
      assessment: newAssessment,
      course
    });
  } catch (error) {
    console.error('Add assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/units/:unitId/assessments/:type/:assessmentId
// @desc    Update assessment in unit
// @access  Private (Mini Admin or Super Admin)
router.put('/:id/units/:unitId/assessments/:type/:assessmentId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const { type } = req.params;
    if (!['cats', 'assignments', 'pastExams'].includes(type)) {
      return res.status(400).json({ message: 'Invalid assessment type' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const unit = course.units.id(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    const assessment = unit.assessments[type].id(req.params.assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    Object.assign(assessment, req.body);
    await course.save();

    res.json({
      message: `${type.slice(0, -1)} updated successfully`,
      course
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/units/:unitId/assessments/:type/:assessmentId
// @desc    Delete assessment from unit
// @access  Private (Mini Admin or Super Admin)
router.delete('/:id/units/:unitId/assessments/:type/:assessmentId', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const { type } = req.params;
    if (!['cats', 'assignments', 'pastExams'].includes(type)) {
      return res.status(400).json({ message: 'Invalid assessment type' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const unit = course.units.id(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    unit.assessments[type].pull(req.params.assessmentId);
    await course.save();

    res.json({
      message: `${type.slice(0, -1)} deleted successfully`,
      course
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
