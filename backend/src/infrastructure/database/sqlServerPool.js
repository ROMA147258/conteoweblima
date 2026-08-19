const mssql = require('mssql');
const config = require('../../config/environment');

let pool = null;
let poolPromise = null;

async function getPool() {
  if (pool && pool.connected) {
    return pool;
  }

  if (!poolPromise) {
    poolPromise = new mssql.ConnectionPool(config.db)
      .connect()
      .then(p => {
        console.log(`✅ [SQL Server 2022] Conectado exitosamente a la BD "${config.db.database}" en ${config.db.server}`);
        pool = p;
        return p;
      })
      .catch(err => {
        poolPromise = null;
        console.error('❌ [SQL Server Error] Error al conectar a la base de datos:', err.message);
        throw err;
      });
  }

  return poolPromise;
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    poolPromise = null;
  }
}

module.exports = {
  getPool,
  closePool,
  mssql
};
