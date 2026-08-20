const { Pool } = require('pg');
const config = require('../../config/environment');

let pool = null;

function getPool() {
  if (!pool) {
    const pgConfig = config.db.url
      ? { connectionString: config.db.url, ssl: { rejectUnauthorized: false } }
      : {
          user: config.db.user,
          password: config.db.password,
          host: config.db.server,
          port: config.db.port,
          database: config.db.database,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          ssl: { rejectUnauthorized: false }
        };

    pool = new Pool(pgConfig);

    pool.on('error', (err) => {
      console.warn('⚠️ [PostgreSQL Pool Error]:', err.message);
    });

    pool.connect()
      .then(client => {
        console.log('\n======================================================');
        console.log(`✅ [PostgreSQL 16 - Neon] Conectado exitosamente a la BD "${config.db.database}".`);
        console.log('======================================================\n');
        client.release();
      })
      .catch(err => {
        console.warn('\n======================================================');
        console.warn(`❌ [PostgreSQL Error] No se pudo conectar a la BD "${config.db.database}":`);
        console.warn('   ' + err.message);
        console.warn('======================================================\n');
      });
  }
  return pool;
}

async function query(text, params = []) {
  const p = getPool();
  return p.query(text, params);
}

module.exports = {
  getPool,
  query
};
