const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const websiteRoutes = require('./routes/websites');
const pingRoutes = require('./routes/ping');
const authRoutes = require('./routes/auth');

// Import services
const dbInitService = require('./services/dbInitService');
const emailService = require('./services/emailService');
const websocketManager = require('./websocket');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration - dynamic based on environment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL_DEV || 'http://localhost:5173',
      process.env.CLIENT_URL_DEV_ALT || 'http://localhost:5174',
      process.env.CLIENT_URL_PROD || 'https://uptime-sentinel-frontend.onrender.com',
      process.env.CLIENT_URL_CUSTOM, // For custom domains
      process.env.CLIENT_URL_STAGING // For staging environments
    ].filter(Boolean); // Remove undefined values

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      console.log('📋 Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// MongoDB connection function
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(mongoURI, {
      // Modern MongoDB connection options
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Initialize database structure
    await dbInitService.initializeDatabase();
    
    // Test email service connection
    await emailService.testConnection();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB Disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB Reconnected');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/ping', pingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Uptime Sentinel API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0',
    uptime: process.uptime(),
    cors: {
      allowedOrigins: [
        process.env.CLIENT_URL_DEV || 'http://localhost:5173',
        process.env.CLIENT_URL_DEV_ALT || 'http://localhost:5174',
        process.env.CLIENT_URL_PROD || 'https://uptime-sentinel-frontend.onrender.com',
        process.env.CLIENT_URL_CUSTOM,
        process.env.CLIENT_URL_STAGING
      ].filter(Boolean)
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }
    
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
  });
}

// API routes are handled above

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed.');
    process.exit(0);
  });
});

// Connect to database and start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log('🚀 =================================');
      console.log(`🚀   Server running on port ${PORT}`);
      console.log(`🚀   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀   API: http://localhost:${PORT}/api`);
      console.log(`🚀   WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`🚀   Health: http://localhost:${PORT}/api/health`);
      console.log('🚀 =================================');
    });
    
    // Initialize WebSocket server
    websocketManager.initialize(server);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
