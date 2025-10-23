const mongoose = require('mongoose');
const Unit = require('../models/Unit');
const Topic = require('../models/Topic');
const Assessment = require('../models/Assessment');

const TYPE_MAP = {
  cat: 'cats',
  assignment: 'assignments',
  pastExam: 'pastExams'
};

const buildUnitPayload = (unit) => ({
  id: unit._id,
  name: unit.unitName,
  code: unit.unitCode,
  year: unit.year,
  semester: unit.semester,
  academicYear: unit.academicYear || null,
  subcourse: unit.subcourse || ''
});

const buildTopicPayload = (topic) => ({
  id: topic._id,
  title: topic.title,
  number: topic.topicNumber,
  description: topic.description
});

const shouldIncludeAsset = (asset) => !!asset && asset.status === 'approved' && !!asset.filename;
const isApproved = (asset) => !!asset && asset.status === 'approved';

async function getApprovedCourseContentNormalized(courseId, { year, semester, userSubscriptions = {} } = {}) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return { content: [], units: [] };
  }

  const unitQuery = { courseId };
  if (year) {
    unitQuery.year = Number(year);
  }
  if (semester) {
    unitQuery.semester = Number(semester);
  }

  const units = await Unit.find(unitQuery).lean();
  if (!units.length) {
    return { content: [], units: [] };
  }

  const unitIds = units.map((unit) => unit._id);
  const unitMap = new Map(units.map((unit) => [unit._id.toString(), unit]));

  const topics = await Topic.find({ unitId: { $in: unitIds } }).lean();

  // Fetch content assets for all topics from the normalized collection
  const topicIds = topics.map((t) => t._id);
  const rawAssets = await mongoose.connection.collection('contentassets')
    .find({ topicId: { $in: topicIds }, status: 'approved' })
    .toArray();

  // Group assets by topicId and type
  const assetsByTopic = new Map();
  for (const asset of rawAssets) {
    const key = asset.topicId?.toString();
    if (!key) continue;
    if (!assetsByTopic.has(key)) assetsByTopic.set(key, { lectureVideo: null, notes: null, youtube: [] });
    const bucket = assetsByTopic.get(key);
    if (asset.type === 'lectureVideo' && !bucket.lectureVideo) bucket.lectureVideo = asset;
    else if (asset.type === 'notes' && !bucket.notes) bucket.notes = asset;
    else if (asset.type === 'youtubeResource') bucket.youtube.push(asset);
  }

  const assessments = await Assessment.find({
    unitId: { $in: unitIds },
    status: 'approved'
  })
    .populate('contentAssetId')
    .lean();

  const approvedContent = [];

  topics.forEach((topic) => {
    const unit = unitMap.get(topic.unitId.toString());
    if (!unit) {
      return;
    }

    const unitPayload = buildUnitPayload(unit);
    const topicPayload = buildTopicPayload(topic);
    const hasSubscription = !!userSubscriptions[unit.year];

    const topicAssets = assetsByTopic.get(topic._id.toString()) || {};

    const lectureVideo = topicAssets.lectureVideo;
    if (shouldIncludeAsset(lectureVideo)) {
      const isPremium = lectureVideo.isPremium || false;
      const canAccess = !isPremium || hasSubscription;

      approvedContent.push({
        id: `${unit._id}-${topic._id}-video`,
        type: 'video',
        title: lectureVideo.title || topic.title,
        description: topic.description,
        filename: canAccess ? lectureVideo.filename : null,
        fileSize: lectureVideo.fileSize,
        duration: lectureVideo.metadata?.duration || lectureVideo.duration,
        isPremium,
        hasAccess: canAccess,
        requiresSubscription: isPremium && !hasSubscription,
        uploadDate: lectureVideo.uploadDate,
        accessRules: {
          canStream: canAccess,
          canDownload: false,
          preventScreenshot: true,
          preventRecording: true
        },
        unit: unitPayload,
        topic: topicPayload
      });
    }

    const notes = topicAssets.notes;
    if (shouldIncludeAsset(notes)) {
      const isPremium = notes.isPremium || false;
      const canDownload = !isPremium || hasSubscription;

      approvedContent.push({
        id: `${unit._id}-${topic._id}-notes`,
        type: 'notes',
        title: notes.title || `${topic.title} - Notes`,
        description: topic.description,
        filename: notes.filename,
        fileSize: notes.fileSize,
        isPremium,
        hasAccess: true,
        requiresSubscription: isPremium && !hasSubscription,
        uploadDate: notes.uploadDate,
        accessRules: {
          canView: true,
          canDownload,
          downloadRequiresSubscription: isPremium
        },
        unit: unitPayload,
        topic: topicPayload
      });
    }

    if (Array.isArray(topicAssets.youtube) && topicAssets.youtube.length > 0) {
      topicAssets.youtube
        .filter((yt) => isApproved(yt))
        .forEach((youtubeAsset) => {
          approvedContent.push({
            id: `${unit._id}-${topic._id}-youtube-${youtubeAsset._id}`,
            type: 'youtube',
            title: youtubeAsset.title,
            description: youtubeAsset.description,
            url: youtubeAsset.url || youtubeAsset.metadata?.url,
            isPremium: youtubeAsset.isPremium || false,
            unit: unitPayload,
            topic: topicPayload
          });
        });
    }
  });

  assessments.forEach((assessment) => {
    const unit = unitMap.get(assessment.unitId.toString());
    if (!unit) {
      return;
    }

    const asset = assessment.contentAssetId || assessment; // fallback to assessment fields
    if (!isApproved(asset) || (!asset.filename && !asset.filePath)) {
      return;
    }

    const unitPayload = buildUnitPayload(unit);
    const typeKey = TYPE_MAP[assessment.type] || assessment.type;
    const hasSubscription = !!userSubscriptions[unit.year];
    const isPremium = assessment.isPremium != null ? assessment.isPremium : true;

    let accessRules = {};
    if (typeKey === 'assignments') {
      accessRules = {
        canView: true,
        canDownload: true,
        isFree: true,
        preventScreenshot: false
      };
    } else {
      const canAccess = !isPremium || hasSubscription;
      accessRules = {
        canView: canAccess,
        canDownload: false,
        viewOnlyOnSite: true,
        preventScreenshot: true,
        preventRecording: true,
        requiresSubscription: isPremium && !hasSubscription
      };
    }

    approvedContent.push({
      id: `${unit._id}-${assessment._id}-${typeKey}`,
      _id: assessment._id,
      assessmentId: assessment._id,
      type: typeKey,
      title: assessment.title,
      description: assessment.description,
      filename: (accessRules.canView || accessRules.isFree) ? (asset.filename || (asset.filePath ? asset.filePath.split('/').pop() : null)) : null,
      fileSize: asset.fileSize,
      isPremium,
      hasAccess: typeKey === 'assignments' ? true : accessRules.canView,
      requiresSubscription: accessRules.requiresSubscription || false,
      uploadDate: assessment.uploadDate,
      dueDate: assessment.dueDate,
      totalMarks: assessment.totalMarks,
      academicYear: assessment.academicYear || assessment.examMetadata?.year || null,
      accessRules,
      unit: unitPayload
    });
  });

  approvedContent.sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));

  return {
    content: approvedContent,
    units
  };
}

module.exports = {
  getApprovedCourseContentNormalized
};
