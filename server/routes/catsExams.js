const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { auth: authenticateToken, authorize: requireRole } = require('../middleware/auth');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const mongoose = require('mongoose');

// Configure multer for secure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/secure-assessments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename with timestamp and random hash
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.type}_${timestamp}_${hash}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Mock data storage (replace with actual database)
let cats = [];
let exams = [];
let assessmentLogs = [];
let viewingSessions = new Map(); // Store active viewing sessions

// ADMIN ROUTES (Mini Admin and Super Admin)

// Test endpoint to verify routes are loaded
router.get('/admin/test-units', (req, res) => {
  res.json({
    success: true,
    message: 'CATsExams routes are loaded successfully',
    timestamp: new Date().toISOString()
  });
});

// Fix Egerton Units endpoint (Super Admin only)
router.post('/admin/fix-egerton-units', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    console.log('🔧 Starting Egerton units fix...');
    
    // Find Egerton University
    const Institution = require('../models/Institution');
    const egerton = await Institution.findOne({ name: /egerton/i });
    
    if (!egerton) {
      return res.status(404).json({
        success: false,
        message: 'Egerton University not found'
      });
    }
    
    // Find Egerton courses
    const egertonCourses = await Course.find({ institution: egerton._id });
    console.log(`Found ${egertonCourses.length} Egerton courses`);
    
    let updatedCourses = 0;
    let totalUnitsCreated = 0;
    
    for (const course of egertonCourses) {
      // Skip if course already has units
      if (course.units && course.units.length > 0) {
        console.log(`Skipping ${course.name} - already has units`);
        continue;
      }
      
      console.log(`Adding units to: ${course.name}`);
      
      // Create units based on course type
      const units = [];
      const totalYears = course.duration.years || 4;
      const unitsPerSemester = course.level === 'Certificate' ? 4 : 6;
      
      for (let year = 1; year <= totalYears; year++) {
        for (let semester = 1; semester <= 2; semester++) {
          for (let unitNum = 1; unitNum <= unitsPerSemester; unitNum++) {
            const unitCode = `${course.code}${year}${semester}${unitNum.toString().padStart(2, '0')}`;
            const unitName = `${course.name.split(' ').slice(-2).join(' ')} ${year}.${semester}.${unitNum}`;
            
            units.push({
              year: year,
              semester: semester,
              unitCode: unitCode,
              unitName: unitName,
              creditHours: 3,
              description: `Unit ${unitNum} for Year ${year} Semester ${semester}`,
              prerequisites: [],
              isCore: true,
              topics: [
                {
                  topicNumber: 1,
                  title: `Introduction to ${unitName}`,
                  description: `Foundational concepts`,
                  learningOutcomes: [`Understand basic concepts`],
                  content: {
                    lectureVideo: null,
                    notes: null,
                    youtubeResources: []
                  }
                }
              ],
              assessments: {
                cats: [],
                assignments: [],
                pastExams: []
              }
            });
          }
        }
      }
      
      // Update the course with units
      await Course.findByIdAndUpdate(course._id, { 
        $set: { units: units }
      });
      
      updatedCourses++;
      totalUnitsCreated += units.length;
      console.log(`Added ${units.length} units to ${course.name}`);
    }
    
    res.json({
      success: true,
      message: 'Egerton University units restored successfully',
      data: {
        coursesUpdated: updatedCourses,
        totalUnitsCreated: totalUnitsCreated,
        totalCourses: egertonCourses.length
      }
    });
    
  } catch (error) {
    console.error('Error fixing Egerton units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix Egerton units',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all Units (Admin)
router.get('/admin/units', authenticateToken, requireRole('mini_admin', 'super_admin'), async (req, res) => {
  try {
    // Fetch all courses and extract their units
    const courses = await Course.find({ isActive: true })
      .populate('institution', 'name shortName')
      .select('name code department institution units')
      .lean();

    console.log(`Found ${courses.length} courses in database`);
    
    // Extract all units from all courses and flatten them
    const allUnits = [];
    
    courses.forEach(course => {
      console.log(`Course: ${course.name} has ${course.units?.length || 0} units`);
      if (course.units && course.units.length > 0) {
        course.units.forEach(unit => {
          console.log(`  Unit: ${unit.unitCode} - ${unit.unitName}`);
          allUnits.push({
            _id: unit._id, // This is the actual MongoDB ObjectId
            name: unit.unitName,
            code: unit.unitCode,
            department: course.department,
            courseName: course.name,
            courseCode: course.code,
            institutionName: course.institution?.name || 'Unknown Institution',
            year: unit.year,
            semester: unit.semester,
            creditHours: unit.creditHours,
            description: unit.description,
            isCore: unit.isCore,
            prerequisites: unit.prerequisites || []
          });
        });
      }
    });

    console.log(`Total units found: ${allUnits.length}`);

    // Remove duplicates based on unit _id (ObjectId is unique)
    const uniqueUnits = allUnits.reduce((acc, current) => {
      const existing = acc.find(unit => unit._id.toString() === current._id.toString());
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Sort units by code
    uniqueUnits.sort((a, b) => a.code.localeCompare(b.code));

    console.log(`Returning ${uniqueUnits.length} unique units`);

    // If no units found in seeded courses, provide some sample units for testing
    if (uniqueUnits.length === 0) {
      console.log('No units found in seeded courses, providing sample units');
      
      // Get a few courses to create sample units for
      const sampleCourses = courses.slice(0, 5);
      const sampleUnits = [];
      
      sampleCourses.forEach((course, courseIndex) => {
        // Create 3-5 sample units per course
        const unitsPerCourse = 3 + (courseIndex % 3); // 3-5 units
        
        for (let i = 1; i <= unitsPerCourse; i++) {
          const unitCode = `${course.code}${i.toString().padStart(2, '0')}`;
          sampleUnits.push({
            _id: new mongoose.Types.ObjectId(), // Create a proper ObjectId
            name: `${course.name} - Unit ${i}`,
            code: unitCode,
            department: course.department,
            courseName: course.name,
            courseCode: course.code,
            institutionName: course.institution?.name || 'Unknown Institution',
            year: Math.ceil(i / 2), // Year 1-3 based on unit number
            semester: (i % 2) + 1, // Semester 1 or 2
            creditHours: 3,
            description: `Unit ${i} of ${course.name}`,
            isCore: true,
            prerequisites: i > 1 ? [`${course.code}${(i-1).toString().padStart(2, '0')}`] : []
          });
        }
      });
      
      res.json({
        success: true,
        data: {
          units: sampleUnits,
          totalUnits: sampleUnits.length,
          totalCourses: courses.length,
          note: 'Generated sample units from seeded courses'
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          units: uniqueUnits,
          totalUnits: uniqueUnits.length,
          totalCourses: courses.length
        }
      });
    }
  } catch (error) {
    console.error('Error fetching Units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Units from database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all CATs (Admin)
router.get('/admin/cats', authenticateToken, requireRole('mini_admin', 'super_admin'), async (req, res) => {
  try {
    // Build query based on user role
    let query = { type: 'cat', isActive: true };
    
    // Mini admins can only see their own CATs, super admins see all
    if (req.user.role === 'mini_admin') {
      query.createdBy = req.user.id;
    }
    
    // Fetch CATs from database
    const cats = await Assessment.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    // Format the response
    const formattedCATs = cats.map(cat => ({
      ...cat,
      imageUrl: `/api/secure-images/cat/${cat._id}`,
      statusDisplay: cat.statusDisplay,
      timeRemaining: new Date(cat.dueDate) - new Date()
    }));

    res.json({
      success: true,
      data: {
        cats: formattedCATs,
        totalCATs: formattedCATs.length
      }
    });
  } catch (error) {
    console.error('Error fetching CATs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CATs from database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all Exams (Admin)
router.get('/admin/exams', authenticateToken, requireRole('mini_admin', 'super_admin'), async (req, res) => {
  try {
    // Build query based on user role
    let query = { type: 'exam', isActive: true };
    
    // Mini admins can only see their own Exams, super admins see all
    if (req.user.role === 'mini_admin') {
      query.createdBy = req.user.id;
    }
    
    // Fetch Exams from database
    const exams = await Assessment.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ dueDate: 1 }) // Sort exams by due date
      .lean();

    // Format the response
    const formattedExams = exams.map(exam => ({
      ...exam,
      imageUrl: `/api/secure-images/exam/${exam._id}`,
      statusDisplay: exam.statusDisplay,
      timeRemaining: new Date(exam.dueDate) - new Date()
    }));

    res.json({
      success: true,
      data: {
        exams: formattedExams,
        totalExams: formattedExams.length
      }
    });
  } catch (error) {
    console.error('Error fetching Exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Exams from database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new CAT
router.post('/admin/cats', authenticateToken, requireRole('mini_admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      unitId,
      unitName,
      description,
      dueDate,
      totalMarks,
      duration,
      instructions
    } = req.body;

    // Validate required fields
    if (!title || !unitId || !dueDate || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, unitId, dueDate, and image are required'
      });
    }

    // Find the unit to get additional context
    const unit = await Course.findOne(
      { 'units._id': unitId },
      { 'units.$': 1, name: 1, code: 1, department: 1, institution: 1 }
    ).populate('institution', 'name');

    let unitCode = 'UNKNOWN';
    if (unit && unit.units && unit.units[0]) {
      unitCode = unit.units[0].unitCode;
    }

    // Create new CAT in database
    const newCAT = new Assessment({
      title,
      type: 'cat',
      unitId,
      unitName,
      unitCode,
      description,
      instructions,
      dueDate: new Date(dueDate),
      totalMarks: parseInt(totalMarks) || 30,
      duration: parseInt(duration) || 60,
      imageFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      createdBy: req.user.id,
      createdByName: `${req.user.firstName} ${req.user.lastName}`,
      status: 'active',
      maxViews: 3,
      // Additional context from unit
      courseId: unit?._id,
      department: unit?.department,
      institutionId: unit?.institution?._id
    });

    await newCAT.save();

    res.status(201).json({
      success: true,
      message: 'CAT created successfully',
      data: { 
        cat: {
          ...newCAT.toObject(),
          imageUrl: `/api/secure-images/cat/${newCAT._id}`
        }
      }
    });

  } catch (error) {
    console.error('Error creating CAT:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create CAT'
    });
  }
});

// Create new Exam
router.post('/admin/exams', authenticateToken, requireRole('mini_admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      unitId,
      unitName,
      description,
      dueDate,
      totalMarks,
      duration,
      instructions
    } = req.body;

    // Validate required fields
    if (!title || !unitId || !dueDate || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, unitId, dueDate, and image are required'
      });
    }

    // Find the unit to get additional context
    const unit = await Course.findOne(
      { 'units._id': unitId },
      { 'units.$': 1, name: 1, code: 1, department: 1, institution: 1 }
    ).populate('institution', 'name');

    let unitCode = 'UNKNOWN';
    if (unit && unit.units && unit.units[0]) {
      unitCode = unit.units[0].unitCode;
    }

    // Create new Exam in database
    const newExam = new Assessment({
      title,
      type: 'exam',
      unitId,
      unitName,
      unitCode,
      description,
      instructions,
      dueDate: new Date(dueDate),
      totalMarks: parseInt(totalMarks) || 100,
      duration: parseInt(duration) || 180,
      imageFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      createdBy: req.user.id,
      createdByName: `${req.user.firstName} ${req.user.lastName}`,
      status: 'scheduled',
      maxViews: 1,
      // Additional context from unit
      courseId: unit?._id,
      department: unit?.department,
      institutionId: unit?.institution?._id
    });

    await newExam.save();

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { 
        exam: {
          ...newExam.toObject(),
          imageUrl: `/api/secure-images/exam/${newExam._id}`
        }
      }
    });

  } catch (error) {
    console.error('Error creating Exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Exam'
    });
  }
});

// Delete CAT
router.delete('/admin/cats/:id', authenticateToken, requireRole('mini_admin', 'super_admin'), async (req, res) => {
  try {
    const catId = req.params.id;
    
    // Find the CAT in database
    const cat = await Assessment.findOne({ _id: catId, type: 'cat' });

    if (!cat) {
      return res.status(404).json({
        success: false,
        message: 'CAT not found'
      });
    }

    // Check if user has permission to delete
    if (cat.createdBy.toString() !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Delete the image file
    if (cat.imageFile && cat.imageFile.filePath) {
      const imagePath = path.resolve(cat.imageFile.filePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete from database
    await Assessment.findByIdAndDelete(catId);

    res.json({
      success: true,
      message: 'CAT deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting CAT:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete CAT',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete Exam
router.delete('/admin/exams/:id', authenticateToken, requireRole('mini_admin', 'super_admin'), async (req, res) => {
  try {
    const examId = req.params.id;
    
    // Find the Exam in database
    const exam = await Assessment.findOne({ _id: examId, type: 'exam' });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if user has permission to delete
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Delete the image file
    if (exam.imageFile && exam.imageFile.filePath) {
      const imagePath = path.resolve(exam.imageFile.filePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete from database
    await Assessment.findByIdAndDelete(examId);

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Exam',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// STUDENT ROUTES

// Get available CATs for student
router.get('/student/cats', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    console.log('📝 Fetching CATs for student:', req.user.id);
    
    // Fetch approved CATs from database
    const cats = await Assessment.find({ 
      type: 'cat', 
      status: 'approved',
      isActive: true 
    })
      .populate('courseId', 'name code')
      .populate('unitId', 'unitName unitCode year semester')
      .sort({ dueDate: -1 })
      .lean();

    console.log(`Found ${cats.length} approved CATs`);

    // Format CATs with additional info
    const availableCATs = cats.map(cat => ({
      _id: cat._id,
      title: cat.title,
      unitId: cat.unitId?._id,
      unitName: cat.unitName || cat.unitId?.unitName,
      unitCode: cat.unitCode || cat.unitId?.unitCode,
      description: cat.description || '',
      dueDate: cat.dueDate,
      totalMarks: cat.totalMarks,
      duration: cat.duration || cat.durationMinutes,
      status: cat.status,
      hasViewed: false, // TODO: Track in separate collection
      viewCount: cat.viewCount || 0,
      maxViews: cat.maxViews || 3,
      createdBy: cat.createdByName || 'Instructor',
      instructions: cat.instructions || '',
      isAvailable: cat.status === 'approved',
      isPremium: cat.isPremium !== false,
      imageUrl: `/api/secure-images/cat/${cat._id}`
    }));

    res.json({
      success: true,
      data: { cats: availableCATs }
    });

  } catch (error) {
    console.error('Error fetching student CATs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CATs'
    });
  }
});

// Get available Exams for student
router.get('/student/exams', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    console.log('📝 Fetching Exams for student:', req.user.id);
    
    // Fetch approved Exams and Past Exams from database
    const exams = await Assessment.find({ 
      type: { $in: ['exam', 'pastExam'] },
      status: 'approved',
      isActive: true 
    })
      .populate('courseId', 'name code')
      .populate('unitId', 'unitName unitCode year semester')
      .sort({ dueDate: -1 })
      .lean();

    console.log(`Found ${exams.length} approved Exams/Past Exams`);

    // Format Exams with additional info
    const availableExams = exams.map(exam => ({
      _id: exam._id,
      title: exam.title,
      unitId: exam.unitId?._id,
      unitName: exam.unitName || exam.unitId?.unitName,
      unitCode: exam.unitCode || exam.unitId?.unitCode,
      description: exam.description || '',
      dueDate: exam.dueDate,
      totalMarks: exam.totalMarks,
      duration: exam.duration || exam.durationMinutes,
      status: exam.status,
      hasViewed: false, // TODO: Track in separate collection
      viewCount: exam.viewCount || 0,
      maxViews: exam.maxViews || 1,
      createdBy: exam.createdByName || 'Instructor',
      instructions: exam.instructions || '',
      isAvailable: exam.status === 'approved',
      isPremium: exam.isPremium !== false,
      imageUrl: `/api/secure-images/${exam.type}/${exam._id}`
    }));

    res.json({
      success: true,
      data: { exams: availableExams }
    });

  } catch (error) {
    console.error('Error fetching student Exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Exams'
    });
  }
});

// Get specific CAT details for student
router.get('/admin/cats/:id', authenticateToken, async (req, res) => {
  try {
    const catId = req.params.id;
    const cat = cats.find(c => c._id === catId);

    if (!cat) {
      return res.status(404).json({
        success: false,
        message: 'CAT not found'
      });
    }

    // Check if student has permission to view
    if (req.user.role === 'student') {
      const viewCount = assessmentLogs.filter(log => 
        log.assessmentId === catId && 
        log.userId === req.user.id && 
        log.action === 'start_viewing'
      ).length;

      if (viewCount >= cat.maxViews) {
        return res.status(403).json({
          success: false,
          message: 'Maximum views exceeded'
        });
      }
    }

    res.json({
      success: true,
      data: cat
    });

  } catch (error) {
    console.error('Error fetching CAT details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CAT details'
    });
  }
});

// Get specific Exam details for student
router.get('/admin/exams/:id', authenticateToken, async (req, res) => {
  try {
    const examId = req.params.id;
    const exam = exams.find(e => e._id === examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if student has permission to view
    if (req.user.role === 'student') {
      const viewCount = assessmentLogs.filter(log => 
        log.assessmentId === examId && 
        log.userId === req.user.id && 
        log.action === 'start_viewing'
      ).length;

      if (viewCount >= exam.maxViews) {
        return res.status(403).json({
          success: false,
          message: 'Maximum views exceeded'
        });
      }
    }

    res.json({
      success: true,
      data: exam
    });

  } catch (error) {
    console.error('Error fetching Exam details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Exam details'
    });
  }
});

// Serve secure images
router.get('/secure-images/:type/:id', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Find the assessment
    let assessment;
    if (type === 'cat') {
      assessment = cats.find(c => c._id === id);
    } else if (type === 'exam') {
      assessment = exams.find(e => e._id === id);
    }

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check permissions
    if (req.user.role === 'student') {
      const viewCount = assessmentLogs.filter(log => 
        log.assessmentId === id && 
        log.userId === req.user.id && 
        log.action === 'start_viewing'
      ).length;

      if (viewCount >= assessment.maxViews) {
        return res.status(403).json({
          success: false,
          message: 'Maximum views exceeded'
        });
      }
    }

    // Serve the image file
    const imagePath = path.join(__dirname, '../uploads/secure-assessments', assessment.imageFile);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found'
      });
    }

    // Set security headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    });

    res.sendFile(imagePath);

  } catch (error) {
    console.error('Error serving secure image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve image'
    });
  }
});

// Log assessment viewing sessions
router.post('/assessment-logs', authenticateToken, async (req, res) => {
  try {
    const { assessmentId, assessmentType, action, timestamp } = req.body;

    const logEntry = {
      _id: crypto.randomBytes(12).toString('hex'),
      assessmentId,
      assessmentType,
      action,
      userId: req.user.id,
      userRole: req.user.role,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      timestamp: new Date(timestamp),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    assessmentLogs.push(logEntry);

    // If starting a viewing session, create session tracking
    if (action === 'start_viewing') {
      const sessionId = crypto.randomBytes(16).toString('hex');
      viewingSessions.set(sessionId, {
        userId: req.user.id,
        assessmentId,
        assessmentType,
        startTime: new Date(),
        active: true
      });

      // Auto-cleanup session after assessment duration + 10 minutes
      const assessment = assessmentType === 'cat' ? 
        cats.find(c => c._id === assessmentId) : 
        exams.find(e => e._id === assessmentId);
      
      if (assessment) {
        setTimeout(() => {
          viewingSessions.delete(sessionId);
        }, (assessment.duration + 10) * 60 * 1000);
      }
    }

    res.json({
      success: true,
      message: 'Log entry created'
    });

  } catch (error) {
    console.error('Error creating log entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create log entry'
    });
  }
});

// Get assessment logs (Admin only)
router.get('/admin/assessment-logs', authenticateToken, requireRole('mini_admin', 'super_admin'), async (req, res) => {
  try {
    const { assessmentId, userId, action, limit = 100 } = req.query;
    
    let filteredLogs = assessmentLogs;

    if (assessmentId) {
      filteredLogs = filteredLogs.filter(log => log.assessmentId === assessmentId);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    // Sort by timestamp (newest first) and limit results
    const logs = filteredLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: { logs }
    });

  } catch (error) {
    console.error('Error fetching assessment logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs'
    });
  }
});

// Get active viewing sessions (Admin only)
router.get('/admin/active-sessions', authenticateToken, requireRole('mini_admin', 'super_admin'), async (req, res) => {
  try {
    const activeSessions = Array.from(viewingSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      ...session
    }));

    res.json({
      success: true,
      data: { sessions: activeSessions }
    });

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions'
    });
  }
});

module.exports = router;
