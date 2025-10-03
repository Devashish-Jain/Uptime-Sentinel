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

  async sendVerificationEmail(user, verificationToken) {
    if (!this.transporter) {
      console.error('❌ Email transporter not initialized');
      return false;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email credentials not configured, skipping verification email');
      return false;
    }

    try {
      const subject = 'Verify Your Email - Uptime Sentinel';
      const html = this.generateVerificationEmailTemplate(user, verificationToken);

      const mailOptions = {
        from: {
          name: 'Uptime Sentinel',
          address: process.env.EMAIL_USER
        },
        to: user.email,
        subject: subject,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Verification email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${user.email}:`, error.message);
      return false;
    }
  }

  generateVerificationEmailTemplate(user, verificationToken) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Uptime Sentinel</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: #0f172a;
                color: #e2e8f0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
            }
            .email-container {
                max-width: 600px;
                width: 100%;
                margin: 0 auto;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            }
            
            @media only screen and (max-width: 600px) {
                .email-container {
                    max-width: 100%;
                    margin: 0;
                    border-radius: 0;
                }
                
                .email-header {
                    padding: 1.5rem 1rem;
                }
                
                .email-body {
                    padding: 1.5rem 1rem;
                }
                
                .verification-section {
                    padding: 1.5rem 1rem;
                    margin: 1.5rem 0;
                }
                
                .verification-code {
                    font-size: 2rem;
                    letter-spacing: 0.3rem;
                    padding: 0.8rem 1.5rem;
                }
                
                .features {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .feature {
                    min-width: auto;
                    margin: 0;
                }
                
                .footer {
                    padding: 1rem;
                }
            }
            .email-header {
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                padding: 2rem;
                text-align: center;
            }
            .logo {
                font-size: 2rem;
                margin-bottom: 0.5rem;
            }
            .brand-name {
                font-size: 1.5rem;
                font-weight: bold;
                margin: 0;
                color: white;
            }
            .email-body {
                padding: 2rem;
            }
            .greeting {
                font-size: 1.25rem;
                margin-bottom: 1rem;
                color: #cbd5e1;
            }
            .message {
                margin-bottom: 2rem;
                color: #94a3b8;
                line-height: 1.6;
            }
            .verification-section {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                margin: 2rem 0;
            }
            .verification-code {
                font-size: 2.5rem;
                font-weight: bold;
                letter-spacing: 0.5rem;
                color: #3b82f6;
                font-family: 'Courier New', monospace;
                background: rgba(59, 130, 246, 0.2);
                padding: 1rem 2rem;
                border-radius: 8px;
                display: inline-block;
                margin: 1rem 0;
                border: 2px solid rgba(59, 130, 246, 0.4);
            }
            .verification-text {
                color: #cbd5e1;
                margin-bottom: 0.5rem;
            }
            .expiry-text {
                color: #f59e0b;
                font-size: 0.9rem;
                margin-top: 1rem;
            }
            .footer {
                background: rgba(15, 23, 42, 0.8);
                padding: 1.5rem 2rem;
                text-align: center;
                border-top: 1px solid rgba(59, 130, 246, 0.2);
            }
            .footer-text {
                color: #64748b;
                font-size: 0.9rem;
                margin: 0;
            }
            .features {
                display: flex;
                justify-content: space-around;
                margin: 2rem 0;
                flex-wrap: wrap;
            }
            .feature {
                text-align: center;
                flex: 1;
                min-width: 120px;
                margin: 0.5rem;
            }
            .feature-icon {
                font-size: 2rem;
                margin-bottom: 0.5rem;
            }
            .feature-text {
                font-size: 0.9rem;
                color: #94a3b8;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <div class="logo">📡</div>
                <h1 class="brand-name">Uptime Sentinel</h1>
            </div>
            
            <div class="email-body">
                <div class="greeting">
                    Welcome, ${user.firstName}! 👋
                </div>
                
                <div class="message">
                    Thank you for joining Uptime Sentinel! We're excited to help you monitor your websites with confidence.
                    <br><br>
                    To complete your registration and start monitoring your websites, please verify your email address by entering the verification code below:
                </div>
                
                <div class="verification-section">
                    <div class="verification-text">Your verification code is:</div>
                    <div class="verification-code">${verificationToken}</div>
                    <div class="expiry-text">⏰ This code expires in 5 minutes</div>
                </div>
                
                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">🔍</div>
                        <div class="feature-text">Real-time Monitoring</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">📊</div>
                        <div class="feature-text">Detailed Analytics</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">⚡</div>
                        <div class="feature-text">Fast & Reliable</div>
                    </div>
                </div>
                
                <div class="message">
                    Once verified, you'll be able to:
                    <ul style="color: #94a3b8; margin: 1rem 0;">
                        <li>Add unlimited websites to monitor</li>
                        <li>Get instant notifications for downtime</li>
                        <li>View detailed uptime statistics</li>
                        <li>Access historical performance data</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    If you didn't create this account, please ignore this email.
                    <br>
                    © ${new Date().getFullYear()} Uptime Sentinel. Built with ❤️ for reliable monitoring.
                </p>
            </div>
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
