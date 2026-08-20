const { getPool, query } = require('../../infrastructure/database/postgresPool');
const config = require('../../config/environment');

class HealthCheckUseCase {
  async execute() {
    let dbStatus = 'disconnected';
    let dbError = null;
    let tableStats = {};

    try {
      const res = await query(`
        SELECT 
          (SELECT COUNT(*) FROM votos_detalle) AS votos,
          (SELECT COUNT(*) FROM colegios) AS colegios,
          (SELECT COUNT(*) FROM usuarios) AS usuarios,
          (SELECT COUNT(*) FROM usuarios1) AS coordinadores,
          (SELECT COUNT(*) FROM asistencia) AS asistencia
      `);
      dbStatus = 'connected';
      tableStats = res.rows[0] || {};
    } catch (err) {
      dbStatus = 'error';
      dbError = err.message;
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      server: {
        port: config.port,
        nodeVersion: process.version,
        uptime: process.uptime()
      },
      database: {
        server: config.db.server,
        database: config.db.database,
        type: 'PostgreSQL (Neon)',
        status: dbStatus,
        error: dbError,
        tableStats
      }
    };
  }
}

module.exports = HealthCheckUseCase;
