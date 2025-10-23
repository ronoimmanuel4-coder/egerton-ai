const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    years: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    semesters: {
      type: Number,
      required: true,
      min: 2,
      max: 180
    }
  },
  scheduleType: {
    type: String,
    enum: ['semesters', 'terms'],
    default: 'semesters'
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Certificate', 'Diploma', 'Undergraduate', 'Masters', 'PhD'],
    default: 'Diploma'
  },
  requirements: {
    minimumGrade: String,
    subjects: [String],
    other: [String]
  },
  entryRequirements: String, // Detailed entry requirements text
  careerProspects: [String],
  subcourses: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return Array.isArray(arr) && arr.every(item => typeof item === 'string' && item.trim().length > 0);
      },
      message: 'Subcourses must be non-empty strings'
    }
  },
  academicYears: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  units: [{
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    subcourse: {
      type: String,
      trim: true,
      default: ''
    },
    unitCode: {
      type: String,
      required: true,
      uppercase: true
    },
    unitName: {
      type: String,
      required: true
    },
    creditHours: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    description: String,
    prerequisites: [String],
    isCore: {
      type: Boolean,
      default: true
    },
    topics: [{
      topicNumber: {
        type: Number,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      description: String,
      learningOutcomes: [String],
      content: {
        lectureVideo: {
          title: String,
          filename: String, // Actual uploaded file name
          filePath: String, // Server file path
          fileSize: Number, // File size in bytes
          duration: String, // e.g., "45 min"
          uploadDate: {
            type: Date,
            default: Date.now
          },
          uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
          },
          reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          reviewDate: Date,
          reviewNotes: String,
          isPremium: {
            type: Boolean,
            default: false
          }
        },
        notes: {
          title: String,
          filename: String, // PDF file name
          filePath: String, // Server file path
          fileSize: Number, // File size in bytes
          uploadDate: {
            type: Date,
            default: Date.now
          },
          uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
          },
          reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          reviewDate: Date,
          reviewNotes: String,
          isPremium: {
            type: Boolean,
            default: false
          }
        },
        youtubeResources: [{
          title: String,
          url: String, // YouTube URL
          description: String,
          isPremium: {
            type: Boolean,
            default: false
          }
        }]
      }
    }],
    assessments: {
      cats: [{
        title: String,
        description: String,
        academicYear: {
          type: String,
          trim: true,
          default: ''
        },
        filename: String, // Image file name
        filePath: String, // Server file path
        fileSize: Number, // File size in bytes
        imageType: {
          type: String,
          enum: ['jpg', 'jpeg', 'png', 'gif'],
          default: 'jpg'
        },
        dueDate: Date,
        totalMarks: Number,
        uploadDate: {
          type: Date,
          default: Date.now
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reviewDate: Date,
        reviewNotes: String,
        isPremium: {
          type: Boolean,
          default: true
        }
      }],
      assignments: [{
        title: String,
        description: String,
        filename: String, // Image file name
        filePath: String, // Server file path
        fileSize: Number, // File size in bytes
        imageType: {
          type: String,
          enum: ['jpg', 'jpeg', 'png', 'gif'],
          default: 'jpg'
        },
        dueDate: Date,
        totalMarks: Number,
        uploadDate: {
          type: Date,
          default: Date.now
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reviewDate: Date,
        reviewNotes: String,
        isPremium: {
          type: Boolean,
          default: true
        }
      }],
      pastExams: [{
        title: String,
        year: Number,
        semester: Number,
        academicYear: {
          type: String,
          trim: true,
          default: ''
        },
        filename: String, // Image file name
        filePath: String, // Server file path
        fileSize: Number, // File size in bytes
        imageType: {
          type: String,
          enum: ['jpg', 'jpeg', 'png', 'gif'],
          default: 'jpg'
        },
        examType: {
          type: String,
          enum: ['midterm', 'final', 'supplementary']
        },
        uploadDate: {
          type: Date,
          default: Date.now
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reviewDate: Date,
        reviewNotes: String,
        isPremium: {
          type: Boolean,
          default: true
        }
      }]
    }
  }],
  unitIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    index: true
  }],
  topicIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    index: true
  }],
  assessmentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    index: true
  }],
  fees: {
    local: {
      type: mongoose.Schema.Types.Mixed, // Can be Number or Object
      default: 0
    },
    international: {
      type: mongoose.Schema.Types.Mixed, // Can be Number or Object  
      default: 0
    },
    currency: {
      type: String,
      default: 'KSH'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for institution and course code uniqueness
courseSchema.index({ institution: 1, code: 1 }, { unique: true });

// Text index for search
courseSchema.index({ name: 'text', code: 'text', department: 'text' });

module.exports = mongoose.model('Course', courseSchema);
