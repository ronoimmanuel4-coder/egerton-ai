const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Mini Admin or Super Admin)
router.get('/dashboard', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const isSuper = req.user.role === 'super_admin';
    
    // Basic statistics
    const stats = {
      users: {
        total: await User.countDocuments({ isActive: true }),
        students: await User.countDocuments({ role: 'student', isActive: true }),
        activeSubscriptions: await User.countDocuments({ 
          'subscription.isActive': true,
          'subscription.endDate': { $gte: new Date() }
        })
      },
      resources: {
        total: await Resource.countDocuments({ isActive: true }),
        pending: await Resource.countDocuments({ approvalStatus: 'pending' }),
        approved: await Resource.countDocuments({ approvalStatus: 'approved' }),
        premium: await Resource.countDocuments({ isPremium: true, isActive: true })
      },
      jobs: {
        total: await Job.countDocuments({ isActive: true }),
        active: await Job.countDocuments({ 
          isActive: true, 
          applicationDeadline: { $gte: new Date() } 
        })
      }
    };

    // Super admin gets additional financial stats
    if (isSuper) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      stats.revenue = {
        totalRevenue: await Payment.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0),
        monthlyRevenue: await Payment.aggregate([
          { 
            $match: { 
              status: 'completed',
              createdAt: { $gte: thirtyDaysAgo }
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0),
        subscriptionRevenue: await Payment.aggregate([
          { 
            $match: { 
              status: 'completed',
              type: 'subscription'
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0),
        jobUnlockRevenue: await Payment.aggregate([
          { 
            $match: { 
              status: 'completed',
              type: 'job_unlock'
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0)
      };

      stats.institutions = {
        total: await Institution.countDocuments({ isActive: true })
      };

      stats.courses = {
        total: await Course.countDocuments({ isActive: true })
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/content-status
// @desc    Get content upload status for the requesting admin
// @access  Private (Mini Admin or Super Admin)
router.get('/content-status', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const userId = req.user.id?.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    const normalizeStatus = (status) => {
      if (['pending', 'approved', 'rejected'].includes(status)) {
        return status;
      }
      return 'pending';
    };

    const shouldInclude = (uploadedById) => {
      if (isSuperAdmin) {
        return true;
      }
      if (!userId) {
        return false;
      }
      if (!uploadedById) {
        // Legacy content might be missing uploadedBy, show it so mini admin can act on it
        return true;
      }
      return uploadedById === userId;
    };

    const toIdString = (value) => {
      if (!value) return null;
      try {
        return value.toString();
      } catch (err) {
        return null;
      }
    };

    const stats = { pending: 0, approved: 0, rejected: 0, total: 0 };
    const content = [];
    const uploaderIds = new Set();

    const registerEntry = (entry) => {
      const uploaderId = toIdString(entry.uploadedBy);
      if (!shouldInclude(uploaderId)) {
        return;
      }

      const normalizedStatus = normalizeStatus(entry.status);
      stats[normalizedStatus] += 1;
      stats.total += 1;

      if (uploaderId) {
        uploaderIds.add(uploaderId);
      }

      content.push({
        id: entry.id,
        type: entry.type,
        title: entry.title,
        status: normalizedStatus,
        courseId: entry.courseId,
        courseName: entry.courseName,
        unitId: entry.unitId,
        unitName: entry.unitName,
        topicId: entry.topicId,
        topicTitle: entry.topicTitle,
        uploadDate: entry.uploadDate ? new Date(entry.uploadDate).toISOString() : null,
        filename: entry.filename ?? null,
        reviewNotes: entry.reviewNotes ?? null,
        uploadedBy: uploaderId,
        contentDetails: entry.contentDetails ?? null,
        assessmentId: entry.assessmentId ? toIdString(entry.assessmentId) : null,
        isPremium: entry.isPremium ?? null
      });
    };

    // Fetch from Assessment and ContentAsset collections (normalized schema)
    const Assessment = require('../models/Assessment');
    const ContentAsset = require('../models/ContentAsset');
    
    const [courses, assessmentsFromCollection, contentAssetsFromCollection] = await Promise.all([
      Course.find({}, {
        name: 1,
        code: 1,
        'units._id': 1,
        'units.unitName': 1,
        'units.topics._id': 1,
        'units.topics.title': 1,
        'units.topics.content.lectureVideo': 1,
        'units.topics.content.notes': 1,
        'units.assessments.cats': 1,
        'units.assessments.assignments': 1,
        'units.assessments.pastExams': 1
      }).lean(),
      Assessment.find({ isActive: true })
        .populate('courseId', 'name code')
        .populate('unitId', 'unitName unitCode')
        .populate('uploadedBy', 'firstName lastName email')
        .lean(),
      ContentAsset.find({ ownerType: 'topic' })
        .populate({
          path: 'owner',
          model: 'Topic',
          select: 'title unitId',
          populate: {
            path: 'unitId',
            model: 'Unit',
            select: 'unitName unitCode courseId',
            populate: {
              path: 'courseId',
              model: 'Course',
              select: 'name code'
            }
          }
        })
        .populate('uploadedBy', 'firstName lastName email')
        .lean()
    ]);

    courses.forEach((course) => {
      const courseId = toIdString(course._id);
      course.units?.forEach((unit) => {
        const unitId = toIdString(unit._id);

        unit.topics?.forEach((topic) => {
          const topicId = toIdString(topic._id);
          const lectureVideo = topic.content?.lectureVideo;

          if (lectureVideo) {
            const videoDetails = {
              title: lectureVideo.title || `${topic.title || 'Topic'} Lecture`,
              filename: lectureVideo.filename ?? null,
              filePath: lectureVideo.filePath ?? null,
              uploadDate: lectureVideo.uploadDate || null,
              status: lectureVideo.status,
              uploadedBy: lectureVideo.uploadedBy ?? null,
              reviewNotes: lectureVideo.reviewNotes ?? null,
              duration: lectureVideo.duration ?? null,
              isPremium: lectureVideo.isPremium ?? null
            };
            registerEntry({
              id: `${topicId}-video`,
              type: 'video',
              title: videoDetails.title,
              status: lectureVideo.status,
              courseId,
              courseName: course.name,
              unitId,
              unitName: unit.unitName,
              topicId,
              topicTitle: topic.title,
              uploadDate: lectureVideo.uploadDate,
              filename: lectureVideo.filename,
              reviewNotes: lectureVideo.reviewNotes,
              uploadedBy: lectureVideo.uploadedBy,
              contentDetails: videoDetails,
              isPremium: lectureVideo.isPremium ?? null
            });
          }

          const notes = topic.content?.notes;
          if (notes) {
            const noteDetails = {
              title: notes.title || `${topic.title || 'Topic'} Notes`,
              filename: notes.filename ?? null,
              filePath: notes.filePath ?? null,
              uploadDate: notes.uploadDate || null,
              status: notes.status,
              uploadedBy: notes.uploadedBy ?? null,
              reviewNotes: notes.reviewNotes ?? null,
              isPremium: notes.isPremium ?? null
            };
            registerEntry({
              id: `${topicId}-notes`,
              type: 'notes',
              title: noteDetails.title,
              status: notes.status,
              courseId,
              courseName: course.name,
              unitId,
              unitName: unit.unitName,
              topicId,
              topicTitle: topic.title,
              uploadDate: notes.uploadDate,
              filename: notes.filename,
              reviewNotes: notes.reviewNotes,
              uploadedBy: notes.uploadedBy,
              contentDetails: noteDetails,
              isPremium: notes.isPremium ?? null
            });
          }
        });

        const assessments = unit.assessments || {};
        ['cats', 'assignments', 'pastExams'].forEach((assessmentType) => {
          assessments[assessmentType]?.forEach((assessment) => {
            const assessmentDetails = {
              title: assessment.title || `${unit.unitName} ${assessmentType}`,
              filename: assessment.filename ?? null,
              filePath: assessment.filePath ?? null,
              uploadDate: assessment.uploadDate || null,
              status: assessment.status,
              uploadedBy: assessment.uploadedBy ?? null,
              reviewNotes: assessment.reviewNotes ?? null,
              isPremium: assessment.isPremium ?? null
            };
            const assessmentId = toIdString(assessment._id) || `${unitId}-${assessmentType}`;
            registerEntry({
              id: `${assessmentId}`,
              type: assessmentType,
              title: assessmentDetails.title,
              status: assessment.status,
              courseId,
              courseName: course.name,
              unitId,
              unitName: unit.unitName,
              topicId: null,
              topicTitle: null,
              uploadDate: assessment.uploadDate,
              filename: assessment.filename,
              reviewNotes: assessment.reviewNotes,
              uploadedBy: assessment.uploadedBy,
              contentDetails: assessmentDetails,
              assessmentId: assessment._id,
              isPremium: assessment.isPremium ?? null
            });
          });
        });
      });
    });

    // Process assessments from Assessment collection (normalized schema)
    assessmentsFromCollection.forEach((assessment) => {
      const uploaderId = assessment.uploadedBy?._id ? toIdString(assessment.uploadedBy._id) : null;
      if (!shouldInclude(uploaderId)) return;

      const assessmentType = assessment.type;
      let displayType = assessmentType;
      if (assessmentType === 'cat') displayType = 'cats';
      else if (assessmentType === 'assignment') displayType = 'assignments';
      else if (assessmentType === 'pastExam') displayType = 'pastExams';

      registerEntry({
        id: toIdString(assessment._id),
        type: displayType,
        title: assessment.title || 'Untitled Assessment',
        status: assessment.status || 'pending',
        courseId: assessment.courseId?._id || assessment.courseId,
        courseName: assessment.courseId?.name || 'Unknown Course',
        unitId: assessment.unitId?._id || assessment.unitId,
        unitName: assessment.unitId?.unitName || 'Unknown Unit',
        topicId: null,
        topicTitle: null,
        uploadDate: assessment.uploadDate || assessment.createdAt,
        filename: assessment.filename,
        reviewNotes: assessment.reviewNotes,
        uploadedBy: uploaderId,
        contentDetails: {
          title: assessment.title,
          filename: assessment.filename,
          filePath: assessment.filePath,
          status: assessment.status,
          isPremium: assessment.isPremium
        },
        assessmentId: assessment._id,
        isPremium: assessment.isPremium
      });
    });

    // Process content assets from ContentAsset collection
    contentAssetsFromCollection.forEach((asset) => {
      const uploaderId = asset.uploadedBy?._id ? toIdString(asset.uploadedBy._id) : null;
      if (!shouldInclude(uploaderId)) return;

      // Normalize type coming from ContentAsset
      const assetType = asset.type === 'video' ? 'video' : 'notes';

      // From populate chain: owner => Topic, Topic.unitId => Unit, Unit.courseId => Course
      const topicData = asset.owner || {};
      const unitData = topicData.unitId || {};
      const courseData = unitData.courseId || {};

      // Try to resolve the embedded unit _id from the pre-fetched courses list
      let embeddedUnitId = null;
      let embeddedUnitName = unitData.unitName || 'Unknown Unit';
      const resolvedCourseId = courseData?._id ? toIdString(courseData._id) : null;

      if (resolvedCourseId) {
        const matchedCourse = courses.find(c => toIdString(c._id) === resolvedCourseId);
        if (matchedCourse && Array.isArray(matchedCourse.units)) {
          // Prefer matching by unitCode when available, else fallback to unitName
          const targetUnitCode = unitData.unitCode;
          const targetUnitName = unitData.unitName;
          const matchedUnit = matchedCourse.units.find(u => {
            if (targetUnitCode && u.unitCode) return u.unitCode === targetUnitCode;
            if (targetUnitName && u.unitName) return u.unitName === targetUnitName;
            return false;
          });
          if (matchedUnit) {
            embeddedUnitId = toIdString(matchedUnit._id);
            embeddedUnitName = matchedUnit.unitName || embeddedUnitName;
          }
        }
      }

      registerEntry({
        id: toIdString(asset._id),
        type: assetType,
        title: asset.title || topicData.title || 'Untitled Content',
        status: asset.status || 'pending',
        courseId: (asset.courseId ? toIdString(asset.courseId) : (resolvedCourseId || null)),
        courseName: courseData?.name || 'Unknown Course',
        // Prefer denormalized unitId; else embedded unit id resolved from courses; else populated unit id
        unitId: (asset.unitId ? toIdString(asset.unitId) : (embeddedUnitId || (unitData?._id ? toIdString(unitData._id) : null))),
        unitName: embeddedUnitName,
        topicId: topicData?._id ? toIdString(topicData._id) : null,
        topicTitle: topicData?.title || null,
        uploadDate: asset.uploadDate || asset.createdAt,
        filename: asset.filename,
        reviewNotes: asset.reviewNotes,
        uploadedBy: uploaderId,
        contentDetails: {
          title: asset.title,
          filename: asset.filename,
          filePath: asset.filePath,
          status: asset.status,
          isPremium: asset.isPremium
        },
        assessmentId: null,
        isPremium: asset.isPremium
      });
    });

    let uploaderMap = {};
    if (uploaderIds.size > 0) {
      const uploaderList = await User.find({ _id: { $in: Array.from(uploaderIds) } })
        .select('firstName lastName email')
        .lean();

      uploaderList.forEach((uploader) => {
        const key = toIdString(uploader._id);
        uploaderMap[key] = {
          name: `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email || 'Mini admin',
          email: uploader.email || null
        };
      });
    }

    content.forEach((item) => {
      if (item.uploadedBy && uploaderMap[item.uploadedBy]) {
        item.uploaderName = uploaderMap[item.uploadedBy].name;
        item.uploaderEmail = uploaderMap[item.uploadedBy].email;
      } else {
        item.uploaderName = item.uploaderName || 'Unknown uploader';
        item.uploaderEmail = item.uploaderEmail || null;
      }
    });

    content.sort((a, b) => {
      const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
      const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
      return dateB - dateA;
    });

    res.json({
      content,
      total: content.length,
      stats
    });
  } catch (error) {
    console.error('Error fetching content status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/content-status
// @desc    Delete one or more pending content items
// @access  Private (Mini Admin or Super Admin)
router.delete('/content-status', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const payloadItems = Array.isArray(req.body?.items) && req.body.items.length > 0
      ? req.body.items
      : [req.body];

    const isSuperAdmin = req.user.role === 'super_admin';
    const currentUserId = req.user.id?.toString();

    const authorizeRemoval = (uploadedBy) => {
      if (isSuperAdmin) {
        return true;
      }
      if (!uploadedBy) {
        return true;
      }
      return uploadedBy.toString() === currentUserId;
    };

    const courseCache = new Map();
    const modifiedCourses = new Set();
    const failures = [];
    let deletedCount = 0;

    const resolveCourse = async (courseId) => {
      if (!courseId) {
        throw new Error('courseId is required');
      }
      if (!courseCache.has(courseId)) {
        const course = await Course.findById(courseId);
        if (!course) {
          throw new Error('Course not found');
        }
        courseCache.set(courseId, course);
      }
      return courseCache.get(courseId);
    };

    const removeTopicContent = (topic, contentType) => {
      if (!topic || !topic.content) {
        throw new Error('Content not found');
      }

      const removeField = (field) => {
        if (!topic.content[field]) {
          throw new Error('Content not found');
        }

        if (!authorizeRemoval(topic.content[field].uploadedBy)) {
          throw new Error('Not authorized to delete this content');
        }

        delete topic.content[field];
        topic.markModified(`content.${field}`);

        const hasRemainingContent = Boolean(
          topic.content.lectureVideo ||
          topic.content.notes ||
          (Array.isArray(topic.content.youtubeResources) && topic.content.youtubeResources.length > 0)
        );

        if (!hasRemainingContent) {
          topic.content = undefined;
          topic.markModified('content');
        }

        return true;
      };

      if (contentType === 'video') {
        return removeField('lectureVideo');
      }

      if (contentType === 'notes') {
        return removeField('notes');
      }

      throw new Error('Content not found');
    };

    const removeAssessmentContent = (unit, type, assessmentId) => {
      if (!['cats', 'assignments', 'pastExams'].includes(type)) {
        throw new Error('Invalid assessment type');
      }

      const collection = unit.assessments?.[type];
      if (!collection || collection.length === 0) {
        throw new Error('Assessment collection not found');
      }

      const index = collection.findIndex((assessment) => assessment._id.toString() === assessmentId);
      if (index === -1) {
        throw new Error('Assessment not found');
      }

      if (!authorizeRemoval(collection[index].uploadedBy)) {
        throw new Error('Not authorized to delete this content');
      }

      collection.splice(index, 1);
      unit.markModified('assessments');
      return true;
    };

    for (const item of payloadItems) {
      try {
        const {
          courseId,
          unitId,
          topicId,
          assessmentId,
          contentType
        } = item || {};

        console.log('Processing delete request:', {
          courseId,
          unitId,
          topicId,
          assessmentId,
          contentType,
          unitIdType: typeof unitId,
          topicIdType: typeof topicId
        });

        if (!courseId || !unitId || !contentType) {
          throw new Error('courseId, unitId, and contentType are required');
        }

        const courseIdStr = courseId.toString();
        const course = await resolveCourse(courseIdStr);
        
        console.log('Course found:', {
          courseId: courseIdStr,
          courseName: course.name,
          unitsCount: course.units.length
        });

        // Try to find unit using Mongoose's .id() method with ObjectId
        // If that fails, fall back to manual search
        let unit = course.units.id(unitId);
        
        console.log('First unit lookup attempt:', {
          found: !!unit,
          method: 'Mongoose .id()'
        });
        
        if (!unit) {
          // Fallback: manually search by comparing string IDs
          const unitIdStr = unitId?.toString();
          unit = course.units.find(u => u._id.toString() === unitIdStr);
          
          console.log('Second unit lookup attempt:', {
            found: !!unit,
            method: 'Array.find() with string comparison',
            searchingFor: unitIdStr
          });
        }
        
        if (!unit) {
          console.error('Unit lookup failed:', {
            courseId: courseIdStr,
            unitId: unitId,
            unitIdType: typeof unitId,
            availableUnits: course.units.map(u => ({ id: u._id.toString(), name: u.unitName }))
          });
          throw new Error('Unit not found');
        }
        
        console.log('Unit found successfully:', {
          unitId: unit._id.toString(),
          unitName: unit.unitName
        });

        let removed = false;

        if (topicId) {
          // Try to find topic using Mongoose's .id() method with ObjectId
          // If that fails, fall back to manual search
          let topic = unit.topics.id(topicId);
          
          if (!topic) {
            // Fallback: manually search by comparing string IDs
            const topicIdStr = topicId?.toString();
            topic = unit.topics.find(t => t._id.toString() === topicIdStr);
          }
          
          if (!topic) {
            console.error('Topic lookup failed:', {
              courseId: courseIdStr,
              unitId: unitId,
              topicId: topicId,
              topicIdType: typeof topicId,
              availableTopics: unit.topics.map(t => ({ id: t._id.toString(), title: t.title }))
            });
            throw new Error('Topic not found');
          }
          removed = removeTopicContent(topic, contentType);
        } else if (assessmentId) {
          removed = removeAssessmentContent(unit, contentType, assessmentId);
        } else {
          throw new Error('topicId or assessmentId is required for deletion');
        }

        if (removed) {
          deletedCount += 1;
          modifiedCourses.add(courseIdStr);
        }
      } catch (error) {
        failures.push({
          item,
          message: error.message || 'Unknown error'
        });
      }
    }

    if (modifiedCourses.size > 0) {
      for (const courseId of modifiedCourses) {
        const course = courseCache.get(courseId);
        if (!course) {
          continue;
        }
        course.markModified('units');
        await course.save();
      }
    }

    if (deletedCount === 0) {
      return res.status(400).json({
        message: 'No content was deleted',
        failures
      });
    }

    res.json({
      message: deletedCount === 1 ? 'Content deleted successfully' : 'Content items deleted successfully',
      deletedCount,
      failures
    });
  } catch (error) {
    console.error('Error deleting admin content:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/resources/pending
// @desc    Get pending resources for approval
// @access  Private (Mini Admin or Super Admin)
router.get('/resources/pending', [
  auth,
  authorize('mini_admin', 'super_admin')
], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const resources = await Resource.find({ 
      approvalStatus: 'pending',
      isActive: true 
    })
    .populate('institution', 'name shortName')
    .populate('course', 'name code')
    .populate('uploadedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Resource.countDocuments({ 
      approvalStatus: 'pending',
      isActive: true 
    });

    res.json({
      resources,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get pending resources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get users with filters
// @access  Private (Super Admin only)
router.get('/users', [
  auth,
  authorize('super_admin')
], async (req, res) => {
  try {
    const { role, institution, search, status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (role) query.role = role;
    if (institution) query.institution = institution;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const numericLimit = Math.min(parseInt(limit, 10) || 20, 1000);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const users = await User.find(query)
      .populate('institution', 'name shortName')
      .populate('course', 'name code')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(numericLimit)
      .skip((numericPage - 1) * numericLimit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: numericPage,
        pages: Math.ceil(total / numericLimit),
        total,
        limit: numericLimit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Super Admin only)
router.put('/users/:id/role', [
  auth,
  authorize('super_admin'),
  body('role').isIn(['student', 'mini_admin', 'super_admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/deactivate
// @desc    Deactivate user account
// @access  Private (Super Admin only)
router.put('/users/:id/deactivate', [
  auth,
  authorize('super_admin')
], async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Super Admin only)
router.get('/analytics', [
  auth,
  authorize('super_admin')
], async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // User registration trends
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: daysAgo },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Revenue trends
    const revenueTrends = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Most popular courses
    const popularCourses = await User.aggregate([
      {
        $match: {
          role: 'student',
          isActive: true
        }
      },
      {
        $group: {
          _id: '$course',
          studentCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $sort: { studentCount: -1 } },
      { $limit: 10 }
    ]);

    // Most accessed resources
    const popularResources = await Resource.find({
      isActive: true,
      approvalStatus: 'approved'
    })
    .populate('course', 'name code')
    .populate('institution', 'name shortName')
    .sort({ viewCount: -1 })
    .limit(10)
    .select('title type viewCount downloadCount course institution');

    res.json({
      userRegistrations,
      revenueTrends,
      popularCourses,
      popularResources
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/assessments
// @desc    Get all assessments uploaded by this admin
// @access  Private (Mini Admin, Super Admin)
router.get('/assessments', [auth, authorize('mini_admin', 'super_admin')], async (req, res) => {
  try {
    console.log('📚 Fetching assessments for admin:', req.user.id);
    
    const Assessment = require('../models/Assessment');
    
    // Build query based on user role
    let query = { isActive: true };
    
    // Mini admins can only see their own assessments, super admins see all
    if (req.user.role === 'mini_admin') {
      query.uploadedBy = req.user.id;
    }
    
    // Fetch assessments from Assessment collection
    const assessments = await Assessment.find(query)
      .populate('courseId', 'name code')
      .populate('unitId', 'unitName unitCode year semester')
      .populate('uploadedBy', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    
    // Format the response to match frontend expectations
    const formattedAssessments = assessments.map(assessment => ({
      _id: assessment._id,
      type: assessment.type === 'cat' ? 'cats' : assessment.type === 'assignment' ? 'assignments' : 'pastExams',
      assessmentType: assessment.type,
      title: assessment.title,
      description: assessment.description || '',
      status: assessment.status,
      filename: assessment.filename,
      filePath: assessment.filePath,
      uploadDate: assessment.uploadDate || assessment.createdAt,
      dueDate: assessment.dueDate,
      totalMarks: assessment.totalMarks,
      duration: assessment.duration || assessment.durationMinutes,
      instructions: assessment.instructions || '',
      academicYear: assessment.academicYear,
      courseId: assessment.courseId?._id,
      courseName: assessment.courseId?.name,
      courseCode: assessment.courseId?.code,
      unitId: assessment.unitId?._id || assessment.unitId,
      unitName: assessment.unitName || assessment.unitId?.unitName,
      unitCode: assessment.unitCode || assessment.unitId?.unitCode,
      year: assessment.unitId?.year,
      semester: assessment.unitId?.semester,
      reviewNotes: assessment.reviewNotes,
      reviewDate: assessment.reviewDate,
      reviewedBy: assessment.reviewedBy,
      isPremium: assessment.isPremium !== false,
      createdBy: assessment.uploadedBy ? `${assessment.uploadedBy.firstName || ''} ${assessment.uploadedBy.lastName || ''}`.trim() : '',
      createdAt: assessment.createdAt,
      imageUrl: `/api/secure-images/${assessment.type}/${assessment._id}`
    }));
    
    console.log(`📊 Found ${formattedAssessments.length} assessments for admin`);
    
    res.json({
      success: true,
      assessments: formattedAssessments,
      totalCount: formattedAssessments.length
    });
    
  } catch (error) {
    console.error('Error fetching admin assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assessments',
      error: error.message
    });
  }
});

module.exports = router;
