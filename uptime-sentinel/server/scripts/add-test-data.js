const mongoose = require('mongoose');
require('dotenv').config();

// Import Website model
const Website = require('../models/Website');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const generatePingHistory = (count = 50) => {
  const history = [];
  const now = new Date();
  
  for (let i = count; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000)); // Every 5 minutes
    
    // Simulate different scenarios
    let statusCode, duration;
    
    if (Math.random() < 0.85) { // 85% success rate
      statusCode = 200;
      duration = Math.floor(Math.random() * 500) + 100; // 100-600ms
    } else if (Math.random() < 0.5) {
      statusCode = 0; // Network error
      duration = 30000; // Timeout
    } else {
      statusCode = [404, 500, 502, 503][Math.floor(Math.random() * 4)]; // Various errors
      duration = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
    }
    
    history.push({
      timestamp,
      statusCode,
      duration
    });
  }
  
  return history;
};

const addTestData = async () => {
  try {
    console.log('🧪 Adding test data...');
    
    // Check if test data already exists
    const existingWebsites = await Website.find({ email: 'test@example.com' });
    if (existingWebsites.length > 0) {
      console.log('🔄 Test data already exists, removing old data first...');
      await Website.deleteMany({ email: 'test@example.com' });
    }
    
    // Create test websites
    const testWebsites = [
      {
        name: 'Google',
        url: 'https://www.google.com',
        email: 'test@example.com',
        status: 'UP',
        lastChecked: new Date(),
        consecutiveFailures: 0,
        pingHistory: generatePingHistory(75)
      },
      {
        name: 'GitHub',
        url: 'https://github.com',
        email: 'test@example.com',
        status: 'UP',
        lastChecked: new Date(),
        consecutiveFailures: 0,
        pingHistory: generatePingHistory(60)
      },
      {
        name: 'Example API',
        url: 'https://api.example.com/health',
        email: 'test@example.com',
        status: 'DOWN',
        lastChecked: new Date(),
        consecutiveFailures: 5,
        pingHistory: generatePingHistory(40).map(ping => ({
          ...ping,
          statusCode: Math.random() < 0.3 ? 200 : (Math.random() < 0.5 ? 0 : 500) // More failures
        }))
      },
      {
        name: 'Demo Website',
        url: 'https://demo.website.com',
        email: 'test@example.com',
        status: 'PENDING',
        lastChecked: null,
        consecutiveFailures: 0,
        pingHistory: generatePingHistory(20)
      }
    ];
    
    // Insert test websites
    for (const websiteData of testWebsites) {
      const website = new Website(websiteData);
      await website.save();
      console.log(`✅ Added test website: ${websiteData.name}`);
    }
    
    console.log(`🎉 Successfully added ${testWebsites.length} test websites with ping history`);
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

const main = async () => {
  await connectDB();
  await addTestData();
};

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
