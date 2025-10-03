const User = require('../models/User');
const OTP = require('../models/OTP');
const { createSendToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Signup
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user (email not verified initially)
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      isEmailVerified: false
    });

    // Generate OTP for email verification
    const verificationCode = await OTP.createOTP(email, 'email_verification');

    // Send verification email
    try {
      await emailService.sendVerificationEmail(newUser, verificationCode);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully. Please check your email for verification code.',
        data: {
          userId: newUser._id,
          email: newUser.email,
          emailSent: true
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully, but failed to send verification email. You can request a new verification code.',
        data: {
          userId: newUser._id,
          email: newUser.email,
          emailSent: false
        }
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Verify OTP
    const otpResult = await OTP.verifyOTP(email, verificationCode, 'email_verification');
    
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isEmailVerified: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Verify the user
    user.isEmailVerified = true;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT and send response
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      isEmailVerified: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Generate new OTP
    const verificationCode = await OTP.createOTP(email, 'email_verification');

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, verificationCode);
      
      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // 3) Check if email is verified
    if (!user.isEmailVerified) {
      // Check if there's a valid OTP, if not create one
      const hasValidOTP = await OTP.isValidOTP(user.email, 'email_verification');
      
      if (!hasValidOTP) {
        const verificationCode = await OTP.createOTP(user.email, 'email_verification');
        
        // Try to send verification email
        try {
          await emailService.sendVerificationEmail(user, verificationCode);
        } catch (emailError) {
          console.error('Failed to send verification email during login:', emailError);
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Please verify your email address. Check your inbox for verification code.',
        emailVerificationRequired: true,
        email: user.email
      });
    }

    // 4) Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // 5) Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 6) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get current user
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check authentication status
const checkAuthStatus = async (req, res) => {
  try {
    if (req.user) {
      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        user: req.user
      });
    }
    
    res.status(200).json({
      success: true,
      isAuthenticated: false,
      user: null
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking authentication status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  signup,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  getMe,
  checkAuthStatus
};
