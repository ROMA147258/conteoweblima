const { getPool } = require('../../infrastructure/database/sqlServerPool');
const config = require('../../config/environment');

class HealthCheckUseCase {
  async execute() {
    let dbStatus = 'disconnected';
    let dbError = null;
    let tableStats = {};

    try {
      const pool = await getPool();
      if (pool && pool.connected) {
        dbStatus = 'connected';
        const res = await pool.request().query(`
          SELECT 
            (SELECT COUNT(*) FROM dbo.Votos_Detalle) AS votos,
            (SELECT COUNT(*) FROM dbo.Colegios) AS colegios,
            (SELECT COUNT(*) FROM dbo.Usuarios) AS usuarios,
            (SELECT COUNT(*) FROM dbo.Usuarios1) AS coordinadores,
            (SELECT COUNT(*) FROM dbo.Asistencia) AS asistencia
        `);
        tableStats = res.recordset[0] || {};
      }
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
        status: dbStatus,
        error: dbError,
        tableStats
      }
    };
  }
}

module.exports = HealthCheckUseCase;
