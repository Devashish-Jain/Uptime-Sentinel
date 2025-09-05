const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// @route   POST /api/ping/trigger
// @desc    Manually trigger a ping cycle (for testing)
// @access  Public (in development - should be protected in production)
router.post('/trigger', async (req, res) => {
  try {
    console.log('🔧 Manual ping trigger requested');
    
    // For now, we'll just return success
    // In a production environment, you might want to use a message queue
    // or a shared event system to trigger the worker
    
    res.status(200).json({
      success: true,
      message: 'Ping trigger request received. The worker will pick up changes on the next scheduled cycle.',
      nextScheduledRun: 'Every 5 minutes as configured'
    });
    
  } catch (error) {
    console.error('❌ Error triggering ping:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger ping cycle',
      error: error.message
    });
  }
});

// @route   GET /api/ping/status
// @desc    Get ping worker status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Ping status endpoint',
      info: 'The ping worker runs as a separate process. Check the worker logs for detailed status.',
      schedule: process.env.PING_FREQUENCY_CRON || '*/5 * * * *'
    });
    
  } catch (error) {
    console.error('❌ Error getting ping status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get ping status',
      error: error.message
    });
  }
});

module.exports = router;
