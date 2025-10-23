const express = require('express');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/admin/my-assessments
// @desc    Get assessments submitted by the current mini admin (pending approval)
// @access  Private (Mini Admin or Super Admin)
router.get('/my-assessments', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Fetching assessments for user: ${userId}`);

    // Find all courses and look for assessments uploaded by this user
    const courses = await Course.find({});
    const userAssessments = [];

    courses.forEach(course => {
      course.units.forEach(unit => {
        // Check CATs
        unit.assessments?.cats?.forEach(cat => {
          if (cat.uploadedBy && cat.uploadedBy.toString() === userId) {
            userAssessments.push({
              _id: cat._id,
              title: cat.title,
              type: 'cats',
              assessmentType: 'cat',
              courseId: course._id,
              courseName: course.name,
              unitId: unit._id,
              unitName: unit.unitName,
              description: cat.description,
              dueDate: cat.dueDate,
              totalMarks: cat.totalMarks,
              duration: cat.duration,
              instructions: cat.instructions,
              status: cat.status || 'pending',
              createdBy: req.user.firstName + ' ' + req.user.lastName,
              createdAt: cat.createdAt || cat.uploadDate,
              filename: cat.filename,
              filePath: cat.filePath
            });
          }
        });

        // Check Assignments
        unit.assessments?.assignments?.forEach(assignment => {
          if (assignment.uploadedBy && assignment.uploadedBy.toString() === userId) {
            userAssessments.push({
              _id: assignment._id,
              title: assignment.title,
              type: 'assignments',
              assessmentType: 'assignment',
              courseId: course._id,
              courseName: course.name,
              unitId: unit._id,
              unitName: unit.unitName,
              description: assignment.description,
              dueDate: assignment.dueDate,
              totalMarks: assignment.totalMarks,
              duration: assignment.duration,
              instructions: assignment.instructions,
              status: assignment.status || 'pending',
              createdBy: req.user.firstName + ' ' + req.user.lastName,
              createdAt: assignment.createdAt || assignment.uploadDate,
              filename: assignment.filename,
              filePath: assignment.filePath
            });
          }
        });

        // Check Past Exams
        unit.assessments?.pastExams?.forEach(exam => {
          if (exam.uploadedBy && exam.uploadedBy.toString() === userId) {
            userAssessments.push({
              _id: exam._id,
              title: exam.title,
              type: 'pastExams',
              assessmentType: 'exam',
              courseId: course._id,
              courseName: course.name,
              unitId: unit._id,
              unitName: unit.unitName,
              description: exam.description,
              dueDate: exam.dueDate,
              totalMarks: exam.totalMarks,
              duration: exam.duration,
              instructions: exam.instructions,
              status: exam.status || 'pending',
              createdBy: req.user.firstName + ' ' + req.user.lastName,
              createdAt: exam.createdAt || exam.uploadDate,
              filename: exam.filename,
              filePath: exam.filePath
            });
          }
        });
      });
    });

    // Sort by creation date (newest first)
    userAssessments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`📊 Found ${userAssessments.length} assessments for user ${userId}`);

    res.json({
      topics: {
        pending: pendingTopics,
        approved: approvedTopics,
        rejected: rejectedTopics,
        sample: topicSamples.slice(0, 10)
      },
      assessments: {
        pending: pendingAssessments,
        approved: approvedAssessments,
        rejected: rejectedAssessments,
        sample: assessmentSamples.slice(0, 10)
      }
    });
  } catch (error) {
    console.error(`❌ Error fetching content status for super admin ${req.user.id}:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
