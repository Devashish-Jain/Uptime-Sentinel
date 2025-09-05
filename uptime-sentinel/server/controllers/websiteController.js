const Website = require('../models/Website');
const immediatePingService = require('../services/immediatePingService');

// @desc    Get all websites
// @route   GET /api/websites
// @access  Public
const getWebsites = async (req, res) => {
  try {
    // Use the static method to get websites with statistics
    const websites = await Website.getWebsitesWithStats();
    
    res.status(200).json({
      success: true,
      count: websites.length,
      data: websites
    });
  } catch (error) {
    console.error('Error fetching websites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch websites',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Add a new website
// @route   POST /api/websites
// @access  Public
const addWebsite = async (req, res) => {
  try {
    console.log('📝 Request body:', req.body);
    const { url, name, email } = req.body;

    // Validate required fields
    if (!url || !name || !email) {
      console.log('⚠️ Missing required fields:', { url: !!url, name: !!name, email: !!email });
      return res.status(400).json({
        success: false,
        message: 'Please provide URL, name, and email'
      });
    }

    // Ensure URL has protocol
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Check if website already exists
    const existingWebsite = await Website.findOne({ url: formattedUrl });
    if (existingWebsite) {
      return res.status(400).json({
        success: false,
        message: 'Website with this URL already exists'
      });
    }

    // Create new website
    console.log('📎 Creating website with data:', { url: formattedUrl, name: name.trim(), email: email.trim() });
    const website = new Website({
      url: formattedUrl,
      name: name.trim(),
      email: email.trim()
    });

    const savedWebsite = await website.save();
    
    // Perform immediate ping to get initial status
    console.log(`🚀 Performing immediate ping for ${savedWebsite.name}...`);
    try {
      await immediatePingService.pingWebsite(savedWebsite);
      console.log(`✅ Immediate ping completed for ${savedWebsite.name}`);
    } catch (error) {
      console.log(`⚠️ Immediate ping failed for ${savedWebsite.name}: ${error.message}`);
    }

    // Reload the website to get the updated status
    const updatedWebsite = await Website.findById(savedWebsite._id);

    res.status(201).json({
      success: true,
      message: 'Website added successfully and initial ping completed',
      data: updatedWebsite
    });
  } catch (error) {
    console.error('Error adding website:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Website with this URL already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add website',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete a website
// @route   DELETE /api/websites/:id
// @access  Public
const deleteWebsite = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid website ID format'
      });
    }

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    await Website.findByIdAndDelete(id);

    res.status(204).json({
      success: true,
      message: 'Website deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting website:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete website',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get website by ID
// @route   GET /api/websites/:id
// @access  Public
const getWebsiteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid website ID format'
      });
    }

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    res.status(200).json({
      success: true,
      data: website
    });
  } catch (error) {
    console.error('Error fetching website:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch website',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update website status (used by ping worker)
// @route   PUT /api/websites/:id/ping-result
// @access  Internal (should be protected in production)
const updatePingResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusCode, duration } = req.body;

    // Validate input
    if (!statusCode || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Status code and duration are required'
      });
    }

    const website = await Website.findById(id);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Use the instance method to add ping result
    await website.addPingResult(statusCode, duration);

    res.status(200).json({
      success: true,
      message: 'Ping result updated successfully',
      data: website
    });
  } catch (error) {
    console.error('Error updating ping result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ping result',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get detailed ping history for a website with filtering
// @route   GET /api/websites/:id/ping-history
// @access  Public
const getPingHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      sortBy = 'timestamp', 
      sortOrder = 'desc', 
      filterDate = null,
      status = null,
      limit = 100 
    } = req.query;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid website ID format'
      });
    }

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    let pingHistory = [...website.pingHistory];

    // Apply filters
    if (filterDate) {
      const targetDate = new Date(filterDate);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      pingHistory = pingHistory.filter(ping => {
        const pingDate = new Date(ping.timestamp);
        return pingDate >= startOfDay && pingDate <= endOfDay;
      });
    }

    if (status) {
      if (status === 'up') {
        pingHistory = pingHistory.filter(ping => ping.statusCode >= 200 && ping.statusCode < 400);
      } else if (status === 'down') {
        pingHistory = pingHistory.filter(ping => ping.statusCode < 200 || ping.statusCode >= 400);
      }
    }

    // Apply sorting
    pingHistory.sort((a, b) => {
      const aValue = sortBy === 'timestamp' ? new Date(a.timestamp) : a[sortBy];
      const bValue = sortBy === 'timestamp' ? new Date(b.timestamp) : b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply limit
    const limitNum = parseInt(limit);
    if (limitNum > 0) {
      pingHistory = pingHistory.slice(0, limitNum);
    }

    // Calculate summary statistics
    const totalPings = website.pingHistory.length;
    const successfulPings = website.pingHistory.filter(ping => 
      ping.statusCode >= 200 && ping.statusCode < 400
    ).length;
    const uptimePercentage = totalPings > 0 ? (successfulPings / totalPings) * 100 : 0;
    const averageResponseTime = totalPings > 0 ? 
      website.pingHistory.reduce((sum, ping) => sum + ping.duration, 0) / totalPings : 0;

    res.status(200).json({
      success: true,
      data: {
        website: {
          id: website._id,
          name: website.name,
          url: website.url,
          status: website.status,
          lastChecked: website.lastChecked
        },
        pingHistory,
        statistics: {
          totalPings,
          successfulPings,
          failedPings: totalPings - successfulPings,
          uptimePercentage: Math.round(uptimePercentage * 100) / 100,
          averageResponseTime: Math.round(averageResponseTime),
          filters: {
            sortBy,
            sortOrder,
            filterDate,
            status,
            limit: limitNum
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching ping history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ping history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Pause monitoring for a website
// @route   PUT /api/websites/:id/pause
// @access  Public
const pauseWebsite = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid website ID format'
      });
    }

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Pause the website monitoring
    website.isTemporarilyStopped = true;
    website.stopPingUntil = null; // Indefinite pause until manually resumed
    await website.save();

    res.status(200).json({
      success: true,
      message: `Monitoring paused for ${website.name}`,
      data: website
    });
  } catch (error) {
    console.error('Error pausing website:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause website monitoring',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Resume monitoring for a website
// @route   PUT /api/websites/:id/resume
// @access  Public
const resumeWebsite = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid website ID format'
      });
    }

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Resume the website monitoring
    website.isTemporarilyStopped = false;
    website.stopPingUntil = null;
    
    // Set next ping time to now so it gets picked up immediately
    website.nextPingTime = new Date();
    await website.save();

    res.status(200).json({
      success: true,
      message: `Monitoring resumed for ${website.name}`,
      data: website
    });
  } catch (error) {
    console.error('Error resuming website:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume website monitoring',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getWebsites,
  addWebsite,
  deleteWebsite,
  getWebsiteById,
  updatePingResult,
  getPingHistory,
  pauseWebsite,
  resumeWebsite
};
