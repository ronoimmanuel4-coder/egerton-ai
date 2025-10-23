/*
 * Migration Script: Embedded Course Content -> Normalized Collections
 *
 * Usage (development/staging):
 *   node scripts/migrateCourseContent.js --database "mongodb://localhost:27017/eduvault"
 *
 * Options:
 *   --database / -d   MongoDB connection URI (defaults to process.env.MONGODB_URI)
 *   --dry-run         Do not write any changes, only report planned operations
 *   --limit           Limit number of courses to migrate (useful for testing)
 *   --course          Migrate a single course ID (ObjectId string)
 *
 * The script is idempotent: it skips units/topics/assessments that already have
 * corresponding normalized documents. It does not remove embedded data; follow-up
 * cleanup can be performed after thorough verification.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const Course = require('../models/Course');
const Unit = require('../models/Unit');
const Topic = require('../models/Topic');
const ContentAsset = require('../models/ContentAsset');
const Assessment = require('../models/Assessment');

const argv = yargs(hideBin(process.argv))
  .option('database', {
    alias: 'd',
    type: 'string',
    describe: 'MongoDB connection URI'
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    describe: 'Log planned actions without writing to the database'
  })
  .option('limit', {
    type: 'number',
    describe: 'Limit number of courses to migrate'
  })
  .option('course', {
    type: 'string',
    describe: 'Migrate a single course by ID'
  })
  .help()
  .argv;

const DRY_RUN = argv['dry-run'];
const BATCH_SIZE = 10;

const connect = async () => {
  const connectionUri = argv.database || process.env.MONGODB_URI;
  if (!connectionUri) {
    console.error('❌ No MongoDB URI provided. Use --database or set MONGODB_URI.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✅ Connected to MongoDB');
};

const createUnitIfMissing = async (course, embeddedUnit) => {
  const existingUnit = await Unit.findOne({
    courseId: course._id,
    unitCode: embeddedUnit.unitCode
  });
  if (existingUnit) {
    return existingUnit;
  }

  const payload = {
    courseId: course._id,
    year: embeddedUnit.year,
    semester: embeddedUnit.semester,
    subcourse: embeddedUnit.subcourse || '',
    unitCode: embeddedUnit.unitCode,
    unitName: embeddedUnit.unitName,
    creditHours: embeddedUnit.creditHours,
    description: embeddedUnit.description,
    prerequisites: embeddedUnit.prerequisites,
    isCore: embeddedUnit.isCore,
    topicIds: [],
    assessmentIds: []
  };

  if (DRY_RUN) {
    console.log('🌱 [Dry Run] Would create Unit:', payload);
    return { ...payload, _id: embeddedUnit._id };
  }

  const unit = await Unit.create(payload);
  return unit;
};

const ensureCourseListIncludes = (list = [], id) => {
  if (!id) return list;
  const hasId = list.some((existing) => existing.toString() === id.toString());
  if (hasId) return list;
  list.push(id);
  return list;
};

const migrateTopicContent = async ({ course, unit, embeddedTopic }) => {
  const existingTopic = await Topic.findOne({ unitId: unit._id, topicNumber: embeddedTopic.topicNumber });

  let topicDoc;
  if (existingTopic) {
    topicDoc = existingTopic;
  } else {
    const payload = {
      unitId: unit._id,
      topicNumber: embeddedTopic.topicNumber,
      title: embeddedTopic.title,
      description: embeddedTopic.description,
      learningOutcomes: embeddedTopic.learningOutcomes || [],
      lectureVideoId: null,
      notesId: null,
      youtubeResourceIds: []
    };

    if (DRY_RUN) {
      console.log('🌱 [Dry Run] Would create Topic:', payload);
      topicDoc = { ...payload, _id: embeddedTopic._id };
    } else {
      topicDoc = await Topic.create(payload);
    }
  }

  const topicUpdates = {};

  const attachAsset = async ({ assetData, type }) => {
    if (!assetData || assetData.status === 'rejected') {
      return null;
    }

    const assetPayload = {
      type: type === 'lectureVideo' ? 'video' : 'notes',
      ownerType: 'topic',
      owner: topicDoc._id,
      title: assetData.title || embeddedTopic.title,
      description: assetData.description,
      filename: assetData.filename,
      filePath: assetData.filePath,
      fileSize: assetData.fileSize,
      mimetype: assetData.mimetype,
      metadata: {
        duration: assetData.duration,
        originalName: assetData.originalName,
        pages: assetData.pages
      },
      status: assetData.status || 'pending',
      isPremium: assetData.isPremium || false,
      uploadedBy: assetData.uploadedBy,
      reviewedBy: assetData.reviewedBy,
      reviewNotes: assetData.reviewNotes,
      uploadDate: assetData.uploadDate,
      reviewDate: assetData.reviewDate
    };

    const existingAsset = await ContentAsset.findOne({ ownerType: 'topic', owner: topicDoc._id, type: assetPayload.type });
    if (existingAsset) {
      return existingAsset;
    }

    if (DRY_RUN) {
      console.log(`🌱 [Dry Run] Would create ContentAsset (${assetPayload.type}) for topic ${topicDoc._id}`, assetPayload);
      return { ...assetPayload, _id: assetData._id };
    }

    const created = await ContentAsset.create(assetPayload);
    return created;
  };

  const lectureVideoAsset = await attachAsset({ assetData: embeddedTopic.content?.lectureVideo, type: 'lectureVideo' });
  const notesAsset = await attachAsset({ assetData: embeddedTopic.content?.notes, type: 'notes' });

  if (!DRY_RUN) {
    if (lectureVideoAsset) {
      topicDoc.lectureVideoId = lectureVideoAsset._id;
    }
    if (notesAsset) {
      topicDoc.notesId = notesAsset._id;
    }

    const youtubeAssets = embeddedTopic.content?.youtubeResources || [];
    for (const resource of youtubeAssets) {
      const existingYoutube = await ContentAsset.findOne({
        ownerType: 'topic',
        owner: topicDoc._id,
        type: 'youtube',
        'metadata.url': resource.url
      });
      if (existingYoutube) {
        topicDoc.youtubeResourceIds = ensureCourseListIncludes(topicDoc.youtubeResourceIds, existingYoutube._id);
        continue;
      }

      const payload = {
        type: 'youtube',
        ownerType: 'topic',
        owner: topicDoc._id,
        title: resource.title,
        description: resource.description,
        filename: null,
        filePath: null,
        metadata: {
          url: resource.url
        },
        status: resource.status || 'approved',
        isPremium: resource.isPremium || false,
        uploadedBy: resource.uploadedBy,
        reviewedBy: resource.reviewedBy,
        reviewNotes: resource.reviewNotes
      };

      if (DRY_RUN) {
        console.log('🌱 [Dry Run] Would create YouTube asset:', payload);
        topicDoc.youtubeResourceIds = ensureCourseListIncludes(topicDoc.youtubeResourceIds, resource._id);
      } else {
        const created = await ContentAsset.create(payload);
        topicDoc.youtubeResourceIds = ensureCourseListIncludes(topicDoc.youtubeResourceIds, created._id);
      }
    }

    await topicDoc.save();
  }

  return topicDoc;
};

const migrateAssessments = async ({ course, unit, embeddedAssessments }) => {
  const results = [];

  const mapType = (key) => {
    if (key === 'cats') return 'cat';
    if (key === 'assignments') return 'assignment';
    if (key === 'pastExams') return 'pastExam';
    return key;
  };

  for (const key of ['cats', 'assignments', 'pastExams']) {
    const assessments = embeddedAssessments?.[key];
    if (!Array.isArray(assessments) || assessments.length === 0) {
      continue;
    }

    for (const embedded of assessments) {
      if (!embedded.filename) {
        continue;
      }

      const existing = await Assessment.findOne({
        unitId: unit._id,
        title: embedded.title,
        type: mapType(key)
      });
      if (existing) {
        results.push(existing);
        continue;
      }

      const assetPayload = {
        type: 'document',
        ownerType: 'unit',
        owner: unit._id,
        title: embedded.title,
        description: embedded.description,
        filename: embedded.filename,
        filePath: embedded.filePath,
        fileSize: embedded.fileSize,
        mimetype: embedded.mimetype,
        metadata: {
          imageType: embedded.imageType
        },
        status: embedded.status || 'pending',
        isPremium: embedded.isPremium !== undefined ? embedded.isPremium : true,
        uploadedBy: embedded.uploadedBy,
        reviewedBy: embedded.reviewedBy,
        reviewNotes: embedded.reviewNotes,
        uploadDate: embedded.uploadDate,
        reviewDate: embedded.reviewDate
      };

      let assetDoc;
      if (DRY_RUN) {
        console.log('🌱 [Dry Run] Would create assessment asset:', assetPayload);
        assetDoc = { ...assetPayload, _id: embedded._id };
      } else {
        assetDoc = await ContentAsset.create(assetPayload);
      }

      const assessmentPayload = {
        courseId: course._id,
        unitId: unit._id,
        type: mapType(key),
        title: embedded.title,
        description: embedded.description,
        academicYear: embedded.academicYear,
        examMetadata: {
          year: embedded.year,
          semester: embedded.semester,
          examType: embedded.examType
        },
        dueDate: embedded.dueDate,
        totalMarks: embedded.totalMarks,
        durationMinutes: embedded.duration,
        contentAssetId: assetDoc._id,
        status: embedded.status || 'pending',
        isPremium: embedded.isPremium !== undefined ? embedded.isPremium : true,
        uploadDate: embedded.uploadDate,
        uploadedBy: embedded.uploadedBy,
        reviewedBy: embedded.reviewedBy,
        reviewDate: embedded.reviewDate,
        reviewNotes: embedded.reviewNotes
      };

      if (DRY_RUN) {
        console.log('🌱 [Dry Run] Would create Assessment:', assessmentPayload);
        results.push({ ...assessmentPayload, _id: embedded._id });
      } else {
        const assessmentDoc = await Assessment.create(assessmentPayload);
        results.push(assessmentDoc);
      }
    }
  }

  return results;
};

const migrateCourse = async (course) => {
  console.log(`\n📘 Migrating course ${course.name} (${course._id})`);

  const unitResults = [];

  for (const embeddedUnit of course.units) {
    const unitDoc = await createUnitIfMissing(course, embeddedUnit);
    unitResults.push(unitDoc);

    if (!DRY_RUN && unitDoc._id && embeddedUnit._id && unitDoc._id.toString() !== embeddedUnit._id.toString()) {
      // Remember legacy IDs so we can match later if needed
      unitDoc.legacyUnitId = embeddedUnit._id;
    }

    if (!DRY_RUN) {
      unitDoc.topicIds = unitDoc.topicIds || [];
      unitDoc.assessmentIds = unitDoc.assessmentIds || [];
    }

    const topicResults = [];
    for (const embeddedTopic of embeddedUnit.topics || []) {
      const topicDoc = await migrateTopicContent({ course, unit: unitDoc, embeddedTopic });
      if (!DRY_RUN) {
        unitDoc.topicIds = ensureCourseListIncludes(unitDoc.topicIds, topicDoc._id);
        course.topicIds = ensureCourseListIncludes(course.topicIds || [], topicDoc._id);
      }
      topicResults.push(topicDoc);
    }

    const assessmentDocs = await migrateAssessments({ course, unit: unitDoc, embeddedAssessments: embeddedUnit.assessments });
    if (!DRY_RUN) {
      for (const doc of assessmentDocs) {
        unitDoc.assessmentIds = ensureCourseListIncludes(unitDoc.assessmentIds, doc._id);
        course.assessmentIds = ensureCourseListIncludes(course.assessmentIds || [], doc._id);
      }
    }

    if (!DRY_RUN) {
      await unitDoc.save();
    }

    console.log(`   • Unit ${embeddedUnit.unitCode}: ${topicResults.length} topics, ${assessmentDocs.length} assessments migrated.`);
  }

  if (!DRY_RUN) {
    course.unitIds = ensureCourseListIncludes(course.unitIds || [], ...unitResults.map((u) => u._id));
    await course.save({ validateBeforeSave: false });
  }

  console.log(`✅ Course ${course.name} migration complete.`);
};

const run = async () => {
  await connect();

  try {
    const courseFilter = {};
    if (argv.course) {
      courseFilter._id = new mongoose.Types.ObjectId(argv.course);
    }

    let query = Course.find(courseFilter).sort({ createdAt: 1 });
    if (argv.limit) {
      query = query.limit(argv.limit);
    }

    const cursor = query.cursor();

    const batch = [];
    for await (const course of cursor) {
      batch.push(course);
      if (batch.length >= BATCH_SIZE) {
        for (const item of batch) {
          await migrateCourse(item);
        }
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      for (const item of batch) {
        await migrateCourse(item);
      }
    }

    console.log('\n🎉 Migration run complete.');
    if (DRY_RUN) {
      console.log('No database changes were written (dry run).');
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

run();
