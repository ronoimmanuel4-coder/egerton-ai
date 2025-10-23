const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkTopic() {
  const client = new MongoClient(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const topicId = '68d59d298ddfae09421b8466';
    
    // Check topic
    const topic = await db.collection('topics').findOne({ _id: new MongoClient.ObjectId(topicId) });
    console.log('\nTopic:', JSON.stringify(topic, null, 2));
    
    if (topic) {
      // Check unit
      const unit = await db.collection('units').findOne({ _id: topic.unitId });
      console.log('\nUnit:', unit ? 'Found' : 'Not found');
      
      // Check content assets
      const assets = await db.collection('contentassets').find({ 
        ownerType: 'topic',
        owner: topic._id
      }).toArray();
      
      console.log('\nContent Assets:', JSON.stringify(assets, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkTopic().catch(console.error);
