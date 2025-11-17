const mongoose = require('mongoose');

const userGamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  flames: {
    type: Number,
    default: 0,
    min: 0
  },
  streak: {
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    longest: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    },
    icon: String
  }],
  rewards: [{
    type: {
      type: String,
      enum: ['flames', 'badge', 'discount', 'mpesa'],
      required: true
    },
    amount: Number,
    claimed: {
      type: Boolean,
      default: false
    },
    expiresAt: Date,
    metadata: {}
  }]
}, { timestamps: true });

// Add method to check and update streak
userGamificationSchema.methods.updateStreak = async function() {
  const now = new Date();
  const lastUpdated = new Date(this.streak.lastUpdated);
  
  // Reset if more than 48 hours since last update
  if ((now - lastUpdated) > 48 * 60 * 60 * 1000) {
    this.streak.current = 1;
  } 
  // Increment if within 48 hour window
  else if ((now - lastUpdated) > 24 * 60 * 60 * 1000) {
    this.streak.current += 1;
    if (this.streak.current > this.streak.longest) {
      this.streak.longest = this.streak.current;
    }
  }
  
  this.streak.lastUpdated = now;
  return this.save();
};

// Add method to award flames
userGamificationSchema.methods.awardFlames = async function(amount, reason) {
  this.flames += amount;
  
  // Check for streak-based rewards
  if (this.streak.current % 7 === 0) {
    this.rewards.push({
      type: 'mpesa',
      amount: 10, // KES 10
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week to claim
      metadata: { reason: `7-day streak reward (${this.streak.current} days)` }
    });
  }
  
  await this.save();
  return this;
};

// Add method to claim reward
userGamificationSchema.methods.claimReward = async function(rewardId) {
  const reward = this.rewards.id(rewardId);
  if (!reward || reward.claimed) {
    throw new Error('Invalid or already claimed reward');
  }
  
  if (reward.expiresAt && new Date() > reward.expiresAt) {
    throw new Error('Reward has expired');
  }
  
  reward.claimed = true;
  
  if (reward.type === 'mpesa') {
    // TODO: Integrate with M-Pesa API
    // await processMpesaPayout(user.phone, reward.amount);
  }
  
  await this.save();
  return reward;
};

module.exports = mongoose.model('UserGamification', userGamificationSchema);
