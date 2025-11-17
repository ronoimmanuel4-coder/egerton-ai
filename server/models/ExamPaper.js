const mongoose = require('mongoose');

const ExamPaperSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
  },
  examYear: {
    type: Number, // e.g., 2023, 2024
    required: true,
  },
  examType: {
    type: String,
    enum: ['CAT', 'Mid-Term', 'Final', 'Supplementary'],
    default: 'Final',
  },
  lecturer: {
    type: String, // Lecturer name
    required: true,
  },
  // The actual exam content
  content: {
    // Full text of the exam for AI to learn from
    fullText: String,
    
    // Structured questions
    questions: [{
      questionNumber: Number,
      questionText: String,
      marks: Number,
      section: String, // e.g., "Section A", "Section B"
      type: {
        type: String,
        enum: ['Multiple Choice', 'Short Answer', 'Essay', 'Problem Solving', 'Case Study'],
      },
    }],
    
    // Key topics covered in this exam
    topics: [String],
    
    // Difficulty level (assessed manually or by AI)
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Hard', 'Very Hard'],
      default: 'Moderate',
    },
  },
  
  // AI-extracted patterns
  patterns: {
    // Common question formats this lecturer uses
    questionFormats: [String],
    
    // Favorite topics this lecturer focuses on
    favoriteTopics: [String],
    
    // Difficulty trend
    difficultyTrend: String,
    
    // Any special notes about this lecturer's style
    lecturerStyle: String,
  },
  
  // File information if uploaded as PDF/image
  file: {
    originalName: String,
    path: String,
    mimeType: String,
    size: Number,
  },
  
  // Metadata
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verified: {
    type: Boolean,
    default: false, // Admin can verify accuracy
  },
  
}, {
  timestamps: true,
});

// Index for fast querying
ExamPaperSchema.index({ course: 1, unit: 1, year: 1, semester: 1 });
ExamPaperSchema.index({ lecturer: 1 });
ExamPaperSchema.index({ 'content.topics': 1 });

module.exports = mongoose.model('ExamPaper', ExamPaperSchema);
