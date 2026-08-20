const express = require('express');
const path = require('path');
const config = require('./config/environment');
const corsMiddleware = require('./interfaces/middleware/corsMiddleware');
const errorHandler = require('./interfaces/middleware/errorHandler');
const createApiRouter = require('./interfaces/routes');
const { getPool } = require('./infrastructure/database/postgresPool');

const app = express();

// Middlewares globales
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  console.log('======================================================\n');

  try {
    getPool();
  } catch (e) {
    console.warn('⚠️  Nota: Conexión a PostgreSQL falló. Se reintentará en cada solicitud.');
  }
});

module.exports = { app, server };
