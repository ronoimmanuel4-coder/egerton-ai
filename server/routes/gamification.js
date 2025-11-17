const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const UserGamification = require('../models/UserGamification');
const User = require('../models/User');

// Initialize gamification for a new user
const initUserGamification = async (userId) => {
  return await UserGamification.create({ userId });
};

// Get user's gamification data
router.get('/', auth, async (req, res) => {
  try {
    let gamification = await UserGamification.findOne({ userId: req.user.id });
    
    if (!gamification) {
      gamification = await initUserGamification(req.user.id);
    }
    
    res.json(gamification);
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user's gamification data (e.g., on login/completion)
router.post('/update', auth, async (req, res) => {
  console.log('Received request to /api/gamify/update');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID:', req.user?.id);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  try {
    let gamification = await UserGamification.findOne({ userId: req.user.id });
    
    if (!gamification) {
      gamification = await initUserGamification(req.user.id);
    }
    
    // Update streak
    await gamification.updateStreak();
    
    // Award flames based on activity type
    const { activityType } = req.body;
    let flamesEarned = 0;
    
    switch (activityType) {
      case 'daily_login':
        flamesEarned = 5;
        break;
      case 'lesson_completed':
        flamesEarned = 10;
        break;
      case 'quiz_passed':
        flamesEarned = 15;
        break;
      case 'streak_bonus':
        flamesEarned = gamification.streak.current * 2; // Bonus flames based on streak
        break;
      default:
        flamesEarned = 1;
    }
    
    await gamification.awardFlames(flamesEarned, activityType);
    
    // Check for achievements
    await checkAchievements(gamification);
    
    res.json({
      success: true,
      flamesEarned,
      totalFlames: gamification.flames,
      currentStreak: gamification.streak.current,
      rewards: gamification.rewards.filter(r => !r.claimed && (!r.expiresAt || r.expiresAt > new Date()))
    });
    
  } catch (error) {
    console.error('Error updating gamification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Claim a reward
router.post('/rewards/:rewardId/claim', auth, async (req, res) => {
  try {
    const gamification = await UserGamification.findOne({ userId: req.user.id });
    
    if (!gamification) {
      return res.status(404).json({ error: 'Gamification data not found' });
    }
    
    const reward = await gamification.claimReward(req.params.rewardId);
    
    res.json({
      success: true,
      reward,
      totalFlames: gamification.flames
    });
    
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(400).json({ error: error.message });
  }
});

// Check and award achievements
const checkAchievements = async (gamification) => {
  const achievements = [];
  
  // Streak achievements
  if (gamification.streak.current >= 7 && !gamification.achievements.some(a => a.name === '7-Day Streak')) {
    achievements.push({
      name: '7-Day Streak',
      description: 'Maintain a 7-day login streak',
      icon: '🔥',
      flames: 50
    });
  }
  
  if (gamification.streak.current >= 30 && !gamification.achievements.some(a => a.name === '30-Day Streak')) {
    achievements.push({
      name: '30-Day Streak',
      description: 'Maintain a 30-day login streak',
      icon: '🔥🔥',
      flames: 200
    });
  }
  
  // Flame milestones
  if (gamification.flames >= 100 && !gamification.achievements.some(a => a.name === 'Fire Starter')) {
    achievements.push({
      name: 'Fire Starter',
      description: 'Earn 100 flames',
      icon: '🎯',
      flames: 10
    });
  }
  
  if (gamification.flames >= 1000 && !gamification.achievements.some(a => a.name === 'Flame Keeper')) {
    achievements.push({
      name: 'Flame Keeper',
      description: 'Earn 1,000 flames',
      icon: '🏆',
      flames: 100
    });
  }
  
  // Add achievements to user
  for (const achievement of achievements) {
    gamification.achievements.push({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon
    });
    
    await gamification.awardFlames(achievement.flames, 'achievement');
  }
  
  if (achievements.length > 0) {
    await gamification.save();
  }
  
  return achievements;
};

module.exports = router;
