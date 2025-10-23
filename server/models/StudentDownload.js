const mongoose = require('mongoose');

const studentDownloadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: String,
  courseCode: String,
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId
  },
  unitName: String,
  topicId: {
    type: mongoose.Schema.Types.ObjectId
  },
  topicTitle: String,
  resourceId: String,
  resourceTitle: String,
  origin: {
    type: String,
    enum: ['course_note', 'resource'],
    default: 'course_note'
  },
  filename: {
    type: String,
    required: true
  },
  fileSize: Number,
  downloadedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

studentDownloadSchema.index({ userId: 1, resourceId: 1, filename: 1 }, { unique: true, sparse: true });
studentDownloadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('StudentDownload', studentDownloadSchema);
