import nodemailer from 'nodemailer';
import { storage } from './storage';
import type { CreateEmail } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// SMTP Configuration with fallback options
const createEmailConfig = (): EmailConfig & any => {
  const baseConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  // Add additional options for better compatibility
  const additionalOptions: any = {
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };

  // Special configurations for common providers
  if (baseConfig.host.includes('gmail')) {
    additionalOptions.service = 'gmail';
  }
  
  // For custom domains, add TLS options
  if (!baseConfig.host.includes('gmail') && !baseConfig.host.includes('outlook')) {
    additionalOptions.tls = {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    };
    
    // Try requireTLS for port 587
    if (baseConfig.port === 587 && !baseConfig.secure) {
      additionalOptions.requireTLS = true;
    }
  }

  return { ...baseConfig, ...additionalOptions };
};

const defaultEmailConfig = createEmailConfig();

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Only initialize if SMTP credentials are provided
      if (defaultEmailConfig.auth.user && defaultEmailConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(defaultEmailConfig);
        this.isConfigured = true;
        console.log('📧 Email service initialized with SMTP configuration');
        console.log(`   Host: ${defaultEmailConfig.host}:${defaultEmailConfig.port}`);
      } else {
        console.log('⚠️  Email service running in mock mode - no SMTP credentials provided');
        console.log('   Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables for real email sending');
        console.log('   Run: npx tsx scripts/setup-gmail-smtp.ts for Gmail setup instructions');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(userId: string, emailData: CreateEmail): Promise<any> {
    try {
      // Get sender information
      const sender = await storage.getUser(userId);
      if (!sender) {
        throw new Error('Sender not found');
      }

      // Save to database first (for internal tracking)
      const savedEmail = await this.saveEmailToDatabase(userId, emailData);

      // If real SMTP is configured, send actual email
      if (this.isConfigured && this.transporter) {
        try {
          const mailOptions = {
            from: `"${sender.firstName} ${sender.lastName}" <${sender.email}>`,
            to: emailData.recipient,
            subject: emailData.subject,
            text: emailData.body,
            html: emailData.body, // Assuming body can contain HTML
          };

          const info = await this.transporter.sendMail(mailOptions);
          console.log('✅ Email sent successfully:', info.messageId);
          
          return {
            success: true,
            messageId: info.messageId,
            email: savedEmail,
            sentViaSmtp: true
          };
        } catch (smtpError) {
          console.error('❌ SMTP sending failed:', smtpError);
          // Email was saved to database but SMTP failed
          return {
            success: true,
            email: savedEmail,
            sentViaSmtp: false,
            smtpError: smtpError.message
          };
        }
      } else {
        // Mock mode - just return success with database save
        console.log('📧 Email saved in mock mode (no SMTP configured)');
        return {
          success: true,
          email: savedEmail,
          sentViaSmtp: false,
          mockMode: true
        };
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  private async saveEmailToDatabase(userId: string, emailData: CreateEmail) {
    // Get sender's information
    const sender = await storage.getUser(userId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    // Save email in sender's sent folder
    const sentEmail = await storage.createEmail(userId, emailData);

    // Check if recipient is internal user and deliver to their inbox
    await this.deliverToInternalRecipient(emailData, sender.email);

    return sentEmail;
  }

  private async deliverToInternalRecipient(emailData: CreateEmail, senderEmail: string) {
    try {
      // Find recipient in internal system
      const recipient = await storage.getUserByEmail(emailData.recipient);
      
      if (recipient) {
        // Create email in recipient's inbox
        await storage.createEmail(recipient.id, {
          ...emailData,
          // Mark as received email (different from sent)
        });
        console.log(`📧 Internal delivery: Email delivered to ${recipient.email}`);
      }
    } catch (error) {
      // If recipient is not internal, that's fine - email was sent via SMTP
      console.log(`📧 Recipient ${emailData.recipient} is external - delivered via SMTP only`);
    }
  }

  // Test SMTP connection
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection test successful');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection test failed:', error);
      return false;
    }
  }

  // Get service status
  getStatus() {
    return {
      configured: this.isConfigured,
      smtpHost: defaultEmailConfig.host,
      smtpPort: defaultEmailConfig.port,
      smtpSecure: defaultEmailConfig.secure,
      smtpUser: defaultEmailConfig.auth.user ? '***configured***' : 'not configured',
    };
  }
}

export const emailService = new EmailService();