const MongoClient = require('mongodb').MongoClient;

async function mergeDuplicateUnits(db) {
  const collection = db.collection('units');
  
  // Step 1: Find duplicate units
  const duplicates = await collection.aggregate([
    {
      $group: {
        _id: { courseId: "$courseId", unitCode: "$unitCode" },
        count: { $sum: 1 },
        docs: { $push: "$$ROOT" }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]).toArray();
  
  if (duplicates.length === 0) {
    console.log("No duplicate units found.");
    return;
  }
  
  console.log(`Found ${duplicates.length} sets of duplicate units.`);
  
  // Step 2: Merge duplicates
  for (const dup of duplicates) {
    const { courseId, unitCode } = dup._id;
    const docs = dup.docs;
    
    // Merge fields: prioritize non-empty name and non-null values for other fields
    const mergedUnit = { courseId, unitCode };
    let mergedName = '';
    
    docs.forEach(doc => {
      // Prioritize non-empty name
      if (doc.name && doc.name.trim() !== '' && (!mergedName || mergedName.trim() === '')) {
        mergedName = doc.name;
      }
      // Merge other fields, prioritizing non-null values
      Object.keys(doc).forEach(key => {
        if (key === '_id' || key === 'courseId' || key === 'unitCode' || key === 'name') return;
        if (!mergedUnit[key] || doc[key]) {
          mergedUnit[key] = doc[key];
        }
      });
    });
    
    mergedUnit.name = mergedName || docs[0].name || ''; // Fallback to first doc's name if all are empty
    
    // Step 3: Keep one document, delete others
    const keepDocId = docs[0]._id; // Keep the first document's _id
    await collection.updateOne(
      { _id: keepDocId },
      { $set: mergedUnit },
      { upsert: false }
    );
    
    // Delete other duplicate documents
    const deleteIds = docs.slice(1).map(doc => doc._id);
    if (deleteIds.length > 0) {
      await collection.deleteMany({ _id: { $in: deleteIds } });
    }
    
    console.log(`Merged unit - courseId: ${courseId}, unitCode: ${unitCode}, name: ${mergedUnit.name}. Deleted ${deleteIds.length} duplicates.`);
  }
  
  console.log("Duplicate merging completed.");
}

async function main() {
  const uri = "mongodb+srv://eduvault:honeywellT55$@cluster0.udsslk9.mongodb.net/eduvault?retryWrites=true&w=majority&appName=Cluster0&ssl=true&tlsAllowInvalidCertificates=true";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
    await client.connect();
    const db = client.db('eduvault');
    await mergeDuplicateUnits(db);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main().catch(console.error);