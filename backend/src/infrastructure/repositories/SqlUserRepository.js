const { query } = require('../database/postgresPool');

class SqlUserRepository {
  async findByDniOrName(dni, name) {
    const rawDni = (dni || '').trim();
    const rawName = (name || '').trim();

    if (!rawDni && !rawName) return null;

    let whereClause = '';
    const params = [];

    if (rawDni && rawName) {
      params.push(rawDni, `%${rawName}%`);
      whereClause = 'dni ILIKE $1 AND nombre ILIKE $2';
    } else if (rawDni) {
      params.push(rawDni);
      whereClause = 'dni ILIKE $1';
    } else {
      params.push(`%${rawName}%`);
      whereClause = 'nombre ILIKE $1';
    }

    try {
      // 1. Buscar en usuarios
      let res = await query(`SELECT * FROM usuarios WHERE ${whereClause} LIMIT 1`, params);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        u.origenHoja = 'Usuarios';
        return u;
      }

      // 2. Buscar en usuarios1
      res = await query(`SELECT * FROM usuarios1 WHERE ${whereClause} LIMIT 1`, params);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        u.origenHoja = 'Usuarios1';
        return u;
      }

      // 3. Buscar en rpersoneros
      if (rawDni) {
        res = await query(`
          SELECT 
            dni, 
            nombres_y_apellidos AS nombre, 
            'Personero' AS rol, 
            COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion, 
            COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio, 
            COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa, 
            'Rpersoneros' AS "origenHoja"
          FROM rpersoneros
          WHERE dni ILIKE $1 LIMIT 1
        `, [rawDni]);
        if (res.rows.length > 0) return res.rows[0];
      }
    } catch (e) {
      console.warn('[UserRepository Error]:', e.message);
    }

    return null;
  }
}

module.exports = SqlUserRepository;
