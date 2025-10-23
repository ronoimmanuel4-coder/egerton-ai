// Quick script to verify and fix unit-course linkage
const mongoose = require('mongoose');
require('dotenv').config();

const unitId = '68f381096df604ac12248347';
const courseId = '68d59c7d8ddfae09421b844f';

async function verifyUnit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduvault');
    console.log('✅ Connected to MongoDB');

    const Unit = require('./models/Unit');
    const Course = require('./models/Course');

    // Check if unit exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
      console.log('❌ Unit not found in database');
      console.log(`   Looking for unitId: ${unitId}`);
      
      // List all units for this course
      const units = await Unit.find({ courseId }).select('_id unitCode unitName').limit(10);
      console.log(`\n📋 Units found for course ${courseId}:`);
      units.forEach(u => {
        console.log(`   - ${u._id} | ${u.unitCode} | ${u.unitName}`);
      });
      
      process.exit(0);
    }

    console.log('✅ Unit found:');
    console.log(`   ID: ${unit._id}`);
    console.log(`   Code: ${unit.unitCode}`);
    console.log(`   Name: ${unit.unitName}`);
    console.log(`   CourseId: ${unit.courseId}`);
    console.log(`   Year: ${unit.year}`);
    console.log(`   Semester: ${unit.semester}`);

    // Check if courseId matches
    if (String(unit.courseId) !== courseId) {
      console.log(`\n⚠️  CourseId mismatch!`);
      console.log(`   Unit has: ${unit.courseId}`);
      console.log(`   Expected: ${courseId}`);
      console.log(`\n🔧 Fixing courseId...`);
      
      unit.courseId = new mongoose.Types.ObjectId(courseId);
      await unit.save();
      console.log('✅ CourseId updated successfully');
    } else {
      console.log('\n✅ CourseId matches - unit is correctly linked');
    }

    // Verify course exists
    const course = await Course.findById(courseId).select('name code');
    if (!course) {
      console.log(`\n❌ Course ${courseId} not found`);
    } else {
      console.log(`\n✅ Course found: ${course.name} (${course.code})`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyUnit();
