const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Course = require('../models/Course');

const purgeUploadedContent = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const courses = await Course.find({});
    console.log(`📚 Found ${courses.length} course(s)`);

    let modifiedCourses = 0;
    for (const course of courses) {
      let courseModified = false;

      course.units.forEach((unit) => {
        unit.topics.forEach((topic) => {
          if (topic.content?.lectureVideo) {
            topic.content.lectureVideo = undefined;
            courseModified = true;
          }

          if (topic.content?.notes) {
            topic.content.notes = undefined;
            courseModified = true;
          }

          if (Array.isArray(topic.content?.youtubeResources) && topic.content.youtubeResources.length > 0) {
            topic.content.youtubeResources = [];
            courseModified = true;
          }

          if (topic.content && Object.keys(topic.content).length === 0) {
            topic.content = undefined;
            courseModified = true;
          }
        });

        if (unit.assessments) {
          if (Array.isArray(unit.assessments.cats) && unit.assessments.cats.length > 0) {
            unit.assessments.cats = [];
            courseModified = true;
          }
          if (Array.isArray(unit.assessments.assignments) && unit.assessments.assignments.length > 0) {
            unit.assessments.assignments = [];
            courseModified = true;
          }
          if (Array.isArray(unit.assessments.pastExams) && unit.assessments.pastExams.length > 0) {
            unit.assessments.pastExams = [];
            courseModified = true;
          }
        }
      });

      if (courseModified) {
        course.markModified('units');
        await course.save({ validateBeforeSave: false });
        modifiedCourses += 1;
        console.log(`🧹 Cleared uploaded content for course: ${course.name}`);
      }
    }

    console.log(`✅ Purge complete. Modified ${modifiedCourses} course(s).`);
  } catch (error) {
    console.error('❌ Failed to purge uploaded content:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed.');
  }
};

purgeUploadedContent();
