const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const StudentDownload = require('../models/StudentDownload');
const Subscription = require('../models/Subscription');
const Course = require('../models/Course');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const downloads = await StudentDownload.find({
      userId,
      expiresAt: { $gt: new Date() }
    })
      .sort({ downloadedAt: -1 });

    res.json({ downloads });
  } catch (error) {
    console.error('❌ Fetch downloads error:', error);
    res.status(500).json({ message: 'Server error fetching downloads' });
  }
});

router.post('/', [
  auth,
  body('courseId').isMongoId().withMessage('courseId is required'),
  body('year').isInt({ min: 1, max: 6 }).withMessage('year must be between 1 and 6'),
  body('resourceId').isString().trim().notEmpty().withMessage('resourceId is required'),
  body('resourceTitle').optional().isString(),
  body('filename').isString().trim().notEmpty().withMessage('filename is required'),
  body('fileSize').optional().isInt({ min: 0 }),
  body('unitId').optional().isString(),
  body('unitName').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const {
      courseId,
      year,
      unitId,
      unitName,
      topicId,
      topicTitle,
      resourceId,
      resourceTitle,
      filename,
      fileSize,
      origin
    } = req.body;

    const numericYear = parseInt(year, 10);
    const resolvedOrigin = origin === 'resource' ? 'resource' : 'course_note';

    const subscription = await Subscription.getUserSubscription(userId, courseId, numericYear);
    if (!subscription || !subscription.expiryDate) {
      return res.status(403).json({ message: 'Active subscription required to download this resource' });
    }

    const course = subscription.courseId || await Course.findById(courseId).select('name code');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const download = await StudentDownload.findOneAndUpdate(
      { userId, resourceId, filename },
      {
        userId,
        courseId,
        courseName: course.name,
        courseCode: course.code,
        subscriptionId: subscription._id,
        year: numericYear,
        unitId,
        unitName,
        topicId,
        topicTitle,
        resourceId,
        resourceTitle,
        filename,
        fileSize,
        downloadedAt: new Date(),
        expiresAt: subscription.expiryDate,
        origin: resolvedOrigin
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ download });
  } catch (error) {
    console.error('❌ Register download error:', error);
    res.status(500).json({ message: 'Server error saving download' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const download = await StudentDownload.findOne({ _id: id, userId });
    if (!download) {
      return res.status(404).json({ message: 'Download record not found' });
    }

    await StudentDownload.deleteOne({ _id: id });

    res.json({ message: 'Download removed successfully' });
  } catch (error) {
    console.error('❌ Delete download error:', error);
    res.status(500).json({ message: 'Server error deleting download' });
  }
});

module.exports = router;
