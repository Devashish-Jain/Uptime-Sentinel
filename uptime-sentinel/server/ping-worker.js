const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const cron = require('node-cron');
require('dotenv').config();

// Import Website model and services
const Website = require('./models/Website');
const emailService = require('./services/emailService');

class PingWorker {
  constructor() {
    this.browser = null;
    this.isRunning = false;
    this.currentPings = 0;
    this.totalPingsCompleted = 0;
    this.startTime = new Date();
  }

  // Initialize browser instance
  async initBrowser() {
    try {
      console.log('🔧 Initializing Puppeteer browser...');
      
      this.browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        defaultViewport: {
          width: 1280,
          height: 720
        },
        ignoreDefaultArgs: ['--disable-extensions']
      });
      
      // Test the browser
      const version = await this.browser.version();
      console.log(`✅ Browser initialized successfully (${version})`);
      
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error.message);
      throw error;
    }
  }

  // Connect to MongoDB
  async connectDB() {
    try {
      const mongoURI = process.env.MONGO_URI;
      
      if (!mongoURI) {
        throw new Error('MONGO_URI environment variable is not defined');
      }

      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4
      });

      console.log('✅ MongoDB Connected (Ping Worker)');
    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error.message);
      throw error;
    }
  }

  // Perform ping on a single website
  async pingWebsite(website) {
    let context = null;
    let page = null;
    const startTime = Date.now();

    try {
      console.log(`🏃 Pinging: ${website.name} (${website.url})`);

      // Create isolated browser context (incognito mode)
      context = await this.browser.createBrowserContext();
      page = await context.newPage();

      // Enable request interception to block unnecessary resources
      await page.setRequestInterception(true);

      page.on('request', (request) => {
        const resourceType = request.resourceType();
        
        // Block images, stylesheets, fonts, and media to speed up loading
        const blockedTypes = ['image', 'stylesheet', 'font', 'media', 'other'];
        
        if (blockedTypes.includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Set a reasonable user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 UptimeSentinel/1.0'
      );
      
      // Set additional page settings for better performance
      await page.setDefaultTimeout(30000);
      await page.setDefaultNavigationTimeout(30000);

      // Navigate to the website
      console.log(`🌍 Navigating to: ${website.url}`);
      const response = await page.goto(website.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      const statusCode = response ? response.status() : 0;
      
      // Additional check for health endpoints
      let isHealthy = false;
      if (response && statusCode >= 200 && statusCode < 400) {
        try {
          // If it's a health endpoint, check for success indicators
          if (website.url.includes('/health') || website.url.includes('/status')) {
            const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
            isHealthy = pageText.includes('ok') || 
                       pageText.includes('success') || 
                       pageText.includes('healthy') ||
                       pageText.includes('up') ||
                       (statusCode >= 200 && statusCode < 300);
            console.log(`🩺 Health check result for ${website.name}: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'} (${statusCode})`);
          } else {
            // For regular websites, just check status code
            isHealthy = statusCode >= 200 && statusCode < 400;
          }
        } catch (error) {
          console.log(`⚠️ Error checking page content for ${website.name}:`, error.message);
          isHealthy = statusCode >= 200 && statusCode < 400;
        }
      }

      if (isHealthy) {
        console.log(`✅ ${website.name}: ${statusCode} (${duration}ms) - HEALTHY`);

        // Check if this is a recovery from previous failures
        const wasDown = website.consecutiveFailures >= 3;

        // Reset failure count on successful ping
        website.consecutiveFailures = 0;
        website.emailNotificationSent = false;
        
        // Update website with ping result (this will also handle scheduling)
        await website.addPingResult(statusCode, duration);
        
        // Send recovery notification if website was previously down
        if (wasDown) {
          console.log(`💬 Sending recovery notification for ${website.name}`);
          await emailService.sendRecoveryNotification(website);
        }
      } else {
        // Treat as failure even if we got a response
        throw new Error(`Health check failed - Status: ${statusCode}, Response indicates unhealthy state`);
      }

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Determine error type for better logging
      let errorType = 'UNKNOWN';
      if (error.message.includes('timeout')) {
        errorType = 'TIMEOUT';
      } else if (error.message.includes('net::ERR')) {
        errorType = 'NETWORK_ERROR';
      } else if (error.message.includes('Health check failed')) {
        errorType = 'HEALTH_CHECK_FAILED';
      } else if (error.message.includes('Navigation failed')) {
        errorType = 'NAVIGATION_FAILED';
      }
      
      console.log(`❌ ${website.name}: FAILED (${duration}ms) - ${errorType}: ${error.message}`);

      // Increment consecutive failures
      website.consecutiveFailures += 1;
      
      // Record failure with status code 0 (this will also handle scheduling)
      await website.addPingResult(0, duration);
      
      // Send email notification after 3 consecutive failures
      if (website.consecutiveFailures >= 3 && !website.emailNotificationSent) {
        console.log(`📧 Sending downtime alert for ${website.name} (${website.consecutiveFailures} failures)`);
        
        const failureDetails = {
          error: error.message,
          duration: duration,
          timestamp: new Date().toISOString()
        };
        
        const emailSent = await emailService.sendDowntimeAlert(website, failureDetails);
        
        if (emailSent) {
          website.emailNotificationSent = true;
          await website.save();
        }
      } else if (website.consecutiveFailures < 3) {
        console.log(`⚠️ ${website.name}: ${website.consecutiveFailures} consecutive failures`);
      }

    } finally {
      // CRITICAL: Always clean up resources
      try {
        if (page) await page.close();
        if (context) await context.close();
      } catch (cleanupError) {
        console.error('⚠️  Cleanup error:', cleanupError.message);
      }
    }
  }

  // Run ping cycle for websites that are ready
  async runPingCycle() {
    if (this.isRunning) {
      console.log('⚠️  Ping cycle already running, skipping...');
      return;
    }

    this.isRunning = true;
    const cycleStart = Date.now();

    try {
      console.log('🔄 Starting ping cycle...');

      // Get websites that are ready to be pinged
      const now = new Date();
      console.log('🔍 Querying database for websites ready to ping...');
      
      const websites = await Website.find({
        $and: [
          {
            $or: [
              // Websites whose nextPingTime has arrived or passed
              { nextPingTime: { $lte: now } },
              // Websites that don't have a nextPingTime set yet (legacy data)
              { nextPingTime: { $exists: false } }
            ]
          },
          {
            $or: [
              // Websites that are not temporarily stopped
              { isTemporarilyStopped: { $ne: true } },
              { isTemporarilyStopped: { $exists: false } }
            ]
          }
        ]
      });
      
      console.log(`📊 Database query result: ${websites.length} website(s) ready for monitoring`);
      
      if (websites.length > 0) {
        console.log('🌐 Websites ready to monitor:');
        websites.forEach((site, index) => {
          const nextPing = site.nextPingTime ? site.nextPingTime.toLocaleString() : 'Not scheduled';
          const isStopped = site.isTemporarilyStopped ? ' (Temporarily Stopped)' : '';
          console.log(`   ${index + 1}. ${site.name} (${site.url}) - Status: ${site.status}, Next: ${nextPing}${isStopped}`);
        });
      } else {
        console.log('📭 No websites ready for monitoring at this time');
        
        // Check if any temporarily stopped websites should be resumed
        await this.checkAndResumeStoppedWebsites();
        return;
      }

      // Process websites sequentially to avoid overwhelming the browser
      for (const website of websites) {
        await this.pingWebsite(website);
        this.totalPingsCompleted++;
        
        // Small delay between pings to avoid being too aggressive
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Check if any temporarily stopped websites should be resumed
      await this.checkAndResumeStoppedWebsites();

      const cycleEnd = Date.now();
      const cycleDuration = ((cycleEnd - cycleStart) / 1000).toFixed(2);
      
      console.log(`✅ Ping cycle completed in ${cycleDuration}s`);
      
    } catch (error) {
      console.error('❌ Error during ping cycle:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  // Check and resume temporarily stopped websites
  async checkAndResumeStoppedWebsites() {
    try {
      const now = new Date();
      
      // Find websites that are temporarily stopped but their stopPingUntil time has passed
      const websitesToResume = await Website.find({
        isTemporarilyStopped: true,
        $or: [
          { stopPingUntil: { $lte: now } },
          { stopPingUntil: { $exists: false } }
        ]
      });
      
      if (websitesToResume.length > 0) {
        console.log(`🔄 Resuming monitoring for ${websitesToResume.length} website(s)`);
        
        for (const website of websitesToResume) {
          website.isTemporarilyStopped = false;
          website.stopPingUntil = null;
          
          // Use configurable ping interval (default 5 minutes)
          const pingIntervalMinutes = parseInt(process.env.PING_INTERVAL_MINUTES) || 5;
          website.nextPingTime = new Date(Date.now() + pingIntervalMinutes * 60 * 1000);
          await website.save();
          
          console.log(`✅ Resumed monitoring for ${website.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking stopped websites:', error.message);
    }
  }

  // Print worker statistics
  printStats() {
    const uptime = Date.now() - this.startTime.getTime();
    const uptimeMinutes = Math.floor(uptime / 60000);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const remainingMinutes = uptimeMinutes % 60;

    console.log('📈 Worker Statistics:');
    console.log(`   • Uptime: ${uptimeHours}h ${remainingMinutes}m`);
    console.log(`   • Total pings completed: ${this.totalPingsCompleted}`);
    console.log(`   • Current ping cycle: ${this.isRunning ? 'Running' : 'Idle'}`);
    console.log(`   • Browser status: ${this.browser ? 'Connected' : 'Disconnected'}`);
  }

  // Start the worker
  async start() {
    try {
      console.log('🚀 Starting Uptime Sentinel Ping Worker...');
      console.log('🚀 =====================================');

      // Initialize database connection
      await this.connectDB();

      // Initialize browser
      await this.initBrowser();

      // Setup cron job
      const cronExpression = process.env.PING_FREQUENCY_CRON || '*/1 * * * *'; // Changed default to every 1 minute for testing
      console.log(`⏰ Scheduling pings with cron: ${cronExpression}`);
      console.log('📝 Note: Using 1-minute intervals for testing. Set PING_FREQUENCY_CRON=*/5 * * * * for production.');

      cron.schedule(cronExpression, async () => {
        await this.runPingCycle();
      }, {
        scheduled: true,
        timezone: "UTC"
      });

      // Print statistics every hour
      cron.schedule('0 * * * *', () => {
        this.printStats();
      });

      // Run initial ping cycle
      setTimeout(async () => {
        console.log('🎬 Running initial ping cycle...');
        await this.runPingCycle();
      }, 5000); // Wait 5 seconds after startup

      console.log('✅ Ping Worker started successfully');
      console.log('🚀 =====================================');

    } catch (error) {
      console.error('❌ Failed to start Ping Worker:', error.message);
      process.exit(1);
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down Ping Worker...');

    try {
      // Wait for current ping cycle to finish
      if (this.isRunning) {
        console.log('⏳ Waiting for current ping cycle to finish...');
        while (this.isRunning) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Close browser
      if (this.browser) {
        await this.browser.close();
        console.log('✅ Browser closed');
      }

      // Close database connection
      await mongoose.connection.close();
      console.log('✅ Database connection closed');

      this.printStats();
      console.log('✅ Ping Worker shut down gracefully');

    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
    } finally {
      process.exit(0);
    }
  }
}

// Create worker instance
const worker = new PingWorker();

// Handle graceful shutdown
process.on('SIGTERM', () => worker.shutdown());
process.on('SIGINT', () => worker.shutdown());

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  worker.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  worker.shutdown();
});

// Start the worker
worker.start().catch(error => {
  console.error('❌ Fatal error starting worker:', error);
  process.exit(1);
});
