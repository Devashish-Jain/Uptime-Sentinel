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

const router = express.Router();

// @route   GET /api/websites
// @desc    Get all websites with statistics
// @access  Public
router.get('/', getWebsites);

// @route   POST /api/websites
// @desc    Add a new website to monitor
// @access  Public
router.post('/', addWebsite);

// @route   GET /api/websites/:id
// @desc    Get a single website by ID
// @access  Public
router.get('/:id', getWebsiteById);

// @route   DELETE /api/websites/:id
// @desc    Delete a website from monitoring
// @access  Public
router.delete('/:id', deleteWebsite);

// @route   PUT /api/websites/:id/ping-result
// @desc    Update website with ping result (used internally by worker)
// @access  Internal
router.put('/:id/ping-result', updatePingResult);

// @route   GET /api/websites/:id/ping-history
// @desc    Get detailed ping history for a website with filtering options
// @access  Public
router.get('/:id/ping-history', getPingHistory);

// @route   PUT /api/websites/:id/pause
// @desc    Pause monitoring for a website
// @access  Public
router.put('/:id/pause', pauseWebsite);

// @route   PUT /api/websites/:id/resume
// @desc    Resume monitoring for a website
// @access  Public
router.put('/:id/resume', resumeWebsite);

module.exports = router;
