const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Job = require('../models/Job');
const { auth, authorize } = require('../middleware/auth');
const { notificationService } = require('../socket/socketHandler');
const router = express.Router();

// M-Pesa API configuration
const getMpesaToken = async () => {
  try {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa token error:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
};

// @route   GET /api/payments
// @desc    Get all payments for super admin dashboards
// @access  Private (Super Admin only)
router.get('/', [
  auth,
  authorize('super_admin')
], async (req, res) => {
  try {
    const { limit = 200, skip = 0, status } = req.query;

    const query = {};
    if (status && ['pending', 'completed', 'failed', 'cancelled', 'refunded'].includes(status)) {
      query.status = status;
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 500))
      .lean();

    res.json({
      payments,
      total
    });
  } catch (error) {
    console.error('Admin payments fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// @route   POST /api/payments/subscription
// @desc    Initiate subscription payment
// @access  Private
router.post('/subscription', [
  auth,
  body('phoneNumber').isMobilePhone('en-KE'),
  body('amount').isFloat({ min: 70 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, amount } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create payment record
    const payment = new Payment({
      user: user._id,
      type: 'subscription',
      amount: amount,
      paymentMethod: 'mpesa',
      description: '3-month premium subscription',
      metadata: {
        subscriptionMonths: 3,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      mpesaDetails: {
        phoneNumber: phoneNumber
      }
    });

    await payment.save();

    // Initiate M-Pesa STK Push
    try {
      const token = await getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

      const stkPushResponse = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: `${process.env.MPESA_CALLBACK_URL}/subscription`,
        AccountReference: `EduVault-${user._id}`,
        TransactionDesc: 'EduVault Premium Subscription'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update payment with M-Pesa details
      payment.mpesaDetails.checkoutRequestId = stkPushResponse.data.CheckoutRequestID;
      payment.mpesaDetails.merchantRequestId = stkPushResponse.data.MerchantRequestID;
      await payment.save();

      res.json({
        message: 'Payment initiated successfully',
        paymentId: payment._id,
        checkoutRequestId: stkPushResponse.data.CheckoutRequestID
      });

    } catch (mpesaError) {
      console.error('M-Pesa STK Push error:', mpesaError);
      payment.status = 'failed';
      payment.failureReason = 'M-Pesa integration error';
      await payment.save();

      res.status(500).json({ message: 'Payment initiation failed' });
    }

  } catch (error) {
    console.error('Subscription payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/job-unlock
// @desc    Initiate job unlock payment
// @access  Private
router.post('/job-unlock', [
  auth,
  body('phoneNumber').isMobilePhone('en-KE'),
  body('jobId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, jobId } = req.body;
    const user = await User.findById(req.user.userId);
    const job = await Job.findById(jobId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!job || !job.isActive) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user already unlocked this job
    if (user.hasUnlockedJob(jobId)) {
      return res.status(400).json({ message: 'Job already unlocked' });
    }

    // Create payment record
    const payment = new Payment({
      user: user._id,
      type: 'job_unlock',
      amount: job.unlockPrice,
      paymentMethod: 'mpesa',
      description: `Unlock job: ${job.title}`,
      metadata: {
        jobId: job._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      mpesaDetails: {
        phoneNumber: phoneNumber
      }
    });

    await payment.save();

    // Initiate M-Pesa STK Push (similar to subscription)
    try {
      const token = await getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

      const stkPushResponse = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: job.unlockPrice,
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: `${process.env.MPESA_CALLBACK_URL}/job-unlock`,
        AccountReference: `EduVault-Job-${job._id}`,
        TransactionDesc: `EduVault Job Unlock: ${job.title.substring(0, 20)}`
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      payment.mpesaDetails.checkoutRequestId = stkPushResponse.data.CheckoutRequestID;
      payment.mpesaDetails.merchantRequestId = stkPushResponse.data.MerchantRequestID;
      await payment.save();

      res.json({
        message: 'Payment initiated successfully',
        paymentId: payment._id,
        checkoutRequestId: stkPushResponse.data.CheckoutRequestID
      });

    } catch (mpesaError) {
      console.error('M-Pesa STK Push error:', mpesaError);
      payment.status = 'failed';
      payment.failureReason = 'M-Pesa integration error';
      await payment.save();

      res.status(500).json({ message: 'Payment initiation failed' });
    }

  } catch (error) {
    console.error('Job unlock payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/mpesa/callback/subscription
// @desc    M-Pesa callback for subscription payments
// @access  Public (M-Pesa webhook)
router.post('/mpesa/callback/subscription', async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;

    const payment = await Payment.findOne({
      'mpesaDetails.checkoutRequestId': stkCallback.CheckoutRequestID
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.mpesaDetails.resultCode = stkCallback.ResultCode;
    payment.mpesaDetails.resultDesc = stkCallback.ResultDesc;

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata.Item;
      const transactionId = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

      payment.status = 'completed';
      payment.processedAt = new Date();
      payment.mpesaDetails.transactionId = transactionId;

      // Update user subscription
      const user = await User.findById(payment.user);
      if (user) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // 3 months subscription

        user.subscription = {
          isActive: true,
          startDate: startDate,
          endDate: endDate,
          transactionId: transactionId
        };

        await user.save();

        // Send real-time notification
        const io = req.app.get('io');
        notificationService.notifySubscriptionUpdate(io, user._id, {
          isActive: true,
          endDate: endDate,
          message: 'Premium subscription activated successfully!'
        });
      }
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = stkCallback.ResultDesc;

      // Send failure notification
      const io = req.app.get('io');
      notificationService.notifyPaymentStatus(io, payment.user, {
        status: 'failed',
        type: 'subscription',
        message: 'Subscription payment failed. Please try again.'
      });
    }

    await payment.save();
    res.json({ message: 'Callback processed' });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

// @route   POST /api/payments/mpesa/callback/job-unlock
// @desc    M-Pesa callback for job unlock payments
// @access  Public (M-Pesa webhook)
router.post('/mpesa/callback/job-unlock', async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;

    const payment = await Payment.findOne({
      'mpesaDetails.checkoutRequestId': stkCallback.CheckoutRequestID
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.mpesaDetails.resultCode = stkCallback.ResultCode;
    payment.mpesaDetails.resultDesc = stkCallback.ResultDesc;

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata.Item;
      const transactionId = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

      payment.status = 'completed';
      payment.processedAt = new Date();
      payment.mpesaDetails.transactionId = transactionId;

      // Update user job unlocks
      const user = await User.findById(payment.user);
      if (user && payment.metadata.jobId) {
        user.jobUnlocks.push({
          jobId: payment.metadata.jobId,
          transactionId: transactionId
        });

        await user.save();

        // Update job unlock count
        await Job.findByIdAndUpdate(payment.metadata.jobId, {
          $inc: { unlockCount: 1 }
        });
      }
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = stkCallback.ResultDesc;
    }

    await payment.save();
    res.json({ message: 'Callback processed' });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

// @route   GET /api/payments/status/:paymentId
// @desc    Check payment status
// @access  Private
router.get('/status/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      user: req.user.userId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
