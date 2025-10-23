const express = require('express');
const Course = require('../models/Course');
const Subscription = require('../models/Subscription');
const { auth } = require('../middleware/auth');
const { getApprovedCourseContentNormalized } = require('../services/contentService');
const router = express.Router();

// @route   GET /api/student/course/:courseId/content
// @desc    Get approved content for a course (for students)
// @access  Private (Students)
router.get('/course/:courseId/content', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { year, semester } = req.query;
    const userId = req.user.id;

    console.log('📚 Fetching approved content for course:', courseId, 'user:', userId);

    const course = await Course.findById(courseId)
      .populate('institution', 'name shortName')
      .select('name code department units institution');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check user's subscriptions for different years
    const userSubscriptions = {};
    if (year) {
      userSubscriptions[year] = await Subscription.hasActiveSubscription(userId, courseId, parseInt(year));
    } else {
      // Check subscriptions for all years (1-6)
      for (let y = 1; y <= 6; y++) {
        userSubscriptions[y] = await Subscription.hasActiveSubscription(userId, courseId, y);
      }
    }

    const normalizedResult = await getApprovedCourseContentNormalized(courseId, {
      year,
      semester,
      userSubscriptions
    });

    const approvedContent = Array.isArray(normalizedResult?.content) ? normalizedResult.content : [];

    res.json({
      course: {
        id: course._id,
        name: course.name,
        code: course.code,
        department: course.department,
        institution: course.institution
      },
      content: approvedContent,
      totalContent: approvedContent.length,
      premiumContent: approvedContent.filter(c => c.isPremium).length,
      freeContent: approvedContent.filter(c => !c.isPremium).length,
      subscriptions: userSubscriptions,
      subscriptionInfo: {
        price: 100,
        currency: 'KSH',
        duration: '1 month',
        perYear: true,
        perCourse: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching student content:', error);
    res.status(500).json({ message: 'Server error fetching content' });
  }
});

// @route   GET /api/student/course/:courseId/units
// @desc    Get course units structure for navigation
// @access  Private (Students)
router.get('/course/:courseId/units', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .select('name code units.unitName units.unitCode units.year units.semester units._id');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Group units by year and semester
    const unitsStructure = {};
    
    course.units.forEach(unit => {
      const yearKey = `year${unit.year}`;
      const semesterKey = `semester${unit.semester}`;
      
      if (!unitsStructure[yearKey]) {
        unitsStructure[yearKey] = {};
      }
      
      if (!unitsStructure[yearKey][semesterKey]) {
        unitsStructure[yearKey][semesterKey] = [];
      }
      
      unitsStructure[yearKey][semesterKey].push({
        id: unit._id,
        name: unit.unitName,
        code: unit.unitCode,
        year: unit.year,
        semester: unit.semester
      });
    });

    res.json({
      course: {
        id: course._id,
        name: course.name,
        code: course.code
      },
      unitsStructure
    });

  } catch (error) {
    console.error('❌ Error fetching course units:', error);
    res.status(500).json({ message: 'Server error fetching units' });
  }
});

// @route   GET /api/student/assessments
// @desc    Get approved assessments for student (CATs, Exams, Past Papers)
// @access  Private (Students)
router.get('/assessments', auth, async (req, res) => {
  try {
    const { courseId, unitId, type, year, semester } = req.query;
    const userId = req.user.id;

    console.log('📝 Fetching approved assessments for student:', userId);

    const Assessment = require('../models/Assessment');
    
    // Build query for approved assessments only
    let query = { 
      status: 'approved',
      isActive: true
    };

    if (courseId) query.courseId = courseId;
    if (unitId) query.unitId = unitId;
    if (type) query.type = type;

    // Fetch approved assessments
    const assessments = await Assessment.find(query)
      .populate('courseId', 'name code')
      .populate('unitId', 'unitName unitCode year semester')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ dueDate: -1, createdAt: -1 })
      .lean();

    // Filter by year/semester if provided
    let filteredAssessments = assessments;
    if (year || semester) {
      filteredAssessments = assessments.filter(assessment => {
        const unitYear = assessment.unitId?.year;
        const unitSemester = assessment.unitId?.semester;
        
        if (year && unitYear !== parseInt(year)) return false;
        if (semester && unitSemester !== parseInt(semester)) return false;
        
        return true;
      });
    }

    // Check user's subscription status for premium content
    const Subscription = require('../models/Subscription');
    const userSubscriptions = {};
    
    // Group by course and year to check subscriptions
    const coursesYears = new Set();
    filteredAssessments.forEach(a => {
      if (a.courseId?._id && a.unitId?.year) {
        coursesYears.add(`${a.courseId._id}_${a.unitId.year}`);
      }
    });

    for (const key of coursesYears) {
      const [cId, yr] = key.split('_');
      userSubscriptions[key] = await Subscription.hasActiveSubscription(userId, cId, parseInt(yr));
    }

    // Format assessments with access info
    const formattedAssessments = filteredAssessments.map(assessment => {
      const subscriptionKey = `${assessment.courseId?._id}_${assessment.unitId?.year}`;
      const hasSubscription = userSubscriptions[subscriptionKey] || false;
      const canAccess = !assessment.isPremium || hasSubscription;

      return {
        _id: assessment._id,
        type: assessment.type,
        title: assessment.title,
        description: assessment.description || '',
        status: assessment.status,
        dueDate: assessment.dueDate,
        totalMarks: assessment.totalMarks,
        duration: assessment.duration || assessment.durationMinutes,
        instructions: assessment.instructions || '',
        academicYear: assessment.academicYear,
        difficulty: assessment.difficulty,
        tags: assessment.tags || [],
        courseId: assessment.courseId?._id,
        courseName: assessment.courseId?.name,
        courseCode: assessment.courseId?.code,
        unitId: assessment.unitId?._id,
        unitName: assessment.unitName || assessment.unitId?.unitName,
        unitCode: assessment.unitCode || assessment.unitId?.unitCode,
        year: assessment.unitId?.year,
        semester: assessment.unitId?.semester,
        isPremium: assessment.isPremium !== false,
        canAccess,
        hasSubscription,
        maxViews: assessment.maxViews || 3,
        viewCount: assessment.viewCount || 0,
        createdAt: assessment.createdAt,
        imageUrl: canAccess ? `/api/secure-images/${assessment.type}/${assessment._id}` : null
      };
    });

    // Group by type
    const groupedAssessments = {
      cats: formattedAssessments.filter(a => a.type === 'cat'),
      exams: formattedAssessments.filter(a => a.type === 'exam'),
      pastExams: formattedAssessments.filter(a => a.type === 'pastExam'),
      assignments: formattedAssessments.filter(a => a.type === 'assignment')
    };

    res.json({
      success: true,
      assessments: formattedAssessments,
      grouped: groupedAssessments,
      totalCount: formattedAssessments.length,
      premiumCount: formattedAssessments.filter(a => a.isPremium).length,
      accessibleCount: formattedAssessments.filter(a => a.canAccess).length
    });

  } catch (error) {
    console.error('❌ Error fetching student assessments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching assessments',
      error: error.message 
    });
  }
});

module.exports = router;
