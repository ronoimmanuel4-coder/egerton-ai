# Content Deletion Error Fix

## Problem 1: "No content was deleted"
The admin dashboard was throwing an error: "No content was deleted" when attempting to delete content items.

### Root Cause
The frontend was incorrectly deriving `topicId` and `assessmentId` values instead of using the values already provided by the backend API response.

## Problem 2: "Unit not found"
After fixing the first issue, a new error appeared: "Unit not found" when attempting to delete content.

### Root Cause
The backend was not properly converting the `unitId` string to the format expected by Mongoose's subdocument lookup method (`course.units.id()`).

### Previous Logic (Incorrect)
```javascript
const derivedTopicId = content.topicId
  || (['video', 'notes', 'youtube_link'].includes(content.type) && typeof content.id === 'string'
    ? content.id.replace(/-(video|notes|youtube|youtube_link)$/i, '')
    : undefined);
```

This logic attempted to extract the `topicId` from the `id` field by removing suffixes, but:
1. The backend already provides `topicId` in the response
2. The derivation logic could produce incorrect values
3. When `topicId` was missing or incorrect, the backend couldn't find the content to delete

## Solution
Updated the frontend to use the `topicId` and `assessmentId` values directly from the API response without derivation.

### Changes Made

#### 1. Fixed `handleDeleteContent` function
- Removed derivation logic
- Use `content.topicId` directly for videos/notes
- Use `content.assessmentId` directly for assessments
- Added validation to throw clear errors if required IDs are missing

#### 2. Fixed `handleBulkDelete` function
- Applied the same fix for bulk deletion operations
- Ensures consistency across single and bulk delete operations

#### 3. Improved Error Handling
- Added proper try-catch block in `handleDeleteContent`
- Display detailed error messages from backend `failures` array
- Show errors in both console and UI snackbar
- Handle 400 status responses properly

### New Logic (Correct)
```javascript
const payload = {
  courseId: content.courseId,
  unitId: content.unitId,
  contentType: content.type
};

// Add topicId for topic-based content
if (['video', 'notes', 'youtube_link'].includes(content.type)) {
  if (content.topicId) {
    payload.topicId = content.topicId;
  } else {
    throw new Error('Missing topicId for topic-based content');
  }
}

// Add assessmentId for assessment-based content
if (['cats', 'assignments', 'pastExams'].includes(content.type)) {
  if (content.assessmentId) {
    payload.assessmentId = content.assessmentId;
  } else {
    throw new Error('Missing assessmentId for assessment content');
  }
}
```

## Current Status - Unit Lookup Issue

The deletion is still failing with "Unit not found" error. The payload being sent is correct:

```javascript
{
  courseId: '68d59c7d8ddfae09421b844f', 
  unitId: '68f381096df604ac12248347', 
  contentType: 'notes', 
  topicId: '68f8a7743b9a302a770b560d'
}
```

### Latest Backend Changes

Added comprehensive logging to debug the unit lookup:
1. Logs the incoming request with all IDs and their types
2. Logs when course is found
3. Logs both unit lookup attempts (Mongoose .id() and manual find)
4. Logs available units if lookup fails

**IMPORTANT**: The backend server needs to be restarted for these changes to take effect.

### Next Steps

1. **Restart the backend server** to load the updated code
2. Try deleting content again
3. Check the **server console** (not browser console) for the detailed logs
4. The logs will show:
   - What IDs are being received
   - Whether the course is found
   - Which unit lookup method works (if any)
   - All available units in the course

## Testing
After restarting the server:
1. Navigate to the admin dashboard content management page
2. Try deleting a video or notes item
3. Check the **server console** for detailed logs
4. Try deleting an assessment (CAT, assignment, or exam)
5. Verify that:
   - Successful deletions show a success message
   - Failed deletions show detailed error messages with the actual issue
   - The UI updates correctly after deletion

## Backend Fix for "Unit not found"

### Changes Made to `server/routes/admin.js`

Added proper string conversion and debug logging for unit lookup:

```javascript
// Ensure unitId is properly converted for Mongoose subdocument lookup
const unitIdStr = unitId?.toString();
const unit = course.units.id(unitIdStr);
if (!unit) {
  console.error('Unit lookup failed:', {
    courseId: courseIdStr,
    unitId: unitIdStr,
    availableUnits: course.units.map(u => ({ id: u._id.toString(), name: u.unitName }))
  });
  throw new Error('Unit not found');
}
```

This ensures that:
1. The `unitId` is properly converted to a string
2. Debug information is logged when unit lookup fails
3. Available units are displayed to help troubleshoot mismatches

## Files Modified

### Frontend
- `admin-frontend/src/components/Admin/ContentStatus.js`
  - Updated `handleDeleteContent` function (lines 289-313)
  - Updated `handleBulkDelete` function (lines 407-429)
  - Improved error handling (lines 327-333, 366-374)

### Backend
- `server/routes/admin.js`
  - Fixed unit lookup with proper string conversion (lines 581-591)
  - Added debug logging for troubleshooting

### Student Frontend - AI Assistant Mobile Responsiveness
- `student-frontend/src/components/Chatbot/ChatbotWidget.js`
  - Added `useMediaQuery` hook for mobile detection
  - Made chat window full-screen on mobile devices
  - Adjusted padding, font sizes, and button sizes for mobile
  - Shortened text labels on mobile for better fit
  - Reduced number of suggestions shown on mobile (3 instead of 4)
