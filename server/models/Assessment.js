const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    index: true
  },
  unitName: {
    type: String,
    trim: true
  },
  unitCode: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['cat', 'assignment', 'pastExam', 'exam'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    trim: true
  },
  examMetadata: {
    year: Number,
    semester: Number,
    examType: {
      type: String,
      enum: ['midterm', 'final', 'supplementary']
    }
  },
  instructions: {
    type: String,
    trim: true
  },
  dueDate: Date,
  totalMarks: Number,
  duration: Number,
  durationMinutes: Number,
  
  // File information
  filename: String,
  filePath: String,
  fileSize: Number,
  fileType: String,
  imageFile: {
    filename: String,
    originalName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  },
  gridFsFileId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  contentAssetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentAsset'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'scheduled', 'expired', 'completed'],
    default: 'pending',
    index: true
  },
  isPremium: {
    type: Boolean,
    default: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  publishDate: Date,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  reviewNotes: String,
  
  // Institution and department info
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  department: String,
  
  // Additional metadata
  maxViews: {
    type: Number,
    default: 3
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [String],
  
  // Counters
  viewCount: {
    type: Number,
    default: 0
  },
  submissionCount: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  approvalHistory: [{
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    canDownload: {
      type: Boolean,
      default: false
    },
    allowScreenshots: {
      type: Boolean,
      default: false
    },
    maxViews: Number
  },
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

assessmentSchema.index({ courseId: 1, unitId: 1, type: 1, status: 1 });
assessmentSchema.index({ academicYear: 1, type: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
