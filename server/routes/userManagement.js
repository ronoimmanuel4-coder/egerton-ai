const express = require('express');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Course = require('../models/Course');
const StudentDownload = require('../models/StudentDownload');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Middleware to ensure only super admins can access these routes
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super admin required.' });
  }
  next();
};

// @route   GET /api/admin/users/:userId
// @desc    Get detailed information for a single user
// @access  Private (Super Admin only)
router.get('/users/:userId', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('institution', 'name')
      .populate('course', 'name code');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const subscriptions = await Subscription.find({ userId })
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });

    const recentDownloads = await StudentDownload.find({ userId })
      .sort({ downloadedAt: -1 })
      .limit(20);

    const auditHistory = [];

    auditHistory.push({
      type: 'account_created',
      label: 'Account created',
      timestamp: user.createdAt,
      details: {
        email: user.email,
        role: user.role
      }
    });

    if (user.lastLogin) {
      auditHistory.push({
        type: 'login',
        label: 'Last login',
        timestamp: user.lastLogin,
        details: {
          description: 'User last authenticated'
        }
      });
    }

    subscriptions.forEach((subscription) => {
      auditHistory.push({
        type: 'subscription',
        label: `Subscription ${subscription.status}`,
        timestamp: subscription.createdAt,
        details: {
          course: subscription.courseId?.name,
          amount: subscription.amount,
          currency: subscription.currency,
          status: subscription.status,
          isActive: subscription.isActive,
          expiryDate: subscription.expiryDate,
          transactionId: subscription.mpesaTransactionId
        }
      });

      if (subscription.expiryDate) {
        auditHistory.push({
          type: 'subscription_expiry',
          label: 'Subscription expiry',
          timestamp: subscription.expiryDate,
          details: {
            course: subscription.courseId?.name,
            amount: subscription.amount,
            note: 'Subscription expiry date'
          }
        });
      }
    });

    recentDownloads.forEach((download) => {
      auditHistory.push({
        type: 'download',
        label: `Downloaded ${download.resourceTitle || download.filename}`,
        timestamp: download.downloadedAt,
        details: {
          origin: download.origin,
          courseName: download.courseName,
          unitName: download.unitName,
          topicTitle: download.topicTitle,
          fileSize: download.fileSize
        }
      });
    });

    auditHistory.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    res.json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive,
        institution: user.institution ? {
          _id: user.institution._id,
          name: user.institution.name
        } : null,
        course: user.course ? {
          _id: user.course._id,
          name: user.course.name,
          code: user.course.code
        } : null,
        yearOfStudy: user.yearOfStudy,
        subscription: user.subscription,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin
      },
      subscriptions: subscriptions.map((subscription) => ({
        _id: subscription._id,
        status: subscription.status,
        isActive: subscription.isActive,
        amount: subscription.amount,
        currency: subscription.currency,
        paymentMethod: subscription.paymentMethod,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        paymentDate: subscription.paymentDate,
        mpesaTransactionId: subscription.mpesaTransactionId,
        mpesaReceiptNumber: subscription.mpesaReceiptNumber,
        course: subscription.courseId ? {
          _id: subscription.courseId._id,
          name: subscription.courseId.name,
          code: subscription.courseId.code
        } : null,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      })),
      downloads: recentDownloads.map((download) => ({
        _id: download._id,
        resourceTitle: download.resourceTitle,
        filename: download.filename,
        courseName: download.courseName,
        unitName: download.unitName,
        topicTitle: download.topicTitle,
        origin: download.origin,
        fileSize: download.fileSize,
        downloadedAt: download.downloadedAt,
        expiresAt: download.expiresAt
      })),
      auditHistory
    });
  } catch (error) {
    console.error('❌ Error fetching user detail:', error);
    res.status(500).json({
      message: 'Server error fetching user detail',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with their details
// @access  Private (Super Admin only)
router.get('/users', auth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching all users for super admin...');
    
    const users = await User.find({})
      .select('firstName lastName email password phoneNumber role isActive institution createdAt lastLogin')
      .populate('institution', 'name')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${users.length} users`);
    
    res.json({
      success: true,
      users: users.map(user => ({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password, // Super admin can see passwords for password recovery
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive,
        institution: user.institution?.name || 'Not specified',
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      message: 'Server error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions with user details
// @access  Private (Super Admin only)
router.get('/subscriptions', auth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching all subscriptions for super admin...');
    
    const subscriptions = await Subscription.find({})
      .populate('userId', 'firstName lastName email')
      .populate('courseId', 'name')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${subscriptions.length} subscriptions`);
    
    res.json({
      success: true,
      subscriptions: subscriptions.map(sub => {
        const course = sub.courseId && typeof sub.courseId === 'object'
          ? {
              _id: sub.courseId._id,
              name: sub.courseId.name,
              code: sub.courseId.code
            }
          : null;

        const user = sub.userId && typeof sub.userId === 'object'
          ? {
              _id: sub.userId._id,
              firstName: sub.userId.firstName,
              lastName: sub.userId.lastName,
              email: sub.userId.email
            }
          : { _id: sub.userId };

        return {
          _id: sub._id,
          userId: user._id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          userEmail: user.email || '',
          courseId: course?._id || null,
          courseName: course?.name || 'Unknown course',
          courseCode: course?.code || null,
          amount: sub.amount,
          currency: sub.currency,
          status: sub.status,
          isActive: sub.isActive,
          startDate: sub.startDate,
          expiryDate: sub.expiryDate,
          paymentDate: sub.paymentDate,
          mpesaTransactionId: sub.mpesaTransactionId,
          mpesaReceiptNumber: sub.mpesaReceiptNumber,
          createdAt: sub.createdAt
        };
      })
    });

  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    res.status(500).json({ 
      message: 'Server error fetching subscriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/users/:userId
// @desc    Update user details
// @access  Private (Super Admin only)
router.put('/users/:userId', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, institution } = req.body;

    console.log('📝 Updating user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (institution) user.institution = institution;

    await user.save();

    console.log('✅ User updated successfully');
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        institution: user.institution
      }
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ 
      message: 'Server error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/users/:userId/role
// @desc    Update user role (student, mini_admin, super_admin)
// @access  Private (Super Admin only)
router.put('/users/:userId/role', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    console.log('🔄 Changing user role:', userId, 'to', role);

    if (!['student', 'mini_admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    console.log('✅ User role updated successfully');
    
    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({ 
      message: 'Server error updating user role',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/users/:userId/status
// @desc    Activate or deactivate user account
// @access  Private (Super Admin only)
router.put('/users/:userId/status', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    console.log('🔄 Changing user status:', userId, 'to', isActive ? 'active' : 'inactive');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    console.log('✅ User status updated successfully');
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ 
      message: 'Server error updating user status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/users/:userId/password
// @desc    Reset user password (for password recovery assistance)
// @access  Private (Super Admin only)
router.put('/users/:userId/password', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    console.log('🔐 Resetting password for user:', userId);

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    console.log('✅ Password reset successfully');
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      user: {
        _id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({ 
      message: 'Server error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/admin/grant-premium
// @desc    Grant premium access to a user for a specific course
// @access  Private (Super Admin only)
router.post('/grant-premium', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId, courseId, duration = 30 } = req.body; // Default 30 days

    console.log('🎁 Granting premium access:', { userId, courseId, duration });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user already has active subscription for this course
    const existingSubscription = await Subscription.findOne({
      userId,
      courseId,
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'User already has active premium access for this course' });
    }

    // Create new subscription
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));

    const subscription = new Subscription({
      userId,
      courseId,
      year: 1, // Default year
      amount: 0, // Admin granted - no charge
      currency: 'KSH',
      paymentMethod: 'admin_grant',
      status: 'completed',
      isActive: true,
      startDate,
      expiryDate,
      paymentDate: new Date(),
      mpesaTransactionId: `ADMIN_GRANT_${Date.now()}`,
      mpesaReceiptNumber: `AG${Date.now()}`,
      metadata: {
        grantedBy: req.user.id,
        grantedByEmail: req.user.email,
        reason: 'Admin granted premium access'
      }
    });

    await subscription.save();

    console.log('✅ Premium access granted successfully');
    
    res.json({
      success: true,
      message: 'Premium access granted successfully',
      subscription: {
        _id: subscription._id,
        userId: subscription.userId,
        courseId: subscription.courseId,
        expiryDate: subscription.expiryDate,
        isActive: subscription.isActive
      }
    });

  } catch (error) {
    console.error('❌ Error granting premium access:', error);
    res.status(500).json({ 
      message: 'Server error granting premium access',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Delete user account (use with extreme caution)
// @access  Private (Super Admin only)
router.delete('/users/:userId', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🗑️ Deleting user account:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also delete user's subscriptions
    await Subscription.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log('✅ User account deleted successfully');
    
    res.json({
      success: true,
      message: 'User account deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ 
      message: 'Server error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
