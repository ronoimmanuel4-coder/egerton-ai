# Content Upload Fix - courseId and unitId Population

## Problem
When uploading content (videos/notes) through the admin frontend, the ContentAsset documents were being created with `courseId: null` and `unitId: null`. This caused deletion, approval, and rejection operations to fail because the backend couldn't locate the content within the Course document structure.

## Root Cause
The admin frontend uses a two-step upload process:
1. Upload file to `/api/upload/video` or `/api/upload/notes` (returns file info only)
2. Save topic with file info to `/api/courses/:courseId/units/:unitId/topics`

The topic creation/update endpoints were creating ContentAsset records but weren't setting `courseId` and `unitId` fields.

## Solution

### Backend Changes

#### 1. Extended ContentAsset Schema
**File:** `server/models/ContentAsset.js`

Added optional `courseId` and `unitId` fields:
```javascript
courseId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Course',
  index: true,
  default: null
},
unitId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Unit',
  index: true,
  default: null
}
```

#### 2. Fixed Topic Creation Endpoint
**File:** `server/routes/courses.js` - POST `/api/courses/:id/units/:unitId/topics`

Updated ContentAsset creation to include `courseId` and `unitId`:
```javascript
assets.push(await ContentAsset.create({
  ownerType: 'topic',
  owner: topic._id,
  courseId: courseId,  // ← Added
  unitId: unitId,      // ← Added
  type: 'video',
  // ... rest of fields
}));
```

#### 3. Fixed Topic Update Endpoint
**File:** `server/routes/courses.js` - PUT `/api/courses/:id/units/:unitId/topics/:topicId`

Updated ContentAsset upsert to set `courseId` and `unitId`:
```javascript
upserts.push(ContentAsset.findOneAndUpdate(
  { ownerType: 'topic', owner: topicId, type: 'video' },
  {
    $set: {
      courseId: courseId,  // ← Added
      unitId: unitId,      // ← Added
      // ... rest of fields
    }
  },
  { new: true, upsert: !!content.lectureVideo.filename }
));
```

#### 4. Updated Normalized Upload Endpoints
**File:** `server/routes/upload.js`

The normalized endpoints now set `courseId` and `unitId`:
- POST `/api/upload/courses/:courseId/units/:unitId/topics/:topicId/video`
- POST `/api/upload/courses/:courseId/units/:unitId/topics/:topicId/notes`
- POST `/api/upload/courses/:courseId/units/:unitId/assessments`

#### 5. Improved Admin Content-Status Mapping
**File:** `server/routes/admin.js` - GET `/api/admin/content-status`

- Prefers `asset.courseId` and `asset.unitId` when present
- Falls back to resolving embedded Unit `_id` from Course document by matching `unitCode` or `unitName`
- Ensures deletion payloads have correct IDs

#### 6. Enhanced Delete Endpoint
**File:** `server/routes/admin.js` - DELETE `/api/admin/content-status`

- Added fallback unit/topic lookup (tries Mongoose `.id()` first, then manual string comparison)
- Added comprehensive debug logging
- Better error messages

### Migration Script

**File:** `server/scripts/backfill-contentasset-course-unit.js`

Backfills existing ContentAsset documents with `courseId` and `unitId` by traversing:
- `owner` (Topic) → `unitId` (Unit) → `courseId` (Course)

## How to Apply the Fix

### 1. Restart Backend Server
```powershell
# Stop current server (Ctrl+C or)
Get-Process -Name node | Where-Object { $_.Path -like "*EduVault*" } | Stop-Process -Force

# Start server
cd C:\Users\ronoi\OneDrive\Desktop\EduVault\server
node server.js
```

### 2. Run Migration Script (One Time)
```powershell
cd C:\Users\ronoi\OneDrive\Desktop\EduVault\server
node .\scripts\backfill-contentasset-course-unit.js
```

Expected output:
```
Connecting to MongoDB: mongodb://...
Found X ContentAsset documents missing courseId/unitId
Updated <assetId> => { courseId: '...', unitId: '...' }
...
Backfill complete: { processed: X, updated: Y, failed: 0 }
```

### 3. Test Upload
1. Go to admin dashboard
2. Navigate to a course → unit → topics
3. Upload a video or notes file
4. Check the database - the ContentAsset should now have:
   - `ownerType: "topic"`
   - `owner: <topicId>`
   - `courseId: <courseId>` ✅
   - `unitId: <unitId>` ✅
   - `type: "video"` or `"notes"`
   - `status: "pending"` or `"approved"`

### 4. Test Deletion/Approval/Rejection
1. Go to Content Management in admin dashboard
2. Try deleting, approving, or rejecting content
3. Operations should now succeed

## Files Modified

### Backend
- `server/models/ContentAsset.js` - Added courseId and unitId fields
- `server/routes/courses.js` - Fixed topic create/update to set courseId/unitId
- `server/routes/upload.js` - Updated normalized endpoints to set courseId/unitId
- `server/routes/admin.js` - Improved content-status mapping and delete logic
- `server/scripts/backfill-contentasset-course-unit.js` - Migration script (new)

### Frontend
- `admin-frontend/src/components/Admin/ContentStatus.js` - Fixed to use topicId/assessmentId directly, improved error handling

## Verification

After applying the fix, new ContentAsset documents should look like:
```javascript
{
  _id: ObjectId("..."),
  type: "video",
  ownerType: "topic",
  owner: ObjectId("..."),      // topicId
  courseId: ObjectId("..."),   // ✅ Now populated
  unitId: ObjectId("..."),     // ✅ Now populated
  title: "intro",
  filename: "...",
  filePath: "...",
  fileSize: 2137899,
  status: "pending",
  isPremium: false,
  uploadedBy: ObjectId("..."),
  uploadDate: ISODate("..."),
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## Related Fixes
- Content deletion now works correctly
- Content approval/rejection operations work
- Admin content-status API returns correct unitId (embedded Unit _id from Course)
- AI assistant is now mobile-responsive (full-screen on mobile)
