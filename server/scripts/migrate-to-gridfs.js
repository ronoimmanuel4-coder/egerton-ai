#!/usr/bin/env node
/*
  Migration: Move disk files into MongoDB GridFS and update documents

  - Iterates ContentAsset and Assessment docs with a local filePath and missing gridFsFileId
  - Uploads the file to GridFS (bucket: 'uploads')
  - Stores the resulting gridFsFileId on the document
  - Optionally deletes the disk file after verification

  Usage examples:
    node server/scripts/migrate-to-gridfs.js --dry-run       # default: shows actions without writing changes
    node server/scripts/migrate-to-gridfs.js --apply         # perform writes and delete disk files after upload
    node server/scripts/migrate-to-gridfs.js --apply --limit 200

  Environment:
    MONGODB_URI should be set, or .env loaded from server/.env (if dotenv is available)
*/

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Attempt to load env from server/.env if present (non-fatal if missing)
try {
  const dotenvPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }
} catch (e) {
  // ignore
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/eduvault';

// Models
const ContentAsset = require('../models/ContentAsset');
const Assessment = require('../models/Assessment');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const DRY_RUN = !APPLY;
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  if (i !== -1 && args[i + 1]) {
    const n = parseInt(args[i + 1], 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return undefined;
})();

function logStep(...parts) {
  console.log('[migrate-to-gridfs]', ...parts);
}

async function connect() {
  logStep('Connecting to MongoDB...', MONGODB_URI);
  mongoose.set('strictQuery', false);
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10
  });
  logStep('Connected.');
}

function getBucket() {
  const db = mongoose.connection.db;
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
}

async function uploadToGridFS(localFilePath, filename, contentType, metadata = {}) {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getBucket();
      const readStream = fs.createReadStream(localFilePath);
      const uploadStream = bucket.openUploadStream(filename, { contentType, metadata });
      readStream
        .on('error', reject)
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve(uploadStream.id));
    } catch (err) {
      reject(err);
    }
  });
}

async function verifyGridFS(fileId) {
  const bucket = getBucket();
  return new Promise((resolve, reject) => {
    try {
      const download = bucket.openDownloadStream(fileId);
      let bytes = 0;
      download
        .on('data', (chunk) => { bytes += chunk.length; })
        .on('error', reject)
        .on('end', () => resolve(bytes));
    } catch (err) {
      reject(err);
    }
  });
}

async function migrateCollection(label, cursor, updateDoc) {
  let processed = 0;
  let uploaded = 0;
  let deleted = 0;
  for await (const doc of cursor) {
    processed += 1;
    const id = String(doc._id);
    const filename = doc.filename || doc.imageFile?.filename || `file-${id}`;
    const filePath = doc.filePath || doc.imageFile?.filePath;
    const mimetype = doc.mimetype || doc.imageFile?.mimeType || 'application/octet-stream';

    if (!filePath || !fs.existsSync(filePath)) {
      logStep(`[${label}]`, id, 'Skip: filePath missing or not found on disk:', filePath);
      continue;
    }

    logStep(`[${label}]`, id, 'Uploading to GridFS:', filePath);
    if (DRY_RUN) {
      continue;
    }

    try {
      const gridId = await uploadToGridFS(filePath, path.basename(filePath) || filename, mimetype, { origin: label });
      const bytes = await verifyGridFS(gridId).catch(() => null);
      const size = (() => {
        try { return fs.statSync(filePath).size; } catch (_) { return null; }
      })();

      if (bytes != null && size != null) {
        logStep(`[${label}]`, id, `Uploaded ${bytes} bytes (disk ${size}). Updating document...`);
      } else {
        logStep(`[${label}]`, id, 'Uploaded. Updating document...');
      }

      await updateDoc(doc, gridId);
      uploaded += 1;

      // Remove disk file after successful update
      try {
        fs.unlinkSync(filePath);
        deleted += 1;
        logStep(`[${label}]`, id, 'Deleted disk file:', filePath);
      } catch (delErr) {
        logStep(`[${label}]`, id, 'Warn: could not delete disk file:', delErr.message);
      }
    } catch (err) {
      logStep(`[${label}]`, id, 'Error during upload:', err.message);
    }
    if (LIMIT && uploaded >= LIMIT) {
      logStep(`[${label}]`, `Limit reached: ${LIMIT}`);
      break;
    }
  }
  return { processed, uploaded, deleted };
}

async function main() {
  await connect();

  const assetQuery = {
    gridFsFileId: { $exists: false },
    filePath: { $exists: true, $ne: null }
  };
  const assessQuery = {
    gridFsFileId: { $exists: false },
    $or: [
      { filePath: { $exists: true, $ne: null } },
      { 'imageFile.filePath': { $exists: true, $ne: null } }
    ]
  };

  logStep('Starting migration', DRY_RUN ? '(DRY RUN)' : '(APPLY)');

  // ContentAsset migration
  const assetsCursor = ContentAsset.find(assetQuery).cursor();
  const assetsResult = await migrateCollection('ContentAsset', assetsCursor, async (doc, gridId) => {
    await ContentAsset.updateOne({ _id: doc._id }, {
      $set: { gridFsFileId: gridId },
      $unset: { filePath: '' }
    });
  });

  // Assessment migration
  const assessmentsCursor = Assessment.find(assessQuery).cursor();
  const assessResult = await migrateCollection('Assessment', assessmentsCursor, async (doc, gridId) => {
    const update = { gridFsFileId: gridId };
    if (doc.filePath) update.filePath = undefined;
    if (doc.imageFile?.filePath) update['imageFile.filePath'] = undefined;
    await Assessment.updateOne({ _id: doc._id }, { $set: update });
  });

  logStep('Migration finished', DRY_RUN ? '(DRY RUN)' : '(APPLY)');
  logStep('ContentAsset:', assetsResult);
  logStep('Assessment:', assessResult);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
