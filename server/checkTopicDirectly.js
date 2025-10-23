require('dotenv').config();
const mongoose = require('mongoose');

async function checkTopicDirectly() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Topic = require('./models/Topic');
    const ContentAsset = require('mongoose').model('ContentAsset');
    
    const topicId = '68d59d298ddfae09421b8466';
    
    // Check topic
    const topic = await Topic.findById(topicId).lean();
    console.log('\nTopic:', JSON.stringify(topic, null, 2));
    
    // Check if unit exists
    const Unit = require('./models/Unit');
    const unit = await Unit.findById(topic?.unitId).lean();
    console.log('\nUnit exists:', unit ? 'Yes' : 'No');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections:', collections.map(c => c.name));
    
    // Check content assets collection directly
    const assets = await mongoose.connection.db.collection('contentassets').find({ 
      ownerType: 'topic',
      owner: new mongoose.Types.ObjectId(topicId)
    }).toArray();
    
    console.log('\nContent Assets:', JSON.stringify(assets, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkTopicDirectly();
