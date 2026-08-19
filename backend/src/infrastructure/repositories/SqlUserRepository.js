const { getPool, mssql } = require('../database/sqlServerPool');

class SqlUserRepository {
  async findByDniOrName(dni, name) {
    const pool = await getPool();
    const rawDni = (dni || '').trim();
    const rawName = (name || '').trim();

    if (!rawDni && !rawName) return null;

    let req = pool.request();
    let whereClause = '';

    if (rawDni && rawName) {
      whereClause = 'dni = @dni AND nombre LIKE @nombre';
      req.input('dni', mssql.VarChar, rawDni);
      req.input('nombre', mssql.VarChar, `%${rawName}%`);
    } else if (rawDni) {
      whereClause = 'dni = @dni';
      req.input('dni', mssql.VarChar, rawDni);
    } else {
      whereClause = 'nombre LIKE @nombre';
      req.input('nombre', mssql.VarChar, `%${rawName}%`);
    }

    // 1. Buscar en Usuarios (Personeros)
    let res = await req.query(`SELECT TOP 1 * FROM dbo.Usuarios WHERE ${whereClause}`);
    if (res.recordset.length > 0) {
      const u = res.recordset[0];
      u.origenHoja = 'Usuarios';
      return u;
    }

    // 2. Buscar en Usuarios1 (Coordinadores)
    req = pool.request();
    if (rawDni && rawName) {
      req.input('dni', mssql.VarChar, rawDni);
      req.input('nombre', mssql.VarChar, `%${rawName}%`);
    } else if (rawDni) {
      req.input('dni', mssql.VarChar, rawDni);
    } else {
      req.input('nombre', mssql.VarChar, `%${rawName}%`);
    }

    res = await req.query(`SELECT TOP 1 * FROM dbo.Usuarios1 WHERE ${whereClause}`);
    if (res.recordset.length > 0) {
      const u = res.recordset[0];
      u.origenHoja = 'Usuarios1';
      return u;
    }

    return null;
  }
}

module.exports = SqlUserRepository;
