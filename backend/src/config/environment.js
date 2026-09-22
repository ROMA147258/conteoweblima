const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const environment = {
  port: parseInt(process.env.PORT, 10) || 5182,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  db: {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_DATABASE || process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    url: process.env.DATABASE_URL
  },

  auth: {
    adminUser: process.env.ADMIN_USER,
    adminPass: process.env.ADMIN_PASS,
    jwtSecret: process.env.JWT_SECRET
  },

  alert: {
    recipient: process.env.ALERT_RECIPIENT_EMAIL || 'ricardo27romax@outlook.com',
    enabled: process.env.ALERT_ENABLED !== 'false',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: process.env.SMTP_SECURE === 'true'
  }
};

module.exports = environment;
