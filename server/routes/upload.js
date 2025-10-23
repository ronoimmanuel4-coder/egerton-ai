const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { uploadSingle, handleUploadError, uploadVideo, uploadNotes, uploadAssessment } = require('../middleware/upload');
const { auth, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Unit = require('../models/Unit');
const Topic = require('../models/Topic');
const ContentAsset = require('../models/ContentAsset');
const Assessment = require('../models/Assessment');
const mongoose = require('mongoose');

const uploadDirs = [
  path.join(__dirname, '../uploads/videos'),
  path.join(__dirname, '../uploads/notes'),
  path.join(__dirname, '../uploads/assessments')
];

// Helper: Save a disk file to GridFS and return the new fileId
async function saveToGridFS(localFilePath, filename, mimetype, metadata = {}) {
  return new Promise((resolve, reject) => {
    try {
      const db = mongoose.connection.db;
      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
      const readStream = fs.createReadStream(localFilePath);
      const uploadStream = bucket.openUploadStream(filename, { contentType: mimetype, metadata });
      readStream.pipe(uploadStream)
        .on('error', (err) => reject(err))
        .on('finish', () => resolve(uploadStream.id));
    } catch (err) {
      reject(err);
    }
  });
}

// @route   POST /api/upload/video
// @desc    Upload lecture video (file only, metadata saved separately via topic endpoint)
// @access  Private (Mini Admin or Super Admin)
router.post('/video', [
  auth,
  authorize('mini_admin', 'super_admin'),
  uploadSingle,
  handleUploadError
], async (req, res) => {
  try {
    console.log('🎥 Video upload request received');
    console.log('📊 Request details:', {
      contentLength: req.headers['content-length'],
      contentType: req.headers['content-type'],
      hasFile: !!req.file,
      userId: req.user.id,
      userRole: req.user.role
    });

    if (!req.file) {
      console.log('❌ No video file in request');
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    console.log('✅ Video file received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Persist to GridFS and remove disk file
    let gridId = null;
    try {
      gridId = await saveToGridFS(req.file.path, req.file.filename, req.file.mimetype, { uploadedBy: req.user.id, type: 'video' });
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      console.log('✅ Video file stored in GridFS:', gridId?.toString());
    } catch (gErr) {
      console.error('❌ Failed to store video in GridFS, keeping disk file:', gErr.message);
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      gridFsFileId: gridId,
      uploadDate: new Date(),
      uploadedBy: req.user.id
    };

    console.log('✅ Video file processed, returning file info (includes gridFsFileId if available)');

    res.json({
      message: 'Video uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('❌ Video upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error during video upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/upload/notes
// @desc    Upload PDF notes (file only, metadata saved separately via topic endpoint)
// @access  Private (Mini Admin or Super Admin)
router.post('/notes', [
  auth,
  authorize('mini_admin', 'super_admin'),
  uploadSingle,
  handleUploadError
], async (req, res) => {
  try {
    console.log('📄 Notes upload request received');
    console.log('📊 Request details:', {
      contentLength: req.headers['content-length'],
      contentType: req.headers['content-type'],
      hasFile: !!req.file,
      userId: req.user.id,
      userRole: req.user.role
    });

    if (!req.file) {
      console.log('❌ No PDF file in request');
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    console.log('✅ PDF file received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Persist to GridFS and remove disk file
    let gridId = null;
    try {
      gridId = await saveToGridFS(req.file.path, req.file.filename, req.file.mimetype, { uploadedBy: req.user.id, type: 'notes' });
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      console.log('✅ Notes file stored in GridFS:', gridId?.toString());
    } catch (gErr) {
      console.error('❌ Failed to store notes in GridFS, keeping disk file:', gErr.message);
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      gridFsFileId: gridId,
      uploadDate: new Date(),
      uploadedBy: req.user.id
    };

    console.log('✅ Notes file processed, returning file info (includes gridFsFileId if available)');

    res.json({
      message: 'Notes uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('❌ Notes upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error during notes upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Normalized lecture video upload
router.post('/courses/:courseId/units/:unitId/topics/:topicId/video', [
  auth,
  authorize('mini_admin', 'super_admin'),
  uploadVideo
], async (req, res) => {
  try {
    const { courseId, unitId, topicId } = req.params;
    const { title, description, isPremium, duration } = req.body;

    const [course, unit, topic] = await Promise.all([
      Course.findById(courseId),
      Unit.findById(unitId),
      Topic.findById(topicId)
    ]);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (!unit || unit.courseId.toString() !== courseId) {
      return res.status(404).json({ message: 'Unit not found for this course' });
    }
    if (!topic || topic.unitId.toString() !== unitId) {
      return res.status(404).json({ message: 'Topic not found for this unit' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const asset = await ContentAsset.create({
      type: 'video',
      ownerType: 'topic',
      owner: topic._id,
      courseId: course._id,
      unitId: unit._id,
      title: title?.trim() || req.file.originalname,
      description: description?.trim(),
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      metadata: {
        duration,
        originalName: req.file.originalname
      },
      status: 'pending',
      isPremium: isPremium === 'true',
      uploadedBy: req.user.id
    });

    topic.lectureVideoId = asset._id;
    await topic.save();

    course.topicIds = course.topicIds || [];
    if (!course.topicIds.some((id) => id.toString() === topic._id.toString())) {
      course.topicIds.push(topic._id);
      await course.save({ validateBeforeSave: false });
    }

    res.json({
      message: 'Lecture video uploaded successfully',
      assetId: asset._id
    });
  } catch (error) {
    console.error('Normalized lecture video upload error:', error);
    res.status(500).json({ message: 'Server error during video upload' });
  }
});

// Normalized notes upload
router.post('/courses/:courseId/units/:unitId/topics/:topicId/notes', [
  auth,
  authorize('mini_admin', 'super_admin'),
  uploadNotes
], async (req, res) => {
  try {
    const { courseId, unitId, topicId } = req.params;
    const { title, description, isPremium } = req.body;

    const [course, unit, topic] = await Promise.all([
      Course.findById(courseId),
      Unit.findById(unitId),
      Topic.findById(topicId)
    ]);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (!unit || unit.courseId.toString() !== courseId) {
      return res.status(404).json({ message: 'Unit not found for this course' });
    }
    if (!topic || topic.unitId.toString() !== unitId) {
      return res.status(404).json({ message: 'Topic not found for this unit' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No notes file uploaded' });
    }

    const asset = await ContentAsset.create({
      type: 'notes',
      ownerType: 'topic',
      owner: topic._id,
      courseId: course._id,
      unitId: unit._id,
      title: title?.trim() || req.file.originalname,
      description: description?.trim(),
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname
      },
      status: 'pending',
      isPremium: isPremium === 'true',
      uploadedBy: req.user.id
    });

    topic.notesId = asset._id;
    await topic.save();

    course.topicIds = course.topicIds || [];
    if (!course.topicIds.some((id) => id.toString() === topic._id.toString())) {
      course.topicIds.push(topic._id);
      await course.save({ validateBeforeSave: false });
    }

    res.json({
      message: 'Notes uploaded successfully',
      assetId: asset._id
    });
  } catch (error) {
    console.error('Normalized notes upload error:', error);
    res.status(500).json({ message: 'Server error during notes upload' });
  }
});

// Normalized assessment upload
router.post('/courses/:courseId/units/:unitId/assessments', [
  auth,
  authorize('mini_admin', 'super_admin'),
  uploadAssessment
], async (req, res) => {
  try {
    const { courseId, unitId } = req.params;
    const {
      type,
      title,
      description,
      isPremium,
      academicYear,
      examType,
      examYear,
      examSemester,
      dueDate,
      totalMarks
    } = req.body;

    if (!['cat', 'assignment', 'pastExam'].includes(type)) {
      return res.status(400).json({ message: 'Invalid assessment type' });
    }

    const [course, unit] = await Promise.all([
      Course.findById(courseId),
      Unit.findById(unitId)
    ]);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (!unit || unit.courseId.toString() !== courseId) {
      return res.status(404).json({ message: 'Unit not found for this course' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No assessment file uploaded' });
    }

    const asset = await ContentAsset.create({
      type: 'document',
      ownerType: 'unit',
      owner: unit._id,
      courseId: course._id,
      unitId: unit._id,
      title: title?.trim() || req.file.originalname,
      description: description?.trim(),
      filename: req.file.filename,
      filePath: undefined,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      metadata: {
        extension: path.extname(req.file.originalname).replace('.', ''),
        originalName: req.file.originalname
      },
      status: 'pending',
      isPremium: isPremium !== 'false',
      uploadedBy: req.user.id
    });

    // Save binary to GridFS
    let gridId = null;
    try {
      gridId = await saveToGridFS(req.file.path, req.file.filename, req.file.mimetype, { uploadedBy: req.user.id, type: 'assessment' });
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      console.log('✅ Assessment file stored in GridFS:', gridId?.toString());
    } catch (gErr) {
      console.error('❌ Failed to store assessment in GridFS, keeping disk file:', gErr.message);
    }

    const assessment = await Assessment.create({
      courseId: course._id,
      unitId: unit._id,
      type,
      title: title?.trim() || req.file.originalname,
      description: description?.trim(),
      academicYear,
      examMetadata: {
        year: examYear ? Number(examYear) : undefined,
        semester: examSemester ? Number(examSemester) : undefined,
        examType: examType || undefined
      },
      dueDate: dueDate ? new Date(dueDate) : undefined,
      totalMarks: totalMarks ? Number(totalMarks) : undefined,
      contentAssetId: asset._id,
      status: 'pending',
      isPremium: isPremium !== 'false',
      uploadDate: new Date(),
      uploadedBy: req.user.id,
      createdBy: req.user.id,
      createdByName: `${req.user.firstName} ${req.user.lastName}`,
      filename: req.file.filename,
      filePath: undefined,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).substring(1),
      imageFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: undefined,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      gridFsFileId: gridId
    });

    // Update the ContentAsset with gridFsFileId as well
    if (gridId) {
      try {
        await ContentAsset.findByIdAndUpdate(asset._id, { gridFsFileId: gridId });
      } catch (e) {
        console.warn('Could not update ContentAsset with gridFsFileId:', e.message);
      }
    }

    unit.assessmentIds = unit.assessmentIds || [];
    if (!unit.assessmentIds.some((id) => id.toString() === assessment._id.toString())) {
      unit.assessmentIds.push(assessment._id);
      await unit.save();
    }

    course.assessmentIds = course.assessmentIds || [];
    if (!course.assessmentIds.some((id) => id.toString() === assessment._id.toString())) {
      course.assessmentIds.push(assessment._id);
      await course.save({ validateBeforeSave: false });
    }

    res.json({
      message: 'Assessment uploaded successfully',
      assessmentId: assessment._id,
      assetId: asset._id
    });
  } catch (error) {
    console.error('Normalized assessment upload error:', error);
    res.status(500).json({ message: 'Server error during assessment upload' });
  }
});

// @route   POST /api/upload/assessment
// @desc    Upload assessment image (CAT, assignment, exam) and save to Assessment collection
// @access  Private (Mini Admin or Super Admin)
router.post('/assessment', [
  auth,
  authorize('mini_admin', 'super_admin'),
  uploadSingle,
  handleUploadError
], async (req, res) => {
  try {
    const Course = require('../models/Course');
    const Unit = require('../models/Unit');
    const Institution = require('../models/Institution');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const {
      title,
      courseId,
      unitId,
      description,
      dueDate,
      totalMarks,
      duration,
      instructions,
      assessmentType, // 'cat', 'assignment', or 'exam'
      academicYear,
      period
    } = req.body;

    // Validate required fields
    if (!title || !courseId || !unitId || !assessmentType) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, courseId, unitId, assessmentType' 
      });
    }

    // Map assessmentType to database type
    let dbType;
    if (assessmentType === 'cat' || assessmentType === 'cats') {
      dbType = 'cat';
    } else if (assessmentType === 'assignment' || assessmentType === 'assignments') {
      dbType = 'assignment';
    } else if (assessmentType === 'exam' || assessmentType === 'pastExams') {
      dbType = 'pastExam';
    } else {
      return res.status(400).json({ message: 'Invalid assessment type' });
    }

    // Find the course and unit
    const course = await Course.findById(courseId).populate('institution');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Try to find unit in Unit collection (normalized schema)
    let unit = await Unit.findById(unitId);
    let unitName = '';
    let unitCode = '';
    
    if (unit) {
      unitName = unit.unitName;
      unitCode = unit.unitCode;
    } else {
      // Fallback: check embedded units
      const embeddedUnit = course.units.id(unitId);
      if (embeddedUnit) {
        unitName = embeddedUnit.unitName;
        unitCode = embeddedUnit.unitCode;
      } else {
        return res.status(404).json({ message: 'Unit not found' });
      }
    }

    // Create assessment in Assessment collection
    let newAssessment;
    try {
      newAssessment = await Assessment.create({
      courseId: course._id,
      unitId: unitId,
      unitName: unitName,
      unitCode: unitCode,
      type: dbType,
      title: title.trim(),
      description: description || '',
      academicYear: academicYear || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      totalMarks: totalMarks ? parseInt(totalMarks) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      instructions: instructions || '',
      
      // File information
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).substring(1),
      imageFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      
      // Status and metadata
      status: 'pending', // Requires super admin approval
      isPremium: true,
      uploadDate: new Date(),
      uploadedBy: req.user.id,
      createdBy: req.user.id,
      createdByName: `${req.user.firstName} ${req.user.lastName}`,
      
      // Institution and department
      institutionId: course.institution?._id,
      department: course.department,
      
      // Additional fields
      maxViews: dbType === 'cat' ? 3 : 1,
      difficulty: 'medium',
      tags: [],
      viewCount: 0,
      submissionCount: 0,
      isActive: true
    });
    } catch (dbErr) {
      console.error('❌ Assessment.create error:', dbErr);
      return res.status(500).json({ message: 'Failed to save assessment', error: dbErr.message });
    }

    console.log(`✅ ${dbType.toUpperCase()} assessment saved to Assessment collection`);
    console.log(`📊 Course: ${course.name}, Unit: ${unitName}`);
    console.log(`👤 Uploaded by: ${req.user.firstName} ${req.user.lastName}`);
    console.log(`🔍 Assessment ID: ${newAssessment._id}`);
    console.log(`📝 Status: ${newAssessment.status} (pending super admin approval)`);

    res.json({
      message: `${dbType.toUpperCase()} assessment uploaded successfully and pending approval`,
      assessment: {
        id: newAssessment._id,
        title: newAssessment.title,
        courseId: newAssessment.courseId,
        unitId: newAssessment.unitId,
        unitName: newAssessment.unitName,
        unitCode: newAssessment.unitCode,
        type: newAssessment.type,
        status: newAssessment.status,
        filename: newAssessment.filename,
        uploadDate: newAssessment.uploadDate,
        createdBy: newAssessment.createdByName
      }
    });
  } catch (error) {
    console.error('Assessment upload error:', error);
    res.status(500).json({ message: 'Server error during assessment upload', error: error.message });
  }
});

// @route   OPTIONS /api/upload/file/:filename
// @desc    Handle preflight requests for file serving
// @access  Public
router.options('/file/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// @route   GET /api/upload/file/:filename
// @desc    Serve uploaded files with streaming support
// @access  Private (Authenticated users)
router.get('/file/:filename', async (req, res) => {
  let token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const { filename } = req.params;
    const gridFsId = req.query.gridFsId;
    const forceDownload = ['1', 'true', 'download'].includes((req.query.download || '').toString().toLowerCase());

    const StudentDownloadModel = require('../models/StudentDownload');
    const SubscriptionModel = require('../models/Subscription');
    const CourseModel = require('../models/Course');

    // If gridFsId is provided, stream from GridFS
    if (gridFsId) {
      const db = mongoose.connection.db;
      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
      try {
        const objectId = new mongoose.Types.ObjectId(gridFsId);
        const downloadStream = bucket.openDownloadStream(objectId);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return downloadStream.pipe(res);
      } catch (e) {
        console.error('GridFS stream error:', e.message);
        // fall through to disk lookup
      }
    }

    let filePath = null;
    let isVideo = false;
    for (const dir of uploadDirs) {
      const testPath = path.join(dir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        isVideo = dir.includes('videos');
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (filePath.includes(path.join('uploads', 'notes'))) {
      const { courseId, year, resourceId, resourceTitle, unitId, unitName, topicId, topicTitle, fileSize } = req.query;

      if (courseId && year && resourceId) {
        try {
          const numericYear = parseInt(year, 10);
          const subscription = await SubscriptionModel.getUserSubscription(req.user.id, courseId, numericYear);

          if (subscription && subscription.expiryDate) {
            let courseDetails = subscription.courseId;
            if (!courseDetails || !courseDetails.name) {
              courseDetails = await CourseModel.findById(courseId).select('name code');
            }

            await StudentDownloadModel.findOneAndUpdate(
              {
                userId: req.user.id,
                resourceId,
                filename
              },
              {
                userId: req.user.id,
                courseId,
                courseName: courseDetails?.name,
                courseCode: courseDetails?.code,
                subscriptionId: subscription._id,
                year: numericYear,
                unitId,
                unitName,
                topicId,
                topicTitle,
                resourceId,
                resourceTitle,
                filename,
                fileSize: fileSize ? parseInt(fileSize, 10) : undefined,
                downloadedAt: new Date(),
                expiresAt: subscription.expiryDate,
                origin: req.query.origin === 'resource' ? 'resource' : 'course_note'
              },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
          }
        } catch (downloadLogError) {
          console.error('Failed to log student download:', downloadLogError.message);
        }
      }
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filename).toLowerCase();

    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg'
    };

    const origin = req.headers.origin || 'http://localhost:3002';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    let contentType = contentTypeMap[ext] || 'application/octet-stream';

    if (isVideo && req.headers.range) {
      const range = req.headers.range;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length'
      });

      fileStream.pipe(res);
      return;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length');

    if (!isVideo) {
      const disposition = forceDownload ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`);
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({ message: 'Server error serving file' });
  }
});

// @route   DELETE /api/upload/file/:filename
// @desc    Delete uploaded file
// @access  Private (Mini Admin or Super Admin)
router.delete('/file/:filename', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Search in all upload directories
    let filePath = null;
    for (const dir of uploadDirs) {
      const testPath = path.join(dir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ message: 'Server error deleting file' });
  }
});

module.exports = router;
