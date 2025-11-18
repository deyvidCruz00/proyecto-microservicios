const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const emailLogService = require('./emailLogService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.sendgridInitialized = false;
    this.emailLogs = []; // En producción, esto debería ser una base de datos
    this.stats = {
      total_sent: 0,
      total_failed: 0,
      total_pending: 0
    };
    this.initialize();
  }

  async initialize() {
    console.log(`🔧 Inicializando email service con provider: ${config.EMAIL_PROVIDER}`);
    
    if (config.EMAIL_PROVIDER === 'sendgrid') {
      await this.initializeSendGrid();
    } else {
      await this.initializeSMTP();
    }
  }

  async initializeSendGrid() {
    try {
      if (!config.SENDGRID.API_KEY) {
        throw new Error('SENDGRID_API_KEY no configurado');
      }
      
      sgMail.setApiKey(config.SENDGRID.API_KEY);
      this.sendgridInitialized = true;
      console.log('✅ SendGrid configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando SendGrid:', error.message);
      console.log('🔄 Fallback a SMTP...');
      await this.initializeSMTP();
    }
  }

  async initializeSMTP() {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP.HOST,
        port: config.SMTP.PORT,
        secure: config.SMTP.SECURE,
        auth: {
          user: config.SMTP.USER,
          pass: config.SMTP.PASS
        }
      });

      // Verificar la conexión
      await this.transporter.verify();
      console.log('✅ Transporter SMTP configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando transporter SMTP:', error.message);
    }
  }

  async sendEmail({ to_email, to_name, subject, body, template_data, event_type, related_user_id, related_project_id }) {
    const emailId = uuidv4();
    const timestamp = new Date();

    try {
      // Procesar template si hay datos
      let processedBody = body;
      if (template_data && typeof template_data === 'object') {
        processedBody = this.processTemplate(body, template_data);
      }

      console.log(`📧 Enviando email a ${to_email} usando ${config.EMAIL_PROVIDER}...`);
      
      let info;
      if (config.EMAIL_PROVIDER === 'sendgrid' && this.sendgridInitialized) {
        info = await this.sendWithSendGrid({
          to_email,
          to_name,
          subject,
          body: processedBody
        });
      } else {
        info = await this.sendWithSMTP({
          to_email,
          to_name,
          subject,
          body: processedBody
        });
      }
      
      // Registro del email enviado
      const emailLog = {
        id: emailId,
        to_email,
        to_name,
        subject,
        status: 'sent',
        created_at: timestamp,
        sent_at: new Date(),
        message_id: info.messageId,
        provider: config.EMAIL_PROVIDER,
        event_type,
        related_user_id,
        related_project_id,
        error_message: null
      };

      this.emailLogs.unshift(emailLog);
      this.stats.total_sent++;
      
      // Registrar en base de datos
      await emailLogService.logEmail({
        to: to_email,
        subject,
        status: 'success',
        provider: config.EMAIL_PROVIDER
      });
      
      console.log(`✅ Email enviado exitosamente: ${emailId}`);
      console.log(`📨 Message ID: ${info.messageId}`);
      
      return emailLog;

    } catch (error) {
      console.error(`❌ Error enviando email: ${error.message}`);
      
      // Registro del email fallido
      const emailLog = {
        id: emailId,
        to_email,
        to_name,
        subject,
        status: 'failed',
        created_at: timestamp,
        sent_at: null,
        message_id: null,
        provider: config.EMAIL_PROVIDER,
        event_type,
        related_user_id,
        related_project_id,
        error_message: error.message
      };

      this.emailLogs.unshift(emailLog);
      this.stats.total_failed++;
      
      // Registrar en base de datos
      await emailLogService.logEmail({
        to: to_email,
        subject,
        status: 'failed',
        provider: config.EMAIL_PROVIDER,
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  async sendWithSendGrid({ to_email, to_name, subject, body }) {
    const msg = {
      to: to_name ? { email: to_email, name: to_name } : to_email,
      from: {
        email: config.SENDGRID.FROM_EMAIL,
        name: config.SENDGRID.FROM_NAME
      },
      subject: subject,
      html: this.formatEmailBody(body),
      text: body
    };

    const response = await sgMail.send(msg);
    return {
      messageId: response[0].headers['x-message-id'] || uuidv4(),
      response: response
    };
  }

  async sendWithSMTP({ to_email, to_name, subject, body }) {
    if (!this.transporter) {
      throw new Error('SMTP transporter no configurado');
    }

    const mailOptions = {
      from: `"${config.SMTP.FROM_NAME}" <${config.SMTP.FROM_EMAIL}>`,
      to: to_name ? `"${to_name}" <${to_email}>` : to_email,
      subject: subject,
      html: this.formatEmailBody(body),
      text: body
    };

    return await this.transporter.sendMail(mailOptions);
  }

  processTemplate(template, data) {
    let processed = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    }
    return processed;
  }

  formatEmailBody(body) {
    // Convertir saltos de línea a HTML
    return body.replace(/\n/g, '<br>');
  }

  getEmailLogs(limit = 50) {
    return this.emailLogs.slice(0, limit);
  }

  async getEmailLogsFromDB(options = {}) {
    return await emailLogService.getEmailLogs(options);
  }

  getStats() {
    return this.stats;
  }

  async getStatsFromDB() {
    return await emailLogService.getEmailStats();
  }

  getHealth() {
    return {
      status: 'healthy',
      service: config.SERVICE_NAME,
      email_provider: config.EMAIL_PROVIDER,
      sendgrid_configured: this.sendgridInitialized,
      smtp_configured: !!this.transporter,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new EmailService();