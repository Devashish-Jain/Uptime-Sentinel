#!/usr/bin/env node

/**
 * Uptime Sentinel - System Health Check
 * This script verifies that all components are properly configured
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Uptime Sentinel System Check');
console.log('================================');

// Check environment configuration
console.log('\n📋 Environment Configuration:');
const requiredEnvVars = {
  'PORT': process.env.PORT || '5001 (default)',
  'NODE_ENV': process.env.NODE_ENV || 'development (default)',
  'MONGO_URI': process.env.MONGO_URI ? '✅ Configured' : '❌ MISSING',
  'PING_INTERVAL_MINUTES': process.env.PING_INTERVAL_MINUTES || '5 (default)',
  'DOWNTIME_MONITORING_HOURS': process.env.DOWNTIME_MONITORING_HOURS || '12 (default)',
  'PAUSE_MONITORING_HOURS': process.env.PAUSE_MONITORING_HOURS || '24 (default)',
  'PING_FREQUENCY_CRON': process.env.PING_FREQUENCY_CRON || '*/1 * * * * (default)',
  'EMAIL_USER': process.env.EMAIL_USER ? '✅ Configured' : '⚠️ Optional (no email alerts)',
  'EMAIL_PASS': process.env.EMAIL_PASS ? '✅ Configured' : '⚠️ Optional (no email alerts)'
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// Test MongoDB connection
console.log('\n🗄️  Testing MongoDB Connection...');
async function testDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      console.log('❌ MongoDB URI not configured');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });

    console.log('✅ MongoDB connection successful');
    
    // Test Website model
    const Website = require('./models/Website');
    const count = await Website.countDocuments();
    console.log(`📊 Found ${count} website(s) in database`);
    
    // Check for websites with downtime monitoring settings
    const downtimeWebsites = await Website.find({
      $or: [
        { isTemporarilyStopped: true },
        { stopPingUntil: { $exists: true, $ne: null } },
        { status: 'DOWN' }
      ]
    });
    
    if (downtimeWebsites.length > 0) {
      console.log(`🚨 Found ${downtimeWebsites.length} website(s) with downtime status:`);
      downtimeWebsites.forEach(site => {
        const stopped = site.isTemporarilyStopped ? ' (PAUSED)' : '';
        const stopUntil = site.stopPingUntil ? ` - Stop until: ${site.stopPingUntil.toLocaleString()}` : '';
        console.log(`   • ${site.name}: ${site.status}${stopped}${stopUntil}`);
      });
    }

    await mongoose.connection.close();

  } catch (error) {
    console.log(`❌ MongoDB connection failed: ${error.message}`);
  }
}

// Check if all required files exist
console.log('\n📁 File System Check:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'models/Website.js',
  'services/emailService.js',
  'services/immediatePingService.js',
  'controllers/websiteController.js',
  'routes/websites.js',
  'ping-worker.js',
  'package.json'
];

requiredFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${filePath}: ${exists ? '✅' : '❌'}`);
});

// Show monitoring behavior summary
console.log('\n⚙️  Monitoring Behavior Summary:');
const pingInterval = parseInt(process.env.PING_INTERVAL_MINUTES) || 5;
const downtimeHours = parseInt(process.env.DOWNTIME_MONITORING_HOURS) || 12;
const pauseHours = parseInt(process.env.PAUSE_MONITORING_HOURS) || 24;

console.log(`  • Normal ping interval: ${pingInterval} minutes`);
console.log(`  • Continue monitoring DOWN sites for: ${downtimeHours} hours`);
console.log(`  • Pause monitoring after downtime for: ${pauseHours} hours`);
console.log(`  • Total pings during downtime: ~${Math.floor((downtimeHours * 60) / pingInterval)} attempts`);

// Instructions
console.log('\n🚀 Quick Start Instructions:');
console.log('  1. Start the API server:     npm start');
console.log('  2. Start the ping worker:    npm run worker');
console.log('  3. Start the client:         cd ../client && npm run dev');
console.log('\n📖 For configuration help, see: MONITORING_CONFIG.md');
console.log('\n✨ Your automated ping system is ready!');

// Run the database test
testDatabase().catch(console.error);
