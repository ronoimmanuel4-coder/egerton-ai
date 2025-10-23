require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections:');
    collections.forEach(c => console.log(`- ${c.name}`));
    
    // Check topics collection
    console.log('\nChecking topics...');
    const topic = await db.collection('topics').findOne({ _id: new MongoClient.ObjectId('68d59d298ddfae09421b8466') });
    console.log('Topic:', JSON.stringify(topic, null, 2));
    
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
    process.exit(0);
  }
}

checkData();
