const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ExamPaper = require('../models/ExamPaper');
const Unit = require('../models/Unit');

/**
 * @route   POST /api/exam-papers
 * @desc    Add a new exam paper (manually paste text)
 * @access  Private (for now, later restrict to admin)
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      courseId,
      unitId,
      year,
      semester,
      examYear,
      examType,
      lecturer,
      fullText,
      questions,
      topics,
      difficulty,
    } = req.body;

    // Validate required fields
    if (!courseId || !unitId || !year || !semester || !examYear || !lecturer || !fullText) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['courseId', 'unitId', 'year', 'semester', 'examYear', 'lecturer', 'fullText'],
      });
    }

    // Check if unit exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Create exam paper
    const examPaper = new ExamPaper({
      course: courseId,
      unit: unitId,
      year,
      semester,
      examYear,
      examType: examType || 'Final',
      lecturer,
      content: {
        fullText,
        questions: questions || [],
        topics: topics || [],
        difficulty: difficulty || 'Moderate',
      },
      uploadedBy: req.user.id,
      verified: false,
    });

    await examPaper.save();

    res.status(201).json({
      success: true,
      message: 'Exam paper added successfully',
      examPaper: {
        id: examPaper._id,
        unit: unit.unitName,
        lecturer,
        examYear,
        topics: examPaper.content.topics,
      },
    });

  } catch (error) {
    console.error('Add exam paper error:', error);
    res.status(500).json({
      error: 'Failed to add exam paper',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/exam-papers/unit/:unitId
 * @desc    Get all exam papers for a specific unit
 * @access  Private
 */
router.get('/unit/:unitId', auth, async (req, res) => {
  try {
    const examPapers = await ExamPaper.find({
      unit: req.params.unitId,
    })
      .select('-content.fullText') // Don't send full text in list
      .populate('unit', 'unitName unitCode')
      .sort('-examYear -createdAt');

    res.json({
      success: true,
      count: examPapers.length,
      examPapers,
    });

  } catch (error) {
    console.error('Get exam papers error:', error);
    res.status(500).json({
      error: 'Failed to fetch exam papers',
    });
  }
});

/**
 * @route   GET /api/exam-papers/course/:courseId
 * @desc    Get all exam papers for a course
 * @access  Private
 */
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const examPapers = await ExamPaper.find({
      course: req.params.courseId,
    })
      .select('-content.fullText')
      .populate('unit', 'unitName unitCode')
      .sort('-examYear -createdAt');

    res.json({
      success: true,
      count: examPapers.length,
      examPapers,
    });

  } catch (error) {
    console.error('Get course exam papers error:', error);
    res.status(500).json({
      error: 'Failed to fetch exam papers',
    });
  }
});

/**
 * @route   GET /api/exam-papers/:id
 * @desc    Get full details of a specific exam paper
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const examPaper = await ExamPaper.findById(req.params.id)
      .populate('unit', 'unitName unitCode')
      .populate('course', 'name');

    if (!examPaper) {
      return res.status(404).json({ error: 'Exam paper not found' });
    }

    res.json({
      success: true,
      examPaper,
    });

  } catch (error) {
    console.error('Get exam paper error:', error);
    res.status(500).json({
      error: 'Failed to fetch exam paper',
    });
  }
});

/**
 * @route   PUT /api/exam-papers/:id/analyze
 * @desc    Use AI to analyze patterns in the exam paper
 * @access  Private
 */
router.put('/:id/analyze', auth, async (req, res) => {
  try {
    const examPaper = await ExamPaper.findById(req.params.id);

    if (!examPaper) {
      return res.status(404).json({ error: 'Exam paper not found' });
    }

    // TODO: Use AI to analyze the exam paper and extract patterns
    // For now, just return a placeholder
    const analysis = {
      questionFormats: [
        'Define and explain...',
        'Compare and contrast...',
        'Solve the following problem...',
      ],
      favoriteTopics: examPaper.content.topics,
      difficultyTrend: examPaper.content.difficulty,
      lecturerStyle: `${examPaper.lecturer} focuses on practical applications and real-world examples.`,
    };

    examPaper.patterns = analysis;
    await examPaper.save();

    res.json({
      success: true,
      message: 'Exam paper analyzed',
      patterns: analysis,
    });

  } catch (error) {
    console.error('Analyze exam paper error:', error);
    res.status(500).json({
      error: 'Failed to analyze exam paper',
    });
  }
});

module.exports = router;
