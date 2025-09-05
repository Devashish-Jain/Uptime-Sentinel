const mongoose = require('mongoose');
const { Schema } = mongoose;

// Custom validator for URL
const urlValidator = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

// Ping history entry schema
const pingHistorySchema = new Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  statusCode: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // Duration in milliseconds
    required: true
  }
}, { _id: false });

// Main Website schema
const websiteSchema = new Schema({
  url: {
    type: String,
    required: [true, 'URL is required'],
    unique: true,
    trim: true,
    validate: {
      validator: urlValidator,
      message: 'Please provide a valid URL (must include http:// or https://)'
    }
  },
  name: {
    type: String,
    required: [true, 'Website name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required for notifications'],
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'UP', 'DOWN'],
    default: 'PENDING'
  },
  lastChecked: {
    type: Date,
    default: null
  },
  consecutiveFailures: {
    type: Number,
    default: 0
  },
  emailNotificationSent: {
    type: Boolean,
    default: false
  },
  nextPingTime: {
    type: Date,
    default: function() {
      // Set next ping to 5 minutes from now by default
      return new Date(Date.now() + 5 * 60 * 1000);
    }
  },
  isTemporarilyStopped: {
    type: Boolean,
    default: false
  },
  stopPingUntil: {
    type: Date,
    default: null
  },
  pingHistory: {
    type: [pingHistorySchema],
    default: [],
    validate: {
      validator: function(array) {
        return array.length <= 100; // Cap at 100 entries
      },
      message: 'Ping history cannot exceed 100 entries'
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Middleware to manage ping history cap
websiteSchema.pre('save', function(next) {
  if (this.pingHistory && this.pingHistory.length > 100) {
    // Keep only the latest 100 entries
    this.pingHistory = this.pingHistory.slice(-100);
  }
  next();
});

// Instance method to add ping result with individual scheduling
websiteSchema.methods.addPingResult = function(statusCode, duration) {
  const pingEntry = {
    timestamp: new Date(),
    statusCode,
    duration
  };
  
  this.pingHistory.push(pingEntry);
  
  // Ensure we don't exceed 100 entries
  if (this.pingHistory.length > 100) {
    this.pingHistory = this.pingHistory.slice(-100);
  }
  
  const isUp = statusCode >= 200 && statusCode < 400;
  
  // Update status based on status code
  this.status = isUp ? 'UP' : 'DOWN';
  this.lastChecked = new Date();
  
  // Set next ping time based on current status
  const pingIntervalMinutes = parseInt(process.env.PING_INTERVAL_MINUTES) || 5;
  const pingInterval = pingIntervalMinutes * 60 * 1000; // Convert minutes to milliseconds
  
  if (isUp) {
    // Website is up - continue normal monitoring
    this.nextPingTime = new Date(Date.now() + pingInterval);
    this.isTemporarilyStopped = false;
    this.stopPingUntil = null;
  } else {
    // Website is down
    const now = new Date();
    
    // Get configurable monitoring durations (default to 12 and 24 hours)
    const downtimeMonitoringHours = parseInt(process.env.DOWNTIME_MONITORING_HOURS) || 12;
    const pauseMonitoringHours = parseInt(process.env.PAUSE_MONITORING_HOURS) || 24;
    
    const monitoringLimitTime = new Date(now.getTime() + downtimeMonitoringHours * 60 * 60 * 1000);
    
    // Continue monitoring for the configured duration, then pause
    if (!this.stopPingUntil) {
      // First time going down - set monitoring limit
      this.stopPingUntil = monitoringLimitTime;
      this.nextPingTime = new Date(Date.now() + pingInterval);
      console.log(`⏰ ${this.name} went down. Will continue monitoring for ${downtimeMonitoringHours} hours until ${this.stopPingUntil}`);
    } else if (now < this.stopPingUntil) {
      // Still within monitoring window - continue monitoring
      this.nextPingTime = new Date(Date.now() + pingInterval);
      const timeLeft = Math.ceil((this.stopPingUntil - now) / (60 * 60 * 1000));
      console.log(`🔄 ${this.name} still down. Continuing monitoring for ${timeLeft} more hours.`);
    } else {
      // Monitoring period has passed - temporarily stop pinging
      this.isTemporarilyStopped = true;
      this.nextPingTime = new Date(now.getTime() + pauseMonitoringHours * 60 * 60 * 1000);
      console.log(`🛑 ${this.name} has been down for ${downtimeMonitoringHours}+ hours. Pausing monitoring for ${pauseMonitoringHours} hours.`);
    }
  }
  
  return this.save();
};

// Static method to get websites with recent ping statistics
websiteSchema.statics.getWebsitesWithStats = function() {
  return this.aggregate([
    {
      $addFields: {
        recentPings: { $slice: ['$pingHistory', -10] }, // Get last 10 pings
        averageResponseTime: {
          $avg: '$pingHistory.duration'
        },
        uptimePercentage: {
          $cond: {
            if: { $eq: [{ $size: '$pingHistory' }, 0] },
            then: 0,
            else: {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$pingHistory',
                          cond: { $and: [{ $gte: ['$$this.statusCode', 200] }, { $lt: ['$$this.statusCode', 400] }] }
                        }
                      }
                    },
                    { $size: '$pingHistory' }
                  ]
                },
                100
              ]
            }
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);
};

module.exports = mongoose.model('Website', websiteSchema);
