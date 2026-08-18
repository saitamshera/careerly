const nodemailer = require('nodemailer');
const { env } = require('../config/env');

function isMailerConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function getTransporter() {
  if (!isMailerConfigured()) {
    return null;
  }

  const port = env.SMTP_PORT || 587;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: env.NODE_ENV === 'production'
    }
  });
}

async function sendMail({ to, subject, text, html }) {
  if (!isMailerConfigured()) {
    console.error('[Mailer] Delivery aborted: SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured.');
    return {
      success: false,
      error: 'Email service is not configured on the server. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env.'
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'Failed to initialize SMTP email transporter.'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM || `Careerly <${env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('[Mailer] SMTP delivery failure:', {
      recipientDomain: to ? to.split('@')[1] : 'unknown',
      errorMessage: error.message,
      errorCode: error.code
    });

    return {
      success: false,
      error: `Email delivery failed: ${error.message || 'SMTP server rejected message'}`
    };
  }
}

module.exports = { sendMail, isMailerConfigured };