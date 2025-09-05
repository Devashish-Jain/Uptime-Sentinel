const puppeteer = require('puppeteer');

class ImmediatePingService {
  constructor() {
    this.browser = null;
  }

  // Initialize a single browser instance for immediate pings
  async initBrowser() {
    if (this.browser) {
      return this.browser;
    }

    try {
      console.log('🔧 Initializing immediate ping browser...');
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        defaultViewport: {
          width: 1280,
          height: 720
        }
      });

      console.log('✅ Immediate ping browser initialized');
      return this.browser;
    } catch (error) {
      console.error('❌ Failed to initialize immediate ping browser:', error.message);
      throw error;
    }
  }

  // Perform immediate ping on a website
  async pingWebsite(website) {
    let context = null;
    let page = null;
    const startTime = Date.now();

    try {
      console.log(`🏃 Immediate ping: ${website.name} (${website.url})`);

      // Ensure browser is initialized
      const browser = await this.initBrowser();

      // Create isolated browser context
      context = await browser.createBrowserContext();
      page = await context.newPage();

      // Enable request interception for faster loading
      await page.setRequestInterception(true);

      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const blockedTypes = ['image', 'stylesheet', 'font', 'media', 'other'];
        
        if (blockedTypes.includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Set user agent and timeouts
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 UptimeSentinel/1.0'
      );
      
      await page.setDefaultTimeout(15000); // Shorter timeout for immediate pings
      await page.setDefaultNavigationTimeout(15000);

      // Navigate to the website
      console.log(`🌍 Navigating to: ${website.url}`);
      const response = await page.goto(website.url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      const statusCode = response ? response.status() : 0;
      
      // Check if it's healthy
      let isHealthy = false;
      if (response && statusCode >= 200 && statusCode < 400) {
        try {
          if (website.url.includes('/health') || website.url.includes('/status')) {
            const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
            isHealthy = pageText.includes('ok') || 
                       pageText.includes('success') || 
                       pageText.includes('healthy') ||
                       pageText.includes('up') ||
                       (statusCode >= 200 && statusCode < 300);
            console.log(`🩺 Immediate health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'} (${statusCode})`);
          } else {
            isHealthy = statusCode >= 200 && statusCode < 400;
          }
        } catch (error) {
          console.log(`⚠️ Error checking page content: ${error.message}`);
          isHealthy = statusCode >= 200 && statusCode < 400;
        }
      }

      if (isHealthy) {
        console.log(`✅ ${website.name}: ${statusCode} (${duration}ms) - HEALTHY`);
        
        // Reset failure count and email notification flag
        website.consecutiveFailures = 0;
        website.emailNotificationSent = false;
        
        // Update website with ping result
        await website.addPingResult(statusCode, duration);
      } else {
        throw new Error(`Health check failed - Status: ${statusCode}, Response indicates unhealthy state`);
      }

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`❌ ${website.name}: FAILED (${duration}ms) - ${error.message}`);

      // Increment consecutive failures
      website.consecutiveFailures += 1;
      
      // Record failure with status code 0
      await website.addPingResult(0, duration);

    } finally {
      // Clean up resources
      try {
        if (page) await page.close();
        if (context) await context.close();
      } catch (cleanupError) {
        console.error('⚠️ Immediate ping cleanup error:', cleanupError.message);
      }
    }
  }

  // Close the browser when shutting down
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        console.log('✅ Immediate ping browser closed');
      } catch (error) {
        console.error('❌ Error closing immediate ping browser:', error.message);
      }
    }
  }
}

// Export a singleton instance
module.exports = new ImmediatePingService();
