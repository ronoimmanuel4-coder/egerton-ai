require('dotenv').config();
const mongoose = require('mongoose');

async function checkTopic() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the ContentAsset model
    const ContentAsset = require('./models/ContentAsset');
    
    // Find assets for the specific topic
    const topicId = '68d59d298ddfae09421b8466';
    const assets = await ContentAsset.find({ 
      ownerType: 'topic',
      owner: topicId
    });

    console.log('Found assets:', JSON.stringify(assets, null, 2));
    
    // Also check if the topic exists
    const Topic = require('./models/Topic');
    const topic = await Topic.findById(topicId);
    console.log('\nTopic details:', JSON.stringify(topic, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkTopic();
