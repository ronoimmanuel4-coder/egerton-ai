const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkCollections() {
  const client = new MongoClient(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log('\nCollections in database:');
    for (const collection of collections) {
      console.log(`- ${collection.name}`);
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  Documents: ${count}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkCollections().catch(console.error);
