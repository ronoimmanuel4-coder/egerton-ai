/*
 * Script: removePlaceholderContent.js
 * -------------------------------
 * Removes known placeholder/demo units and topics that accidentally made it into
 * the production database. It looks for matches against a predefined list of
 * regular-expression patterns and strips those objects from the embedded
 * `units` array on every `Course` document.
 *
 * Usage examples:
 *   # Dry-run (recommended first):
 *   node scripts/removePlaceholderContent.js --dry-run
 *
 *   # Actually apply changes:
 *   node scripts/removePlaceholderContent.js
 *
 * Options:
 *   --database, -d   Explicit MongoDB connection URI (defaults to MONGODB_URI)
 *   --dry-run        Log planned deletions but do not write changes
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const Course = require('../models/Course');

// --------------------------- CLI ---------------------------
const argv = yargs(hideBin(process.argv))
  .option('database', {
    alias: 'd',
    describe: 'MongoDB connection URI',
    type: 'string'
  })
  .option('dry-run', {
    describe: 'Preview changes without saving',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

const DRY_RUN = argv['dry-run'];

// ------------------ Placeholder detection -----------------
const PATTERNS = [
  /TRADITIONAL BASIS OF EAST AFRICAN SOCIAL STRUCTURES/i,
  /ECONOMIC ORGANIZATION AND MODE OF PRODUCTION OF EAST AFRICAN SOCIETIES DURING THE PRE-?COLONIAL PERIOD/i,
  /POLITICAL ORGANISATIONS? DURING THE PRE-?COLONIAL PERIOD/i,
  /THE ROLE OF TRADITIONAL RELIGION IN SHAPING SOCIAL STRUCTURES IN EAST AFRICA/i,
  /COLONIALISM AND STRUCTURES? OF EAST AFRICAN SOCIETIES/i,
  /LANGUAGE,?\s*ETHNIC IDENTITY,?\s*AND SOCIAL STRUCTURES? IN TRADITIONAL EAST AFRICA/i,
  /SOCIAL STRUCTURES? OF MODERN EAST AFRICAN COMMUNITIES/i,
  /INTORDUCTION AND DEFINITION OF CONCEPTS/i,
  /INTRODUCTION TO GENDER/i,
  /INRODUCTION TO ALGORITIMS?/i,
  /SOCIAL SRUCTURES? OF EAST AFRICAN SOCIET(Y|IES)/i
];

const matchesPlaceholder = (text = '') => PATTERNS.some((rx) => rx.test(String(text)));

// --------------------------- Main -------------------------
const run = async () => {
  const uri = argv.database || process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ No MongoDB connection string supplied (use --database or set MONGODB_URI)');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected');

  const courses = await Course.find({});
  console.log(`📚 Scanning ${courses.length} course(s) for placeholder content...`);

  let removedUnits = 0;
  let removedTopics = 0;
  let updatedCourses = 0;

  for (const course of courses) {
    let courseModified = false;

    // Filter units array in place
    course.units = course.units.filter((unit) => {
      // Check unit name/code for placeholder markers
      const removeUnit = matchesPlaceholder(unit.unitName) || matchesPlaceholder(unit.unitCode);
      if (removeUnit) {
        removedUnits += 1;
        courseModified = true;
        const logPrefix = DRY_RUN ? 'ℹ️  [Dry-Run]' : '🗑️ Removed';
        console.log(`${logPrefix} unit "${unit.unitName}" (${unit.unitCode || 'no code'}) from course "${course.name}" (${course._id})`);
        return false; // drop entire unit
      }

      // Otherwise, inspect topics inside the unit
      if (Array.isArray(unit.topics)) {
        const remainingTopics = [];
        unit.topics.forEach((topic) => {
          if (matchesPlaceholder(topic.title)) {
            removedTopics += 1;
            courseModified = true;
            const logPrefix = DRY_RUN ? 'ℹ️  [Dry-Run]' : '🗑️ Removed';
            console.log(
              `${logPrefix} topic "${topic.title}" (topicId: ${topic._id}) in unit "${unit.unitName}" (${unit.unitCode || 'no code'}) of course "${course.name}" (${course._id})`
            );
          } else {
            remainingTopics.push(topic);
          }
        });
        unit.topics = remainingTopics;
      }

      return true; // keep unit
    });

    if (courseModified) {
      updatedCourses += 1;
      if (DRY_RUN) {
        console.log(`ℹ️  [Dry-Run] Would update course ${course.name} (${course._id})`);
      } else {
        course.markModified('units');
        await course.save({ validateBeforeSave: false });
        console.log(`✅ Updated course ${course.name}`);
      }
    }
  }

  console.log('\n———— Summary ————');
  console.log(`🏫 Courses modified: ${updatedCourses}`);
  console.log(`📖 Units removed:   ${removedUnits}`);
  console.log(`📝 Topics removed:  ${removedTopics}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
};

run().catch((err) => {
  console.error('❌ Script failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
