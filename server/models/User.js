const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['student', 'mini_admin', 'super_admin'],
    default: 'student'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: function() { return this.role === 'student'; }
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: function() { return this.role === 'student'; }
  },
  subcourse: {
    type: String,
    trim: true,
    default: '',
    maxlength: 120,
  },
  yearOfStudy: {
    type: Number,
    min: 1,
    max: 6,
    required: function() { return this.role === 'student'; }
  },
  studyPeriod: {
    type: {
      type: String,
      enum: ['semester', 'term'],
      required: function() { return this.role === 'student'; }
    },
    number: {
      type: Number,
      min: 1,
      max: 12,
      required: function() { return this.role === 'student'; }
    }
  },
  subscription: {
    isActive: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date,
    transactionId: String
  },
  jobUnlocks: [{
    unlockedJobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: []
    }],
    gamification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserGamification'
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    transactionId: String
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  gamification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserGamification'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is active
userSchema.methods.hasActiveSubscription = function() {
  return this.subscription.isActive && 
         this.subscription.endDate && 
         new Date() < this.subscription.endDate;
};

// Check if user has unlocked a specific job
userSchema.methods.hasUnlockedJob = function(jobId) {
  return this.jobUnlocks.some(unlock => 
    unlock.jobId.toString() === jobId.toString()
  );
};

module.exports = mongoose.model('User', userSchema);
