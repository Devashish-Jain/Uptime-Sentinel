const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    length: 6
  },
  purpose: {
    type: String,
    enum: ['email_verification', 'password_reset'],
    required: true,
    default: 'email_verification'
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 minutes (300 seconds) - MongoDB TTL index
  }
}, {
  timestamps: false // We only need createdAt with TTL
});

// Compound index for faster lookups
otpSchema.index({ email: 1, code: 1, purpose: 1 });

// Static method to generate OTP code
otpSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Static method to create new OTP
otpSchema.statics.createOTP = async function(email, purpose = 'email_verification') {
  // Delete any existing OTPs for this email and purpose
  await this.deleteMany({ email, purpose });
  
  // Generate new code
  const code = this.generateCode();
  
  // Create new OTP
  const otp = new this({
    email,
    code,
    purpose
  });
  
  await otp.save();
  return code;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email, code, purpose = 'email_verification') {
  const otp = await this.findOne({
    email,
    code: code.toUpperCase(),
    purpose,
    used: false
  });
  
  if (!otp) {
    return { success: false, message: 'Invalid or expired verification code' };
  }
  
  // Check attempts
  if (otp.attempts >= 5) {
    return { success: false, message: 'Too many attempts. Please request a new code.' };
  }
  
  // Increment attempts
  otp.attempts += 1;
  await otp.save();
  
  // Mark as used and return success
  otp.used = true;
  await otp.save();
  
  return { success: true, message: 'Code verified successfully' };
};

// Static method to check if OTP exists and is valid
otpSchema.statics.isValidOTP = async function(email, purpose = 'email_verification') {
  const otp = await this.findOne({
    email,
    purpose,
    used: false
  });
  
  return !!otp;
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  await this.save();
  return this.attempts;
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
