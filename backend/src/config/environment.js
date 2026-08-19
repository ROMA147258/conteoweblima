const path = require('path');
const fs = require('fs');

// Cargar .env manualmente si no se utiliza dotenv
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  } catch (_) {}
}

const environment = {
  port: parseInt(process.env.PORT || '5181', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'conteo',
    user: process.env.DB_USER || 'data',
    password: process.env.DB_PASSWORD || 'TECNOlogia2026.$',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      requestTimeout: 30000,
      connectionTimeout: 15000
    }
  },
  auth: {
    adminUser: process.env.ADMIN_USER || 'admin',
    adminPass: process.env.ADMIN_PASS || 'admin2026',
    jwtSecret: process.env.JWT_SECRET || 'votoreal-lima-secret-key-2026'
  },
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

module.exports = environment;
