const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const buildPendingContent = async ({
  includeLegacy = false,
  legacyWindowMonths = 1,
  uploaderScope = null,
  includeNonPending = false,
  includeUploaderDetails = true
} = {}) => {
  const uploaderFilter = Array.isArray(uploaderScope) && uploaderScope.length > 0 ? uploaderScope.map((id) => id.toString()) : null;

  const Assessment = require('../models/Assessment');
  const ContentAsset = require('../models/ContentAsset');
  const Topic = require('../models/Topic');

  const [courses, miniAdmins, assessmentsFromCollection, contentAssetsFromCollection] = await Promise.all([
    Course.find({}),
    User.find({ role: 'mini_admin', isActive: true }).select('_id firstName lastName email'),
    Assessment.find({ isActive: true, status: 'pending' })
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

  const miniAdminMap = new Map(miniAdmins.map((admin) => [admin._id.toString(), admin]));

  const pendingContentAll = [];
  const unitsMissingAssessments = [];
  const unitsWithAssessments = [];
  const stats = { pending: 0, approved: 0, rejected: 0, total: 0 };

  const legacyCutoff = new Date();
  legacyCutoff.setMonth(legacyCutoff.getMonth() - legacyWindowMonths);
  const legacyWindowDays = legacyWindowMonths * 30;

  const normalizeStatus = (status) => {
    if (status === 'approved') return 'approved';
    if (status === 'rejected') return 'rejected';
    return 'pending';
  };

  const recordStatus = (status) => {
    const normalized = normalizeStatus(status);
    stats[normalized] += 1;
    stats.total += 1;
    return normalized;
  };

  const buildUploaderInfo = (uploadedBy) => {
    const uploaderId = uploadedBy ? uploadedBy.toString() : null;
    if (!uploaderId) {
      return {
        uploaderId: null,
        uploaderName: 'Unknown uploader',
        uploaderEmail: null
      };
    }

    const uploader = miniAdminMap.get(uploaderId);
    if (!uploader) {
      return {
        uploaderId,
        uploaderName: 'Unknown uploader',
        uploaderEmail: null
      };
    }

    const name = `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email || 'Mini admin';

    return {
      uploaderId,
      uploaderName: name,
      uploaderEmail: uploader.email || null
    };
  };

  const hasAssetReference = (content) => {
    if (!content || typeof content !== 'object') {
      return false;
    }

    const candidateKeys = [
      'filename',
      'filePath',
      'fileUrl',
      'secureUrl',
      'secure_url',
      'url',
      'cloudinaryId',
      'publicId',
      'public_id'
    ];

    return candidateKeys.some((key) => {
      const value = content[key];
      return typeof value === 'string' && value.trim().length > 0;
    });
  };

  courses.forEach((course) => {
    const courseUnitsMissingAssessments = [];

    course.units.forEach((unit) => {
      unit.topics.forEach((topic) => {
        const lectureVideo = topic.content?.lectureVideo;
        if (lectureVideo) {
          if (!hasAssetReference(lectureVideo)) {
            return;
          }

          const status = recordStatus(lectureVideo.status);
          if (!includeNonPending && status !== 'pending') {
            return;
          }

          const uploaderId = lectureVideo.uploadedBy ? lectureVideo.uploadedBy.toString() : null;
          if (uploaderFilter && (!uploaderId || !uploaderFilter.includes(uploaderId))) {
            return;
          }

          const uploaderInfo = buildUploaderInfo(lectureVideo.uploadedBy);
          pendingContentAll.push({
            type: 'video',
            courseId: course._id,
            courseName: course.name,
            unitId: unit._id,
            unitName: unit.unitName,
            topicId: topic._id,
            topicTitle: topic.title,
            content: lectureVideo,
            uploadDate: lectureVideo.uploadDate,
            ...(includeUploaderDetails ? uploaderInfo : {})
          });
        }

        const notes = topic.content?.notes;
        if (notes) {
          if (!hasAssetReference(notes)) {
            return;
          }

          const status = recordStatus(notes.status);
          if (!includeNonPending && status !== 'pending') {
            return;
          }

          const uploaderId = notes.uploadedBy ? notes.uploadedBy.toString() : null;
          if (uploaderFilter && (!uploaderId || !uploaderFilter.includes(uploaderId))) {
            return;
          }

          const uploaderInfo = buildUploaderInfo(notes.uploadedBy);
          pendingContentAll.push({
            type: 'notes',
            courseId: course._id,
            courseName: course.name,
            unitId: unit._id,
            unitName: unit.unitName,
            topicId: topic._id,
            topicTitle: topic.title,
            content: notes,
            uploadDate: notes.uploadDate,
            ...(includeUploaderDetails ? uploaderInfo : {})
          });
        }
      });

      const assessments = unit.assessments;
      if (!assessments) {
        courseUnitsMissingAssessments.push(unit.unitName);
        return;
      }

      const catsCount = assessments.cats?.length || 0;
      const assignmentsCount = assessments.assignments?.length || 0;
      const pastExamsCount = assessments.pastExams?.length || 0;
      const totalAssessments = catsCount + assignmentsCount + pastExamsCount;

      if (totalAssessments === 0) {
        courseUnitsMissingAssessments.push(unit.unitName);
      } else {
        unitsWithAssessments.push({
          courseName: course.name,
          unitName: unit.unitName,
          counts: {
            cats: catsCount,
            assignments: assignmentsCount,
            pastExams: pastExamsCount
          }
        });

      }
    });

    if (courseUnitsMissingAssessments.length > 0) {
      unitsMissingAssessments.push({
        courseName: course.name,
        units: courseUnitsMissingAssessments
      });
    }
  });

  console.log(`📊 buildPendingContent: assessmentsFromCollection=${assessmentsFromCollection.length}, contentAssetsFromCollection=${contentAssetsFromCollection.length}`);

  // Include assessments from Assessment collection (normalized schema)
  assessmentsFromCollection.forEach((assessment) => {
    const normalizedStatus = recordStatus(assessment.status);
    if (!includeNonPending && normalizedStatus !== 'pending') {
      return;
    }

    // Optional uploader filtering
    const uploaderId = assessment.uploadedBy?._id ? assessment.uploadedBy._id.toString() : null;
    if (uploaderFilter && (!uploaderId || !uploaderFilter.includes(uploaderId))) {
      return;
    }

    // Map to the exact types the frontend expects in pending lists
    // cats | assignments | pastExams
    const assessmentType = assessment.type; // cat | assignment | pastExam | exam
    let displayType = assessmentType;
    if (assessmentType === 'cat') displayType = 'cats';
    else if (assessmentType === 'assignment') displayType = 'assignments';
    else if (assessmentType === 'pastExam') displayType = 'pastExams';

    pendingContentAll.push({
      type: displayType,
      assessmentType,
      courseId: assessment.courseId?._id || assessment.courseId,
      courseName: assessment.courseId?.name || 'Unknown Course',
      unitId: assessment.unitId?._id || assessment.unitId,
      unitName: assessment.unitName || assessment.unitId?.unitName || 'Unknown Unit',
      assessmentId: assessment._id,
      content: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        status: assessment.status,
        filename: assessment.filename,
        filePath: assessment.filePath,
        uploadDate: assessment.uploadDate,
        dueDate: assessment.dueDate,
        totalMarks: assessment.totalMarks,
        duration: assessment.duration,
        isPremium: assessment.isPremium,
        reviewNotes: assessment.reviewNotes,
        reviewDate: assessment.reviewDate
      },
      uploadDate: assessment.uploadDate || assessment.createdAt,
      ...(includeUploaderDetails
        ? {
            uploaderId,
            uploaderName: assessment.uploadedBy
              ? `${assessment.uploadedBy.firstName || ''} ${assessment.uploadedBy.lastName || ''}`.trim()
              : assessment.createdByName || 'Unknown',
            uploaderEmail: assessment.uploadedBy?.email || null
          }
        : {})
    });
  });

  const filteredPending = pendingContentAll.filter((item) => {
    if (includeLegacy) return true;
    if (!item.uploadDate) return false;
    const uploadedAt = new Date(item.uploadDate);
    if (Number.isNaN(uploadedAt.getTime())) return false;
    return uploadedAt >= legacyCutoff;
  });

  filteredPending.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

  const legacyPending = pendingContentAll.length - filteredPending.length;

  return {
    pendingContent: filteredPending,
    content: filteredPending,
    stats,
    unitsMissingAssessments,
    unitsWithAssessments,
    legacyPending,
    legacyWindowDays,
    totalPending: filteredPending.length,
    totalPendingIncludingLegacy: pendingContentAll.length,
    courseCount: courses.length
  };
};

// @route   GET /api/content-approval/pending
// @desc    Get all pending content for approval
// @access  Private (Super Admin only)
router.get('/pending', [
  auth,
], async (req, res) => {
  try {
    console.log('🔍 Content approval: Fetching courses for super admin...');
    console.log('👤 Requested by user:', req.user.id, req.user.email);

    const includeLegacy = req.query.includeLegacy === 'true';
    const {
      pendingContent: allPendingContent,
      unitsMissingAssessments,
      unitsWithAssessments,
      legacyPending,
      legacyWindowDays,
      totalPending: totalPendingRaw,
      totalPendingIncludingLegacy,
      courseCount
    } = await buildPendingContent({ includeLegacy });

    // Optional filters: institution, courseId, unitId, uploaderId, type, assessmentType
    const { institution, courseId: qCourseId, unitId: qUnitId, uploaderId: qUploaderId, type: qType, assessmentType: qAssessmentType } = req.query;

    const pendingContent = allPendingContent.filter(item => {
      if (institution && String(item.institutionId || item.courseId?.institution || '') !== String(institution)) return false;
      if (qCourseId && String(item.courseId) !== String(qCourseId)) return false;
      if (qUnitId && String(item.unitId) !== String(qUnitId)) return false;
      if (qUploaderId && String(item.uploaderId || '') !== String(qUploaderId)) return false;
      if (qType && String(item.type) !== String(qType)) return false;
      if (qAssessmentType && String(item.assessmentType || '') !== String(qAssessmentType)) return false;
      return true;
    });

    const totalPending = pendingContent.length;

    console.log('📊 Found courses:', courseCount);
    console.log(`📊 Total pending content found: ${totalPendingIncludingLegacy} (built). After filters: ${pendingContent.length}${includeLegacy ? ' (legacy included)' : ''}`);

    if (pendingContent.length > 0) {
      const summary = pendingContent.map((c) => ({
        type: c.type,
        title: c.content?.title || c.topicTitle,
        course: c.courseName,
        unit: c.unitName
      }));
      console.log('📋 Pending content summary:', summary);
    }

    if (unitsWithAssessments.length > 0) {
      const condensed = unitsWithAssessments.slice(0, 20).map(entry => ({
        course: entry.courseName,
        unit: entry.unitName,
        counts: entry.counts
      }));
      console.log('📘 Units with registered assessments (sample of first 20):', condensed);

      if (unitsWithAssessments.length > 20) {
        console.log(`📘 ${unitsWithAssessments.length - 20} additional units with assessments omitted from log.`);
      }
    }

    if (unitsMissingAssessments.length > 0) {
      const totalMissingUnits = unitsMissingAssessments.reduce((sum, entry) => sum + entry.units.length, 0);
      const coursesDisplayed = unitsMissingAssessments.slice(0, 10);
      const summaryPayload = coursesDisplayed.map(entry => ({
        course: entry.courseName,
        units: entry.units.slice(0, 5)
      }));

      console.log('⚠️ Units without assessments (showing up to 5 units for the first 10 courses):', summaryPayload);

      const omittedCourses = unitsMissingAssessments.length - coursesDisplayed.length;
      const displayedUnitsCount = coursesDisplayed.reduce((sum, entry) => sum + Math.min(entry.units.length, 5), 0);
      const omittedUnits = totalMissingUnits - displayedUnitsCount;

      if (omittedCourses > 0 || omittedUnits > 0) {
        console.log(`⚠️ Additional omission summary: ${omittedCourses} more course(s), ${Math.max(omittedUnits, 0)} unit(s) without assessments not listed above.`);
      }
    }

    res.json({
      pendingContent,
      totalPending,
      legacyPending,
      legacyWindowDays
    });
  } catch (error) {
    console.error('❌ Get pending content error:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/content-approval/approve
// @desc    Approve content
// @access  Private (Super Admin only)
router.post('/approve', [
  auth,
  authorize('super_admin')
], async (req, res) => {
  try {
    const { 
      courseId, 
      unitId, 
      topicId, 
      assessmentId, 
      contentType, 
      reviewNotes,
      isPremium = false
    } = req.body;

    console.log('📝 Approve request:', { courseId, unitId, topicId, assessmentId, contentType });

    let contentUpdated = false;

    // First, try to handle Assessment collection (normalized schema)
    if (assessmentId) {
      const Assessment = require('../models/Assessment');
      const assessmentDoc = await Assessment.findById(assessmentId);
      
      if (assessmentDoc) {
        assessmentDoc.status = 'approved';
        assessmentDoc.reviewedBy = req.user.id;
        assessmentDoc.reviewDate = new Date();
        assessmentDoc.reviewNotes = reviewNotes || '';
        assessmentDoc.isPremium = isPremium;
        await assessmentDoc.save();
        contentUpdated = true;
        console.log(`✅ Assessment ${assessmentId} approved in Assessment collection`);
        
        const { content: updatedContent, stats: updatedStats } = await buildPendingContent();
        return res.json({
          message: 'Content approved successfully',
          pendingContent: updatedContent,
          stats: updatedStats
        });
      }
    }

    // Try ContentAsset collection FIRST (this is the primary storage for new uploads)
    if (topicId && (contentType === 'video' || contentType === 'notes')) {
      const ContentAsset = require('../models/ContentAsset');
      
      // ContentAsset model uses 'type' field, not 'assetType'
      const contentAsset = await ContentAsset.findOne({ 
        owner: topicId, 
        ownerType: 'topic',
        type: contentType === 'video' ? 'video' : 'notes'
      });
      
      if (contentAsset) {
        contentAsset.status = 'approved';
        contentAsset.reviewedBy = req.user.id;
        contentAsset.reviewDate = new Date();
        contentAsset.reviewNotes = reviewNotes || '';
        contentAsset.isPremium = isPremium;
        await contentAsset.save();
        contentUpdated = true;
        console.log(`✅ ContentAsset ${contentAsset._id} approved (owner: ${topicId}, type: ${contentAsset.type})`);
        
        const { content: updatedContent, stats: updatedStats } = await buildPendingContent();
        return res.json({
          message: 'Content approved successfully',
          pendingContent: updatedContent,
          stats: updatedStats
        });
      }
      
      console.log(`⚠️ No ContentAsset found for owner: ${topicId}, type: ${contentType}, trying embedded content...`);
    }

    // Fallback to embedded content in Course collection
    if (!courseId) {
      console.warn('Approve content failed: no courseId provided and ContentAsset not found');
      return res.status(404).json({
        message: 'Content not found - no courseId provided',
        topicId,
        contentType
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      console.warn('Approve content failed: course not found', { courseId, unitId, topicId, assessmentId, contentType });
      return res.status(404).json({
        message: 'Course not found',
        courseId
      });
    }

    if (!unitId) {
      console.warn('Approve content failed: no unitId provided');
      return res.status(404).json({
        message: 'Unit ID required for embedded content',
        courseId
      });
    }

    const unit = course.units.id(unitId);
    if (!unit) {
      console.warn('Approve content failed: unit not found in course', { courseId, unitId, topicId, assessmentId, contentType });
      return res.status(404).json({
        message: 'Unit not found in course (this content may be in ContentAsset collection)',
        courseId,
        unitId
      });
    }

    if (topicId) {
      const topic = unit.topics.id(topicId);
      if (!topic) {
        console.warn('Reject content failed: topic not found', { courseId, unitId, topicId, contentType });
        return res.status(404).json({
          message: 'Topic not found',
          courseId,
          unitId,
          topicId
        });
      }

      if (contentType === 'video' && topic.content?.lectureVideo) {
        topic.content.lectureVideo.status = 'approved';
        topic.content.lectureVideo.reviewedBy = req.user.id;
        topic.content.lectureVideo.reviewDate = new Date();
        topic.content.lectureVideo.reviewNotes = reviewNotes;
        topic.content.lectureVideo.isPremium = isPremium;
        topic.markModified('content');
        contentUpdated = true;
      } else if (contentType === 'notes' && topic.content?.notes) {
        topic.content.notes.status = 'approved';
        topic.content.notes.reviewedBy = req.user.id;
        topic.content.notes.reviewDate = new Date();
        topic.content.notes.reviewNotes = reviewNotes;
        topic.content.notes.isPremium = isPremium;
        topic.markModified('content');
        contentUpdated = true;
      }
    } else if (assessmentId) {
      // First try to find in Assessment collection (normalized schema)
      const Assessment = require('../models/Assessment');
      const assessmentDoc = await Assessment.findById(assessmentId);
      
      if (assessmentDoc) {
        assessmentDoc.status = 'approved';
        assessmentDoc.reviewedBy = req.user.id;
        assessmentDoc.reviewDate = new Date();
        assessmentDoc.reviewNotes = reviewNotes || '';
        assessmentDoc.isPremium = isPremium;
        await assessmentDoc.save();
        contentUpdated = true;
        console.log(`✅ Assessment ${assessmentId} approved in Assessment collection`);
      } else {
        // Fallback: check embedded assessments
        const assessmentTypes = ['cats', 'assignments', 'pastExams'];
        for (const type of assessmentTypes) {
          const assessment = unit.assessments?.[type]?.id(assessmentId);
          if (assessment) {
            assessment.status = 'approved';
            assessment.reviewedBy = req.user.id;
            assessment.reviewDate = new Date();
            assessment.reviewNotes = reviewNotes;
            assessment.isPremium = isPremium;
            unit.markModified(`assessments.${type}`);
            contentUpdated = true;
            break;
          }
        }
      }
    }

    if (!contentUpdated) {
      console.warn('Reject content failed: matching content not found under unit/topic', { courseId, unitId, topicId, assessmentId, contentType });
      return res.status(404).json({
        message: 'Content not found',
        courseId,
        unitId,
        topicId,
        assessmentId,
        contentType
      });
    }

    course.markModified('units');
    await course.save({ validateBeforeSave: false });

    const { content: updatedContent, stats: updatedStats } = await buildPendingContent();

    res.json({
      message: 'Content approved successfully',
      pendingContent: updatedContent,
      stats: updatedStats
    });
  } catch (error) {
    console.error('Approve content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/content-approval/stats
// @desc    Get content approval statistics
// @access  Private (Super Admin only)
router.get('/stats', [
  auth,
  authorize('super_admin')
], async (req, res) => {
  try {
    const Assessment = require('../models/Assessment');
    const ContentAsset = require('../models/ContentAsset');

    const [courses, assessments, contentAssets] = await Promise.all([
      Course.find({}),
      Assessment.find({ isActive: true }).lean(),
      ContentAsset.find({ ownerType: 'topic' }).lean()
    ]);

    let stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    // Count from Assessment collection
    assessments.forEach(assessment => {
      const status = assessment.status || 'pending';
      if (stats[status] !== undefined) {
        stats[status]++;
        stats.total++;
      }
    });

    // Count from ContentAsset collection
    contentAssets.forEach(asset => {
      const status = asset.status || 'pending';
      if (stats[status] !== undefined) {
        stats[status]++;
        stats.total++;
      }
    });

    // Count from legacy embedded content
    courses.forEach(course => {
      course.units.forEach(unit => {
        unit.topics.forEach(topic => {
          // Count video content
          if (topic.content?.lectureVideo?.status) {
            stats[topic.content.lectureVideo.status]++;
            stats.total++;
          }

          // Count notes content
          if (topic.content?.notes?.status) {
            stats[topic.content.notes.status]++;
            stats.total++;
          }
        });

        // Count assessments
        ['cats', 'assignments', 'pastExams'].forEach(assessmentType => {
          unit.assessments?.[assessmentType]?.forEach(assessment => {
            if (assessment.status) {
              stats[assessment.status]++;
              stats.total++;
            }
          });
        });
      });
    });

    console.log('📊 Content approval stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/content-approval/test
// @desc    Test endpoint for content approval routes
// @access  Public
router.get('/test', (req, res) => {
  console.log('Content approval test endpoint hit');
  res.json({ message: 'Content approval routes are working!' });
});

// @route   DELETE /api/content-approval/delete
// @desc    Delete content permanently from database
// @access  Private (Super Admin or Content Owner)
router.delete('/delete', auth, async (req, res) => {
  console.log('DELETE /api/content-approval/delete called');
  console.log('Request body:', req.body);
  
  const isSuperAdmin = req.user.role === 'super_admin';
  const userId = req.user?.id;
  
  if (!isSuperAdmin && !userId) {
    return res.status(403).json({ message: 'Authentication required' });
  }

  try {
    const { courseId, unitId, topicId, assessmentId, contentType } = req.body;
    
    console.log('🗑️ Delete request:', { courseId, unitId, topicId, assessmentId, contentType });

    let contentDeleted = false;

    // FIRST: Try to delete from ContentAsset collection (for videos/notes)
    if (topicId && (contentType === 'video' || contentType === 'notes')) {
      const ContentAsset = require('../models/ContentAsset');
      
      const deletedAsset = await ContentAsset.findOneAndDelete({
        owner: topicId,
        ownerType: 'topic',
        type: contentType
      });

      if (deletedAsset) {
        contentDeleted = true;
        console.log(`✅ Deleted ContentAsset: ${deletedAsset._id} (type: ${contentType})`);
        
        return res.json({
          success: true,
          message: 'Content deleted successfully from ContentAsset collection',
          deletedId: deletedAsset._id
        });
      }
    }

    // SECOND: Try to delete from Assessment collection
    if (assessmentId) {
      const Assessment = require('../models/Assessment');
      
      const deletedAssessment = await Assessment.findByIdAndUpdate(
        assessmentId,
        { isActive: false, status: 'deleted' },
        { new: true }
      );

      if (deletedAssessment) {
        contentDeleted = true;
        console.log(`✅ Soft-deleted Assessment: ${assessmentId}`);
        
        return res.json({
          success: true,
          message: 'Assessment deleted successfully',
          deletedId: assessmentId
        });
      }
    }

    // THIRD: Fallback to embedded content in Course collection
    if (!courseId || !unitId) {
      return res.status(400).json({
        success: false,
        message: 'Content not found in ContentAsset or Assessment collections, and courseId/unitId not provided for embedded content'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const unit = course.units.id(unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found in course'
      });
    }

    // Check authorization for embedded content
    let isAuthorized = isSuperAdmin;
    if (!isAuthorized && userId) {
      if (course.createdBy && course.createdBy.toString() === userId) {
        isAuthorized = true;
      }
      if (unit.createdBy && unit.createdBy.toString() === userId) {
        isAuthorized = true;
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this content'
      });
    }
    // Handle embedded content deletion
    if (topicId) {
      const topic = unit.topics.id(topicId);
      if (!topic) {
        return res.status(404).json({ 
          success: false,
          message: 'Topic not found in embedded content' 
        });
      }

      if (contentType === 'video' && topic.content?.lectureVideo) {
        delete topic.content.lectureVideo;
        topic.markModified('content');
        contentDeleted = true;
      } else if (contentType === 'notes' && topic.content?.notes) {
        delete topic.content.notes;
        topic.markModified('content');
        contentDeleted = true;
      }
    } else if (assessmentId) {
      const assessmentTypes = ['cats', 'assignments', 'pastExams'];
      for (const type of assessmentTypes) {
        const assessmentIndex = unit.assessments?.[type]?.findIndex(
          assessment => assessment._id.toString() === assessmentId
        );
        if (assessmentIndex !== -1) {
          unit.assessments[type].splice(assessmentIndex, 1);
          unit.markModified(`assessments.${type}`);
          contentDeleted = true;
          break;
        }
      }
    }

    if (!contentDeleted) {
      return res.status(404).json({ 
        success: false,
        message: 'Content not found in embedded course data' 
      });
    }

    course.markModified('units');
    await course.save({ validateBeforeSave: false });

    console.log(`✅ Deleted embedded content from course ${courseId}`);
    
    return res.json({
      success: true,
      message: 'Content deleted successfully from embedded course data'
    });
  } catch (error) {
    console.error('❌ Delete content error:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during content deletion',
      error: error.message 
    });
  }
});

// @route   GET /api/content-approval/approved
// @desc    Get all approved content for management
// @access  Private (Super Admin only)
router.get('/approved', [
  auth,
  authorize('super_admin')
], async (req, res) => {
  try {
    const Assessment = require('../models/Assessment');
    const ContentAsset = require('../models/ContentAsset');
    const User = require('../models/User');

    const [courses, assessments, contentAssets, miniAdmins] = await Promise.all([
      Course.find({}),
      Assessment.find({ isActive: true, status: 'approved' })
        .populate('courseId', 'name code')
        .populate('unitId', 'unitName unitCode')
        .populate('uploadedBy', 'firstName lastName email')
        .lean(),
      ContentAsset.find({ ownerType: 'topic', status: 'approved' })
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
        .lean(),
      User.find({ role: 'mini_admin', isActive: true }).select('_id firstName lastName email')
    ]);

    const miniAdminMap = new Map(miniAdmins.map((admin) => [admin._id.toString(), admin]));
    const approvedContent = [];

    // Add ContentAsset items (videos and notes)
    contentAssets.forEach(asset => {
      const owner = asset.owner;
      const unit = owner?.unitId;
      const course = unit?.courseId;

      if (owner && unit && course) {
        const uploader = asset.uploadedBy;
        const uploaderName = uploader 
          ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email
          : 'Unknown';

        approvedContent.push({
          topicId: asset.owner._id,
          topicTitle: owner.title || asset.title || 'Untitled',
          type: asset.type,
          courseId: course._id,
          courseName: course.name,
          unitId: unit._id,
          unitName: unit.unitName,
          uploadDate: asset.uploadDate,
          uploaderName,
          uploaderEmail: uploader?.email || null,
          content: {
            filename: asset.filename,
            filePath: asset.filePath,
            uploadedBy: uploaderName,
            isPremium: asset.isPremium,
            reviewDate: asset.reviewDate,
            reviewNotes: asset.reviewNotes,
            status: asset.status
          }
        });
      }
    });

    // Add Assessment collection items
    assessments.forEach(assessment => {
      const uploader = assessment.uploadedBy;
      const uploaderName = uploader 
        ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email
        : 'Unknown';

      const assessmentType = assessment.type;
      let displayType = assessmentType;
      if (assessmentType === 'cat') displayType = 'cats';
      else if (assessmentType === 'assignment') displayType = 'assignments';
      else if (assessmentType === 'pastExam') displayType = 'pastExams';

      approvedContent.push({
        assessmentId: assessment._id,
        type: displayType,
        assessmentType,
        courseId: assessment.courseId?._id || assessment.courseId,
        courseName: assessment.courseId?.name || 'Unknown Course',
        unitId: assessment.unitId?._id || assessment.unitId,
        unitName: assessment.unitName || assessment.unitId?.unitName || 'Unknown Unit',
        uploadDate: assessment.uploadDate || assessment.createdAt,
        uploaderName,
        uploaderEmail: uploader?.email || null,
        content: {
          _id: assessment._id,
          title: assessment.title,
          description: assessment.description,
          status: assessment.status,
          filename: assessment.filename,
          filePath: assessment.filePath,
          uploadedBy: uploaderName,
          dueDate: assessment.dueDate,
          totalMarks: assessment.totalMarks,
          duration: assessment.duration,
          isPremium: assessment.isPremium,
          reviewNotes: assessment.reviewNotes,
          reviewDate: assessment.reviewDate
        }
      });
    });

    // Add embedded content from Course collection (legacy)
    courses.forEach(course => {
      course.units.forEach(unit => {
        // Check approved topics with content
        unit.topics?.forEach(topic => {
          if (topic.content?.lectureVideo?.status === 'approved') {
            const uploaderId = topic.content.lectureVideo.uploadedBy?.toString();
            const uploader = uploaderId ? miniAdminMap.get(uploaderId) : null;
            const uploaderName = uploader 
              ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email
              : 'Unknown';

            approvedContent.push({
              topicId: topic._id,
              topicTitle: topic.title,
              type: 'video',
              courseId: course._id,
              courseName: course.name,
              unitId: unit._id,
              unitName: unit.unitName,
              uploadDate: topic.content.lectureVideo.uploadDate,
              uploaderName,
              uploaderEmail: uploader?.email || null,
              content: {
                filename: topic.content.lectureVideo.filename,
                filePath: topic.content.lectureVideo.filePath,
                uploadedBy: uploaderName,
                isPremium: topic.content.lectureVideo.isPremium,
                reviewDate: topic.content.lectureVideo.reviewDate,
                reviewNotes: topic.content.lectureVideo.reviewNotes,
                status: 'approved'
              }
            });
          }

          if (topic.content?.notes?.status === 'approved') {
            const uploaderId = topic.content.notes.uploadedBy?.toString();
            const uploader = uploaderId ? miniAdminMap.get(uploaderId) : null;
            const uploaderName = uploader 
              ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email
              : 'Unknown';

            approvedContent.push({
              topicId: topic._id,
              topicTitle: topic.title,
              type: 'notes',
              courseId: course._id,
              courseName: course.name,
              unitId: unit._id,
              unitName: unit.unitName,
              uploadDate: topic.content.notes.uploadDate,
              uploaderName,
              uploaderEmail: uploader?.email || null,
              content: {
                filename: topic.content.notes.filename,
                filePath: topic.content.notes.filePath,
                uploadedBy: uploaderName,
                isPremium: topic.content.notes.isPremium,
                reviewDate: topic.content.notes.reviewDate,
                reviewNotes: topic.content.notes.reviewNotes,
                status: 'approved'
              }
            });
          }
        });

        // Check approved assessments (embedded)
        ['cats', 'assignments', 'pastExams'].forEach(assessmentType => {
          unit.assessments?.[assessmentType]?.forEach(assessment => {
            if (assessment.status === 'approved') {
              const uploaderId = assessment.uploadedBy?.toString();
              const uploader = uploaderId ? miniAdminMap.get(uploaderId) : null;
              const uploaderName = uploader 
                ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email
                : 'Unknown';

              approvedContent.push({
                assessmentId: assessment._id,
                type: assessmentType,
                courseId: course._id,
                courseName: course.name,
                unitId: unit._id,
                unitName: unit.unitName,
                uploadDate: assessment.uploadDate,
                uploaderName,
                uploaderEmail: uploader?.email || null,
                content: {
                  title: assessment.title,
                  filename: assessment.filename,
                  filePath: assessment.filePath,
                  uploadedBy: uploaderName,
                  isPremium: assessment.isPremium,
                  reviewDate: assessment.reviewDate,
                  reviewNotes: assessment.reviewNotes,
                  status: 'approved'
                }
              });
            }
          });
        });
      });
    });

    // Sort by approval date (newest first)
    approvedContent.sort((a, b) => {
      const dateA = new Date(a.content.reviewDate || a.uploadDate);
      const dateB = new Date(b.content.reviewDate || b.uploadDate);
      return dateB - dateA;
    });

    console.log(`📊 Found ${approvedContent.length} approved content items (${contentAssets.length} from ContentAsset, ${assessments.length} from Assessment, ${approvedContent.length - contentAssets.length - assessments.length} embedded)`);

    res.json({
      success: true,
      count: approvedContent.length,
      approvedContent
    });

  } catch (error) {
    console.error('❌ Error fetching approved content:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   POST /api/content-approval/reject
// @desc    Reject content and permanently remove assets from the course
// @access  Private (Super Admin only)
router.post('/reject', [
  auth,
  authorize('super_admin')
], async (req, res) => {
  try {
    const { 
      courseId, 
      unitId, 
      topicId, 
      assessmentId, 
      contentType, 
      reviewNotes 
    } = req.body;

    console.log('❌ Reject request:', { courseId, unitId, topicId, assessmentId, contentType });

    let contentUpdated = false;

    // First, try to handle Assessment collection (normalized schema)
    if (assessmentId) {
      const Assessment = require('../models/Assessment');
      const assessmentDoc = await Assessment.findById(assessmentId);
      
      if (assessmentDoc) {
        assessmentDoc.status = 'rejected';
        assessmentDoc.reviewedBy = req.user.id;
        assessmentDoc.reviewDate = new Date();
        assessmentDoc.reviewNotes = reviewNotes || '';
        await assessmentDoc.save();
        contentUpdated = true;
        console.log(`❌ Assessment ${assessmentId} rejected in Assessment collection`);
        
        const { content: updatedContent, stats: updatedStats } = await buildPendingContent();
        return res.json({
          message: 'Content rejected successfully',
          pendingContent: updatedContent,
          stats: updatedStats
        });
      }
    }

    // Try ContentAsset collection FIRST (this is the primary storage for new uploads)
    if (topicId && (contentType === 'video' || contentType === 'notes')) {
      const ContentAsset = require('../models/ContentAsset');
      
      // ContentAsset model uses 'type' field, not 'assetType'
      const contentAsset = await ContentAsset.findOne({ 
        owner: topicId, 
        ownerType: 'topic',
        type: contentType === 'video' ? 'video' : 'notes'
      });
      
      if (contentAsset) {
        contentAsset.status = 'rejected';
        contentAsset.reviewedBy = req.user.id;
        contentAsset.reviewDate = new Date();
        contentAsset.reviewNotes = reviewNotes || '';
        await contentAsset.save();
        contentUpdated = true;
        console.log(`❌ ContentAsset ${contentAsset._id} rejected (owner: ${topicId}, type: ${contentAsset.type})`);
        
        const { content: updatedContent, stats: updatedStats } = await buildPendingContent();
        return res.json({
          message: 'Content rejected successfully',
          pendingContent: updatedContent,
          stats: updatedStats
        });
      }
      
      console.log(`⚠️ No ContentAsset found for owner: ${topicId}, type: ${contentType}, trying embedded content...`);
    }

    if (reviewNotes) {
      console.log('📝 Reject reason:', reviewNotes);
    }

    // Fallback to embedded content in Course collection
    if (!courseId) {
      console.warn('Reject content failed: no courseId provided and ContentAsset not found');
      return res.status(404).json({
        message: 'Content not found - no courseId provided',
        topicId,
        contentType
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!unitId) {
      console.warn('Reject content failed: no unitId provided');
      return res.status(404).json({
        message: 'Unit ID required for embedded content',
        courseId
      });
    }

    const unit = course.units.id(unitId);
    if (!unit) {
      console.warn('Reject content failed: unit not found in course', { courseId, unitId, topicId, assessmentId, contentType });
      return res.status(404).json({
        message: 'Unit not found in course (this content may be in ContentAsset collection)',
        courseId,
        unitId
      });
    }

    if (topicId) {
      const topic = unit.topics.id(topicId);
      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
      }

      if (contentType === 'video' && topic.content?.lectureVideo) {
        delete topic.content.lectureVideo;
        topic.markModified('content');
        contentUpdated = true;
      } else if (contentType === 'notes' && topic.content?.notes) {
        delete topic.content.notes;
        topic.markModified('content');
        contentUpdated = true;
      }
    } else if (assessmentId) {
      // First try to find in Assessment collection (normalized schema)
      const Assessment = require('../models/Assessment');
      const assessmentDoc = await Assessment.findById(assessmentId);
      
      if (assessmentDoc) {
        assessmentDoc.status = 'rejected';
        assessmentDoc.reviewedBy = req.user.id;
        assessmentDoc.reviewDate = new Date();
        assessmentDoc.reviewNotes = reviewNotes || 'Rejected by super admin';
        assessmentDoc.isActive = false;
        await assessmentDoc.save();
        contentUpdated = true;
        console.log(`✅ Assessment ${assessmentId} rejected in Assessment collection`);
      } else {
        // Fallback: check embedded assessments
        const assessmentTypes = ['cats', 'assignments', 'pastExams'];
        for (const type of assessmentTypes) {
          const collection = unit.assessments?.[type];
          if (!Array.isArray(collection) || collection.length === 0) {
            continue;
          }

          const index = collection.findIndex((assessment) => assessment._id.toString() === assessmentId);
          if (index !== -1) {
            collection.splice(index, 1);
            unit.markModified(`assessments.${type}`);
            contentUpdated = true;
            break;
          }
        }
      }
    }

    if (!contentUpdated) {
      return res.status(404).json({ message: 'Content not found' });
    }

    course.markModified('units');
    await course.save({ validateBeforeSave: false });

    const { content: updatedContent, stats: updatedStats } = await buildPendingContent();

    res.json({
      message: 'Content rejected and removed successfully',
      pendingContent: updatedContent,
      stats: updatedStats
    });
  } catch (error) {
    console.error('Reject content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Temporary debug route without auth
router.get('/pending-debug', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Content approval pending (no auth)...');
    
    const courses = await Course.find({});
    console.log('📊 Found courses:', courses.length);

    const pendingContent = [];

    courses.forEach(course => {
      course.units.forEach(unit => {
        // Check assessments only for debugging
        if (unit.assessments) {
          ['cats', 'assignments', 'pastExams'].forEach(assessmentType => {
            const assessments = unit.assessments[assessmentType];
            if (assessments && assessments.length > 0) {
              assessments.forEach(assessment => {
                console.log(`🔍 Found ${assessmentType}: ${assessment.title}, status: ${assessment.status}`);
                if (assessment.status === 'pending') {
                  console.log(`✅ Adding pending ${assessmentType}: ${assessment.title}`);
                  pendingContent.push({
                    type: assessmentType,
                    courseId: course._id,
                    courseName: course.name,
                    unitId: unit._id,
                    unitName: unit.unitName,
                    assessmentId: assessment._id,
                    content: assessment,
                    uploadDate: assessment.uploadDate
                  });
                }
              });
            }
          });
        }
      });
    });

    console.log(`📊 Total pending content found: ${pendingContent.length}`);

    res.json({
      success: true,
      pendingContent,
      totalPending: pendingContent.length
    });

  } catch (error) {
    console.error('Error fetching pending content:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
