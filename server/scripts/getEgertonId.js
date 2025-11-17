/**
 * Get Egerton Institution ID from existing database
 * Use this to find the ID for your .env file
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Institution = require('../models/Institution');

dotenv.config();

async function getEgertonId() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Find Egerton University
    const egerton = await Institution.findOne({
      $or: [
        { shortName: 'EGERTON' },
        { name: /Egerton/i }
      ]
    });

    if (egerton) {
      console.log('✓ Found Egerton University!');
      console.log('=====================================');
      console.log('Name:', egerton.name);
      console.log('Short Name:', egerton.shortName);
      console.log('ID:', egerton._id);
      console.log('=====================================\n');
      
      console.log('Add this to your server/.env file:');
      console.log(`EGERTON_INSTITUTION_ID=${egerton._id}`);
      console.log('');
    } else {
      console.log('✗ Egerton University not found in database');
      console.log('\nSearching for all institutions...');
      const institutions = await Institution.find({}).select('name shortName');
      console.log('Available institutions:');
      institutions.forEach(inst => {
        console.log(`  - ${inst.name} (${inst.shortName}) - ID: ${inst._id}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

getEgertonId();
