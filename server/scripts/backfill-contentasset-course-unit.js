/*
  Backfill script for ContentAsset.courseId and ContentAsset.unitId
  - Finds ContentAsset docs missing courseId or unitId
  - Resolves via populated owner -> unitId -> courseId
  - Updates documents in batches

  Usage:
    NODE_ENV=development node server/scripts/backfill-contentasset-course-unit.js
*/

const mongoose = require('mongoose');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ContentAsset = require('../models/ContentAsset');
const Topic = require('../models/Topic');
const Unit = require('../models/Unit');
const Course = require('../models/Course');

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduvault';
  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });

  const query = { $or: [{ courseId: { $exists: false } }, { courseId: null }, { unitId: { $exists: false } }, { unitId: null }] };
  const total = await ContentAsset.countDocuments(query);
  console.log(`Found ${total} ContentAsset documents missing courseId/unitId`);

  const cursor = ContentAsset.find(query).cursor();
  let processed = 0;
  let updated = 0;
  let failed = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    processed += 1;
    try {
      let resolvedUnitId = null;
      let resolvedCourseId = null;

      if (doc.ownerType === 'topic') {
        const topic = await Topic.findById(doc.owner).select('unitId');
        if (topic?.unitId) {
          resolvedUnitId = topic.unitId;
          const unit = await Unit.findById(topic.unitId).select('courseId');
          if (unit?.courseId) {
            resolvedCourseId = unit.courseId;
          } else {
            // Fallback: attempt to derive from embedded Course
            const course = await Course.findOne({ 'units._id': topic.unitId }).select('_id');
            if (course) resolvedCourseId = course._id;
          }
        }
      } else if (doc.ownerType === 'unit') {
        resolvedUnitId = doc.owner;
        const unit = await Unit.findById(doc.owner).select('courseId');
        if (unit?.courseId) {
          resolvedCourseId = unit.courseId;
        } else {
          const course = await Course.findOne({ 'units._id': doc.owner }).select('_id');
          if (course) resolvedCourseId = course._id;
        }
      } else if (doc.ownerType === 'course') {
        resolvedCourseId = doc.owner;
      }

      const update = {};
      if (!doc.unitId && resolvedUnitId) update.unitId = resolvedUnitId;
      if (!doc.courseId && resolvedCourseId) update.courseId = resolvedCourseId;

      if (Object.keys(update).length > 0) {
        await ContentAsset.updateOne({ _id: doc._id }, { $set: update });
        updated += 1;
        console.log(`Updated ${doc._id.toString()} =>`, {
          courseId: update.courseId?.toString(),
          unitId: update.unitId?.toString()
        });
      }
    } catch (e) {
      failed += 1;
      console.error(`Failed to update ContentAsset ${doc._id.toString()}:`, e.message);
    }
  }

  console.log('Backfill complete:', { processed, updated, failed });
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
