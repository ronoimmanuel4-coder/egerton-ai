const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const aiStudyPartner = require('../services/aiStudyPartner');
const User = require('../models/User');
const Course = require('../models/Course');
const Unit = require('../models/Unit');
const Assessment = require('../models/Assessment');

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI Study Partner (Local Ollama)
 * @access  Private
 */
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get full student context
    const student = await User.findById(req.user.id)
      .populate('course')
      .lean();

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get student's units for current year
    const units = await Unit.find({
      course: student.course._id || student.course,
      year: student.yearOfStudy,
    }).lean();

    // Load approved assessments (CATs, exams, past exams, assignments) for these units
    const unitIds = units.map((u) => u._id);

    let examPapers = [];
    if (unitIds.length > 0) {
      const assessments = await Assessment.find({
        courseId: student.course._id || student.course,
        unitId: { $in: unitIds },
        status: 'approved',
        isActive: true,
        type: { $in: ['exam', 'pastExam', 'cat', 'assignment'] },
      })
        .populate('unitId', 'unitName unitCode year semester')
        .sort({ uploadDate: -1, createdAt: -1 })
        .limit(40)
        .lean();

      examPapers = assessments.map((a) => ({
        id: a._id.toString(),
        type: a.type,
        title: a.title,
        unitName: a.unitName || a.unitId?.unitName,
        unitCode: a.unitCode || a.unitId?.unitCode,
        academicYear: a.academicYear,
        examYear: a.examMetadata?.year,
        examSemester: a.examMetadata?.semester,
        examType: a.examMetadata?.examType || (a.type === 'pastExam' ? 'past exam' : a.type),
        description: a.description,
        instructions: a.instructions,
      }));
    }

    // Prepare context for AI
    const contextData = {
      student,
      course: student.course,
      units,
      examPapers,
      lecturerInfo: null, // TODO: Add lecturer info when available
    };

    // Chat with AI Study Partner
    const result = await aiStudyPartner.chat(
      student._id.toString(),
      message,
      contextData
    );

    if (!result.success) {
      return res.status(503).json({
        error: 'AI temporarily unavailable',
        message: result.response,
        details: result.error,
      });
    }

    res.json({
      success: true,
      message: result.response,
      conversationLength: result.conversationLength,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: 'Failed to process chat',
      message: 'Something went wrong. Please try again.',
    });
  }
});

/**
 * @route   GET /api/ai/status
 * @desc    Check Ollama connection status
 * @access  Private
 */
router.get('/status', auth, async (req, res) => {
  try {
    const status = await aiStudyPartner.checkConnection();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/ai/history
 * @desc    Clear conversation history
 * @access  Private
 */
router.delete('/history', auth, async (req, res) => {
  try {
    const result = aiStudyPartner.clearHistory(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear history',
    });
  }
});

module.exports = router;
