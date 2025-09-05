/**
 * Configuration Service
 * 
 * Centralized configuration management for the Uptime Sentinel application.
 * This service provides access to all configurable parameters with proper
 * defaults and validation.
 */

class ConfigService {
  constructor() {
    // Load environment variables once during initialization
    this.config = {
      // Server Configuration
      port: parseInt(process.env.PORT) || 5001,
      nodeEnv: process.env.NODE_ENV || 'development',
      
      // Database Configuration
      mongoUri: process.env.MONGO_URI,
      
      // CORS Configuration
      clientUrlDev: process.env.CLIENT_URL_DEV || 'http://localhost:5173',
      clientUrlProd: process.env.CLIENT_URL_PROD || 'https://uptime-sentinel.onrender.com',
      
      // Ping Configuration
      pingFrequencyCron: process.env.PING_FREQUENCY_CRON || '*/5 * * * *', // Default: every 5 minutes
      pingIntervalMinutes: parseInt(process.env.PING_INTERVAL_MINUTES) || 5,
      
      // Downtime Monitoring Configuration
      downtimeMonitoringHours: parseInt(process.env.DOWNTIME_MONITORING_HOURS) || 12,
      pauseMonitoringHours: parseInt(process.env.PAUSE_MONITORING_HOURS) || 24,
      
      // Email Configuration
      emailUser: process.env.EMAIL_USER,
      emailPass: process.env.EMAIL_PASS,
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT) || 587,
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      smtpFromName: process.env.SMTP_FROM_NAME || 'Uptime Sentinel',
      smtpFromEmail: process.env.SMTP_FROM_EMAIL,
    };
    
    this.validateConfig();
  }
  
  /**
   * Validate required configuration values
   */
  validateConfig() {
    const required = ['mongoUri'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }
  
  /**
   * Get server configuration
   */
  getServerConfig() {
    return {
      port: this.config.port,
      nodeEnv: this.config.nodeEnv,
      clientUrlDev: this.config.clientUrlDev,
      clientUrlProd: this.config.clientUrlProd
    };
  }
  
  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return {
      mongoUri: this.config.mongoUri
    };
  }
  
  /**
   * Get ping configuration with helper methods
   */
  getPingConfig() {
    return {
      frequencyCron: this.config.pingFrequencyCron,
      intervalMinutes: this.config.pingIntervalMinutes,
      intervalMs: this.config.pingIntervalMinutes * 60 * 1000,
      downtimeMonitoringHours: this.config.downtimeMonitoringHours,
      downtimeMonitoringMs: this.config.downtimeMonitoringHours * 60 * 60 * 1000,
      pauseMonitoringHours: this.config.pauseMonitoringHours,
      pauseMonitoringMs: this.config.pauseMonitoringHours * 60 * 60 * 1000
    };
  }
  
  /**
   * Get email configuration
   */
  getEmailConfig() {
    return {
      user: this.config.emailUser || this.config.smtpUser,
      pass: this.config.emailPass || this.config.smtpPass,
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      fromName: this.config.smtpFromName,
      fromEmail: this.config.smtpFromEmail || this.config.emailUser || this.config.smtpUser
    };
  }
  
  /**
   * Get a specific configuration value
   */
  get(key) {
    return this.config[key];
  }
  
  /**
   * Get all configuration (for debugging - be careful not to log sensitive data)
   */
  getAllConfig(includeSensitive = false) {
    if (includeSensitive) {
      return { ...this.config };
    }
    
    // Return config without sensitive information
    const { emailPass, smtpPass, mongoUri, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      mongoUri: mongoUri ? '[CONFIGURED]' : '[NOT SET]',
      emailPass: emailPass ? '[CONFIGURED]' : '[NOT SET]',
      smtpPass: smtpPass ? '[CONFIGURED]' : '[NOT SET]'
    };
  }
  
  /**
   * Log configuration summary
   */
  logConfigSummary() {
    const config = this.getAllConfig(false);
    const pingConfig = this.getPingConfig();
    
    console.log('⚙️  Configuration Summary:');
    console.log(`   • Environment: ${config.nodeEnv}`);
    console.log(`   • Server Port: ${config.port}`);
    console.log(`   • MongoDB: ${config.mongoUri}`);
    console.log(`   • Ping Interval: ${pingConfig.intervalMinutes} minutes`);
    console.log(`   • Downtime Monitoring: ${pingConfig.downtimeMonitoringHours} hours`);
    console.log(`   • Pause Monitoring: ${pingConfig.pauseMonitoringHours} hours`);
    console.log(`   • Ping Frequency: ${pingConfig.frequencyCron}`);
    console.log(`   • Email Service: ${config.emailUser ? '[CONFIGURED]' : '[NOT SET]'}`);
  }
}

// Export singleton instance
module.exports = new ConfigService();
