const mongoose = require('mongoose');

const contentAssetSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'notes', 'document', 'image', 'audio'],
    required: true
  },
  ownerType: {
    type: String,
    enum: ['topic', 'unit', 'course'],
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  filePath: {
    type: String
  },
  fileSize: Number,
  mimetype: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  gridFsFileId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  // Optional denormalized references to speed lookups and enable admin ops
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
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: String,
  uploadDate: {
    type: Date,
    default: Date.now
  },
  reviewDate: Date
}, {
  timestamps: true
});

contentAssetSchema.index({ ownerType: 1, owner: 1, type: 1 });
contentAssetSchema.index({ courseId: 1, unitId: 1, type: 1 });

module.exports = mongoose.model('ContentAsset', contentAssetSchema);
