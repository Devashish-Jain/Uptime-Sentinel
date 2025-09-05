const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  async sendDowntimeAlert(website, failureDetails) {
    if (!this.transporter) {
      console.error('❌ Email transporter not initialized');
      return false;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email credentials not configured, skipping email notification');
      return false;
    }

    try {
      const subject = `🚨 ALERT: ${website.name} is DOWN`;
      const html = this.generateDowntimeEmailTemplate(website, failureDetails);

      const mailOptions = {
        from: {
          name: 'Uptime Sentinel',
          address: process.env.EMAIL_USER
        },
        to: website.email,
        subject: subject,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Downtime alert sent to ${website.email} for ${website.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send downtime alert for ${website.name}:`, error.message);
      return false;
    }
  }

  async sendRecoveryNotification(website) {
    if (!this.transporter) {
      console.error('❌ Email transporter not initialized');
      return false;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email credentials not configured, skipping recovery notification');
      return false;
    }

    try {
      const subject = `✅ RECOVERED: ${website.name} is back online`;
      const html = this.generateRecoveryEmailTemplate(website);

      const mailOptions = {
        from: {
          name: 'Uptime Sentinel',
          address: process.env.EMAIL_USER
        },
        to: website.email,
        subject: subject,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Recovery notification sent to ${website.email} for ${website.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send recovery notification for ${website.name}:`, error.message);
      return false;
    }
  }

  generateDowntimeEmailTemplate(website, failureDetails) {
    const timestamp = new Date().toLocaleString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Down Alert</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #ef4444, #dc2626); 
          color: white; 
          padding: 30px; 
          border-radius: 8px; 
          text-align: center; 
          margin-bottom: 20px; 
        }
        .content { 
          background: #f9fafb; 
          padding: 30px; 
          border-radius: 8px; 
          border-left: 4px solid #ef4444; 
        }
        .details { 
          background: white; 
          padding: 20px; 
          border-radius: 6px; 
          margin: 20px 0; 
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px solid #e5e7eb; 
        }
        .detail-row:last-child { 
          border-bottom: none; 
        }
        .footer { 
          text-align: center; 
          color: #6b7280; 
          margin-top: 30px; 
          font-size: 14px; 
        }
        .status-badge { 
          background: #ef4444; 
          color: white; 
          padding: 4px 12px; 
          border-radius: 12px; 
          font-size: 12px; 
          font-weight: 600; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Website Down Alert</h1>
        <p>Your monitored website is currently unreachable</p>
      </div>
      
      <div class="content">
        <h2>Alert Details</h2>
        <p>We've detected that your website <strong>${website.name}</strong> is currently down after ${website.consecutiveFailures} consecutive failed checks.</p>
        
        <div class="details">
          <div class="detail-row">
            <strong>Website Name:</strong>
            <span>${website.name}</span>
          </div>
          <div class="detail-row">
            <strong>URL:</strong>
            <span>${website.url}</span>
          </div>
          <div class="detail-row">
            <strong>Status:</strong>
            <span class="status-badge">DOWN</span>
          </div>
          <div class="detail-row">
            <strong>Consecutive Failures:</strong>
            <span>${website.consecutiveFailures}</span>
          </div>
          <div class="detail-row">
            <strong>Last Checked:</strong>
            <span>${timestamp}</span>
          </div>
          <div class="detail-row">
            <strong>Error Details:</strong>
            <span>${failureDetails.error || 'Connection failed'}</span>
          </div>
          <div class="detail-row">
            <strong>Response Time:</strong>
            <span>${failureDetails.duration}ms</span>
          </div>
        </div>
        
        <h3>What's Next?</h3>
        <ul>
          <li>Check your website manually to confirm the issue</li>
          <li>Contact your hosting provider if needed</li>
          <li>We'll continue monitoring and notify you when it's back online</li>
        </ul>
      </div>
      
      <div class="footer">
        <p>This alert was sent by Uptime Sentinel</p>
        <p>Monitoring made simple • Built with ❤️</p>
      </div>
    </body>
    </html>
    `;
  }

  generateRecoveryEmailTemplate(website) {
    const timestamp = new Date().toLocaleString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Recovered</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #10b981, #059669); 
          color: white; 
          padding: 30px; 
          border-radius: 8px; 
          text-align: center; 
          margin-bottom: 20px; 
        }
        .content { 
          background: #f0fdf4; 
          padding: 30px; 
          border-radius: 8px; 
          border-left: 4px solid #10b981; 
        }
        .details { 
          background: white; 
          padding: 20px; 
          border-radius: 6px; 
          margin: 20px 0; 
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px solid #e5e7eb; 
        }
        .detail-row:last-child { 
          border-bottom: none; 
        }
        .footer { 
          text-align: center; 
          color: #6b7280; 
          margin-top: 30px; 
          font-size: 14px; 
        }
        .status-badge { 
          background: #10b981; 
          color: white; 
          padding: 4px 12px; 
          border-radius: 12px; 
          font-size: 12px; 
          font-weight: 600; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Website Recovered</h1>
        <p>Your website is back online and responding normally</p>
      </div>
      
      <div class="content">
        <h2>Recovery Confirmation</h2>
        <p>Great news! Your website <strong>${website.name}</strong> is now back online and responding to our monitoring checks.</p>
        
        <div class="details">
          <div class="detail-row">
            <strong>Website Name:</strong>
            <span>${website.name}</span>
          </div>
          <div class="detail-row">
            <strong>URL:</strong>
            <span>${website.url}</span>
          </div>
          <div class="detail-row">
            <strong>Status:</strong>
            <span class="status-badge">ONLINE</span>
          </div>
          <div class="detail-row">
            <strong>Recovery Time:</strong>
            <span>${timestamp}</span>
          </div>
        </div>
        
        <p>We'll continue monitoring your website 24/7 and notify you of any future issues.</p>
      </div>
      
      <div class="footer">
        <p>This notification was sent by Uptime Sentinel</p>
        <p>Monitoring made simple • Built with ❤️</p>
      </div>
    </body>
    </html>
    `;
  }

  async testConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
