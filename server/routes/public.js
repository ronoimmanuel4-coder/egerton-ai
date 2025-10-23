const express = require('express');
const router = express.Router();
const StudentDownload = require('../models/StudentDownload');
const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');

// GET /api/public/success-stories
// Build lightweight student success stories from recent downloads activity
router.get('/success-stories', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 24);

    const recent = await StudentDownload.find({})
      .sort({ downloadedAt: -1 })
      .limit(limit * 2) // fetch more, we'll de-dup by user
      .lean();

    const byUser = new Map();
    for (const dl of recent) {
      if (!dl.userId) continue;
      if (!byUser.has(String(dl.userId))) {
        byUser.set(String(dl.userId), dl);
      }
      if (byUser.size >= limit) break;
    }

    const chosen = Array.from(byUser.values());
    const userIds = chosen.map((d) => d.userId).filter(Boolean);
    const courseIds = chosen.map((d) => d.courseId).filter(Boolean);

    const [users, courses] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('firstName lastName role').lean(),
      Course.find({ _id: { $in: courseIds } })
        .select('name code institution department')
        .populate('institution', 'name shortName')
        .lean()
    ]);

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const courseMap = new Map(courses.map((c) => [String(c._id), c]));

    const stories = chosen.map((dl, idx) => {
      const user = userMap.get(String(dl.userId)) || {};
      const course = courseMap.get(String(dl.courseId)) || {};
      const institutionLabel = course?.institution?.shortName || course?.institution?.name || 'Institution';
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student';
      const unitPart = dl.unitName ? ` • ${dl.unitName}` : '';

      // Build a short quote-like line from the activity
      const quote = dl.resourceTitle
        ? `Downloaded “${dl.resourceTitle}” for ${course.name || 'course'}${unitPart} — staying exam-ready.`
        : `Preparing for ${course.name || 'my course'}${unitPart} with premium study packs.`;

      const resources = [];
      if (dl.resourceTitle) resources.push(dl.resourceTitle);
      if (dl.topicTitle) resources.push(`Topic: ${dl.topicTitle}`);

      return {
        id: String(dl._id || idx),
        name,
        institution: `${institutionLabel} · ${course.name || course.code || 'Programme'}`,
        quote,
        resources: resources.slice(0, 3)
      };
    });

    res.json({ stories });
  } catch (error) {
    console.error('Public success-stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
