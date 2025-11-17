/**
 * Complete Egerton University Seed Script
 * Creates Egerton institution with comprehensive course catalog
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Institution = require('../models/Institution');
const Course = require('../models/Course');

dotenv.config();

const EGERTON_DATA = {
  name: 'Egerton University',
  shortName: 'EGERTON',
  type: 'public_university',
  location: {
    county: 'Nakuru',
    town: 'Njoro',
    address: 'P.O. Box 536, Egerton, 20115',
  },
  logo: {
    url: 'https://www.egerton.ac.ke/favicon.ico',
  },
  colors: {
    primary: '#00a651',
    secondary: '#d2ac67',
  },
  contact: {
    email: 'info@egerton.ac.ke',
    phone: '+254-51-2217000',
    website: 'https://www.egerton.ac.ke',
  },
  description: 'Egerton University is a public university in Kenya. It was established as a farm school in 1939 and became a fully fledged university in 1987.',
  establishedYear: 1939,
  accreditation: {
    body: 'Commission for University Education (CUE)',
    status: 'accredited',
  },
  isActive: true,
};

const EGERTON_COURSES = [
  // Faculty of Agriculture
  {
    name: 'Bachelor of Science in Agriculture',
    code: 'BSC-AGR',
    faculty: 'Agriculture',
    description: 'Comprehensive agricultural science programme covering crop production, animal husbandry, and agricultural economics.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Science in Horticulture',
    code: 'BSC-HORT',
    faculty: 'Agriculture',
    description: 'Specialized programme in horticultural production, landscaping, and ornamental plant management.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Science in Agricultural Extension and Education',
    code: 'BSC-AGEXT',
    faculty: 'Agriculture',
    description: 'Training in agricultural extension services, farmer education, and rural development.',
    duration: 4,
    level: 'undergraduate',
  },
  
  // Faculty of Science
  {
    name: 'Bachelor of Science in Computer Science',
    code: 'BSC-CS',
    faculty: 'Science',
    description: 'Comprehensive computer science programme covering programming, algorithms, and software development.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Science in Mathematics',
    code: 'BSC-MATH',
    faculty: 'Science',
    description: 'Pure and applied mathematics with focus on theoretical foundations and practical applications.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Science in Chemistry',
    code: 'BSC-CHEM',
    faculty: 'Science',
    description: 'Study of chemical principles, analytical techniques, and laboratory methods.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Science in Biology',
    code: 'BSC-BIO',
    faculty: 'Science',
    description: 'Comprehensive study of biological sciences, ecology, and life processes.',
    duration: 4,
    level: 'undergraduate',
  },
  
  // Faculty of Arts and Social Sciences
  {
    name: 'Bachelor of Arts in Economics',
    code: 'BA-ECON',
    faculty: 'Arts and Social Sciences',
    description: 'Economic theory, policy analysis, and quantitative methods for development.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Arts in Sociology',
    code: 'BA-SOC',
    faculty: 'Arts and Social Sciences',
    description: 'Study of social structures, human behavior, and societal development.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Arts in Literature',
    code: 'BA-LIT',
    faculty: 'Arts and Social Sciences',
    description: 'Critical analysis of literary works, creative writing, and literary theory.',
    duration: 4,
    level: 'undergraduate',
  },
  
  // Faculty of Education
  {
    name: 'Bachelor of Education (Science)',
    code: 'BED-SCI',
    faculty: 'Education',
    description: 'Teacher training programme with specialization in science subjects.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Education (Arts)',
    code: 'BED-ARTS',
    faculty: 'Education',
    description: 'Teacher training programme with specialization in arts and humanities.',
    duration: 4,
    level: 'undergraduate',
  },
  
  // Faculty of Engineering
  {
    name: 'Bachelor of Science in Agricultural Engineering',
    code: 'BSC-AGENG',
    faculty: 'Engineering',
    description: 'Engineering principles applied to agricultural machinery, irrigation, and farm structures.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Science in Civil Engineering',
    code: 'BSC-CE',
    faculty: 'Engineering',
    description: 'Design and construction of infrastructure including roads, bridges, and buildings.',
    duration: 5,
    level: 'undergraduate',
  },
  
  // Faculty of Veterinary Medicine
  {
    name: 'Bachelor of Veterinary Medicine',
    code: 'BVM',
    faculty: 'Veterinary Medicine',
    description: 'Comprehensive veterinary training in animal health, surgery, and disease management.',
    duration: 5,
    level: 'undergraduate',
  },
  
  // Faculty of Commerce
  {
    name: 'Bachelor of Commerce',
    code: 'BCOM',
    faculty: 'Commerce',
    description: 'Business administration, accounting, finance, and management studies.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Science in Entrepreneurship',
    code: 'BSC-ENT',
    faculty: 'Commerce',
    description: 'Business startup skills, innovation management, and enterprise development.',
    duration: 4,
    level: 'undergraduate',
  },
  
  // Faculty of Health Sciences
  {
    name: 'Bachelor of Science in Nursing',
    code: 'BSC-NURS',
    faculty: 'Health Sciences',
    description: 'Professional nursing training with clinical practice and patient care.',
    duration: 4,
    level: 'undergraduate',
  },
  {
    name: 'Bachelor of Science in Public Health',
    code: 'BSC-PH',
    faculty: 'Health Sciences',
    description: 'Community health, epidemiology, and health promotion programmes.',
    duration: 4,
    level: 'undergraduate',
  },
  
  // Faculty of Environment and Resources Development
  {
    name: 'Bachelor of Science in Environmental Science',
    code: 'BSC-ENV',
    faculty: 'Environment and Resources Development',
    description: 'Environmental conservation, resource management, and sustainability studies.',
    duration: 4,
    level: 'undergraduate',
  },
];

async function seedEgertonUniversity() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduvault', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if Egerton already exists
    let egerton = await Institution.findOne({ shortName: 'EGERTON' });
    
    if (egerton) {
      console.log('Egerton University already exists. Updating...');
      egerton = await Institution.findOneAndUpdate(
        { shortName: 'EGERTON' },
        EGERTON_DATA,
        { new: true, runValidators: true }
      );
    } else {
      console.log('Creating Egerton University...');
      egerton = await Institution.create(EGERTON_DATA);
    }

    console.log(`✓ Egerton University created/updated: ${egerton._id}`);
    console.log(`  Add this to your .env file: EGERTON_INSTITUTION_ID=${egerton._id}`);

    // Seed courses
    console.log('\nSeeding Egerton courses...');
    
    // Delete existing Egerton courses
    await Course.deleteMany({ institution: egerton._id });
    console.log('Cleared existing Egerton courses');

    // Create new courses
    const coursesWithInstitution = EGERTON_COURSES.map(course => ({
      ...course,
      institution: egerton._id,
    }));

    const createdCourses = await Course.insertMany(coursesWithInstitution);
    console.log(`✓ Created ${createdCourses.length} courses for Egerton University`);

    // Display summary
    console.log('\n=== EGERTON UNIVERSITY SETUP COMPLETE ===');
    console.log(`Institution ID: ${egerton._id}`);
    console.log(`Total Courses: ${createdCourses.length}`);
    console.log('\nCourses by Faculty:');
    
    const faculties = {};
    createdCourses.forEach(course => {
      faculties[course.faculty] = (faculties[course.faculty] || 0) + 1;
    });
    
    Object.entries(faculties).forEach(([faculty, count]) => {
      console.log(`  - ${faculty}: ${count} courses`);
    });

    console.log('\n=== NEXT STEPS ===');
    console.log('1. Add to server .env file:');
    console.log(`   EGERTON_INSTITUTION_ID=${egerton._id}`);
    console.log('   USE_LOCAL_AI=true');
    console.log('   LOCAL_LLAMA_URL=http://localhost:11434');
    console.log('   LOCAL_LLAMA_MODEL=llama2');
    console.log('\n2. Install and run Ollama:');
    console.log('   Download from: https://ollama.ai');
    console.log('   Run: ollama serve');
    console.log('   Pull model: ollama pull llama2');
    console.log('\n3. Restart your server to apply changes');

  } catch (error) {
    console.error('Error seeding Egerton University:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the seed
seedEgertonUniversity();
