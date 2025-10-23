require('dotenv').config();
const mongoose = require('mongoose');

async function checkUnitAndTopics() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Unit = require('./models/Unit');
    const Topic = require('./models/Topic');
    const ContentAsset = require('./models/ContentAsset');
    
    const unitId = '68d59ccc8ddfae09421b845b';
    
    // Check unit
    const unit = await Unit.findById(unitId).lean();
    console.log('\nUnit:', JSON.stringify(unit, null, 2));
    
    // Check topics in this unit
    const topics = await Topic.find({ unitId }).lean();
    console.log('\nTopics in this unit:', topics.length);
    
    // Check content assets for each topic
    for (const topic of topics) {
      const assets = await ContentAsset.find({ ownerType: 'topic', owner: topic._id });
      console.log(`\nTopic: ${topic.title} (${topic._id})`);
      console.log('Assets:', JSON.stringify(assets, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUnitAndTopics();
