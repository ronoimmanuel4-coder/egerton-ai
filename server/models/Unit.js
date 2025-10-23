const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
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
    uppercase: true,
    trim: true
  },
  unitName: {
    type: String,
    required: true,
    trim: true
  },
  creditHours: {
    type: Number,
    min: 1,
    max: 6
  },
  description: String,
  prerequisites: [String],
  isCore: {
    type: Boolean,
    default: true
  },
  topicIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  assessmentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

unitSchema.index({ courseId: 1, unitCode: 1 }, { unique: true });

module.exports = mongoose.model('Unit', unitSchema);
