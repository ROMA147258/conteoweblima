const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/environment');
const corsMiddleware = require('./interfaces/middleware/corsMiddleware');
const errorHandler = require('./interfaces/middleware/errorHandler');
const createApiRouter = require('./interfaces/routes');
const { getPool } = require('./infrastructure/database/postgresPool');
const telemetry = require('./infrastructure/config/telemetry');
const alertService = require('./infrastructure/services/AlertNotificationService');

const app = express();

// Confianza en proxies inversos (Cloudflare, Vercel, Render, Nginx) para obtener IPs reales
app.set('trust proxy', 1);

// 1. Cabeceras de seguridad HTTP con Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 2. Limitador contra Fuerza Bruta en Login (Máximo 10 intentos cada 15 minutos por IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res, next, options) => {
    alertService.notifySecurityIncident('BLOQUEO_FUERZA_BRUTA_LOGIN', {
      ip: req.ip,
      path: req.originalUrl,
      headers: req.headers['user-agent']
    }).catch(() => {});
    res.status(options.statusCode).json(options.message);
  },
  message: {
    success: false,
    message: 'Demasiados intentos de acceso fallidos. Por seguridad, intente de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Limitador General para la API (Máximo 300 peticiones por minuto por IP)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Límite de solicitudes alcanzado. Por favor, espere un momento antes de continuar.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares globales
app.use(corsMiddleware);
app.use('/api/auth/login', authLimiter);
app.use('/api', generalLimiter);

// Límite controlado de body para prevenir ataques de saturación de memoria (DoS)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Rutas de API
app.use('/api', createApiRouter());

// Servir frontend si existe build estático
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Fallback para React Router en producción
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  const indexHtml = path.join(frontendDist, 'index.html');
  res.sendFile(indexHtml, err => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Voto Real - API Server</title></head>
          <body style="font-family:sans-serif;text-align:center;padding:50px;">
            <h2>🗳️ Voto Real Lima - Servidor API Activo</h2>
            <p>Backend ejecutándose en puerto <strong>${config.port}</strong></p>
            <p>Conectado a Base de Datos: <strong>PostgreSQL (Neon)</strong></p>
          </body>
        </html>
      `);
    }
  });
});

// Middleware centralizado de errores
app.use(errorHandler);

// Arrancar servidor y probar conexión a PostgreSQL
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log(`🗳️  VOTO REAL LIMA - BACKEND API (PostgreSQL / Neon)`);
  console.log(`📡  Puerto: ${config.port}`);
  console.log(`🌍  Endpoint Base: http://localhost:${config.port}/api`);
  console.log(`❤️   Health Check:  http://localhost:${config.port}/api/health`);
  console.log(`📧  Alertas Activas: ${config.alert.recipient}`);
  console.log(`📊  Telemetría:    Activa [${telemetry.serviceName}]`);
  console.log('======================================================\n');

  try {
    getPool();
    alertService.notifyServerStartup(config.port, 'CONNECTED').catch(() => {});
  } catch (e) {
    console.warn('⚠️  Nota: Conexión a PostgreSQL falló. Se reintentará en cada solicitud.');
    alertService.notifyDatabaseError(e).catch(() => {});
  }
});

module.exports = { app, server };
