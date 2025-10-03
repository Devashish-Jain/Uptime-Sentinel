const express = require('express');
const {
  getWebsites,
  addWebsite,
  deleteWebsite,
  getWebsiteById,
  updatePingResult,
  getPingHistory,
  pauseWebsite,
  resumeWebsite
} = require('../controllers/websiteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Internal route (used by worker) - no auth needed
// @route   PUT /api/websites/:id/ping-result
// @desc    Update website with ping result (used internally by worker)
// @access  Internal
router.put('/:id/ping-result', updatePingResult);

// All other routes require authentication
router.use(protect);

// @route   GET /api/websites
// @desc    Get user's websites with statistics
// @access  Private
router.get('/', getWebsites);

// @route   POST /api/websites
// @desc    Add a new website to monitor
// @access  Private
router.post('/', addWebsite);

// @route   GET /api/websites/:id
// @desc    Get a single website by ID
// @access  Private
router.get('/:id', getWebsiteById);

// @route   DELETE /api/websites/:id
// @desc    Delete a website from monitoring
// @access  Private
router.delete('/:id', deleteWebsite);

// @route   GET /api/websites/:id/ping-history
// @desc    Get detailed ping history for a website with filtering options
// @access  Private
router.get('/:id/ping-history', getPingHistory);

// @route   PUT /api/websites/:id/pause
// @desc    Pause monitoring for a website
// @access  Private
router.put('/:id/pause', pauseWebsite);

// @route   PUT /api/websites/:id/resume
// @desc    Resume monitoring for a website
// @access  Private
router.put('/:id/resume', resumeWebsite);

module.exports = router;
