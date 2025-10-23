const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    index: true
  },
  topicNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  learningOutcomes: [String],
  lectureVideoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentAsset'
  },
  notesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentAsset'
  },
  youtubeResourceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentAsset'
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

topicSchema.index({ unitId: 1, topicNumber: 1 }, { unique: true });

module.exports = mongoose.model('Topic', topicSchema);
