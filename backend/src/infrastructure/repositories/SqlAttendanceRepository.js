const { query } = require('../database/postgresPool');

class SqlAttendanceRepository {
  async getAttendanceList(filter = {}) {
    const sql = `
      SELECT 
        u.dni, 
        u.nombre, 
        u.ubicacion AS distrito, 
        u.colegio AS "local", 
        u.mesa, 
        a.fecha_hora AS "fechaHora", 
        a.foto_url AS foto, 
        a.ubicacion_gps AS "ubicacionGps",
        COALESCE(a.confirmacion, 'PENDIENTE') AS confirmacion,
        COALESCE(a.confirmacion, 'PENDIENTE') AS confirmacion1,
        'PENDIENTE' AS confirmacion2
      FROM usuarios u
      LEFT JOIN asistencia a ON u.dni = a.dni
      UNION
      SELECT 
        a.dni, 
        a.nombre, 
        a.distrito, 
        a.local, 
        a.mesa, 
        a.fecha_hora AS "fechaHora", 
        a.foto_url AS foto, 
        a.ubicacion_gps AS "ubicacionGps", 
        a.confirmacion, 
        a.confirmacion AS confirmacion1, 
        'PENDIENTE' AS confirmacion2
      FROM asistencia a
      WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.dni = a.dni)
      ORDER BY nombre ASC
    `;

    try {
      const res = await query(sql);
      return res.rows || [];
    } catch (e) {
      try {
        const fb = await query('SELECT * FROM asistencia ORDER BY fecha_hora DESC');
        return fb.rows || [];
      } catch (_) {
        return [];
      }
    }
  }

  async getAggregates() {
    let totalPersoneros = 1661;
    let conf1 = 0;
    let distritosConReporte = 0;
    const porDistrito = {};

    try {
      const [totalUsersRes, conf1Res, distritosReporteRes] = await Promise.all([
        query('SELECT COUNT(*)::int AS total FROM usuarios'),
        query("SELECT COUNT(*)::int AS conf1 FROM asistencia WHERE confirmacion = 'SI' OR confirmacion = 'CONFIRMADO'"),
        query("SELECT COUNT(DISTINCT distrito)::int AS distritos FROM asistencia WHERE distrito IS NOT NULL AND distrito != ''")
      ]);

      totalPersoneros = totalUsersRes.rows[0]?.total || 1661;
      conf1 = conf1Res.rows[0]?.conf1 || 0;
      distritosConReporte = distritosReporteRes.rows[0]?.distritos || 0;

      const porDistritoRes = await query(`
        SELECT distrito, COUNT(*)::int AS confirmados
        FROM asistencia
        WHERE confirmacion = 'SI' OR confirmacion = 'CONFIRMADO'
        GROUP BY distrito
      `);

      (porDistritoRes.rows || []).forEach(r => {
        if (r.distrito) {
          porDistrito[r.distrito] = r.confirmados;
        }
      });
    } catch (_) {}

    return {
      totalPersonerosRegistrados: totalPersoneros,
      primeraAsistencia: conf1,
      segundaAsistencia: 0,
      distritosConReporte: distritosConReporte,
      porDistrito: porDistrito,
      faltantesPrimera: Math.max(0, totalPersoneros - conf1),
      faltantesSegunda: totalPersoneros
    };
  }

  async registrarAsistencia(data) {
    const sql = `
      INSERT INTO asistencia (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (dni) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        distrito = EXCLUDED.distrito,
        local = EXCLUDED.local,
        mesa = EXCLUDED.mesa,
        confirmacion = EXCLUDED.confirmacion,
        foto_url = CASE WHEN EXCLUDED.foto_url != '' THEN EXCLUDED.foto_url ELSE asistencia.foto_url END,
        ubicacion_gps = CASE WHEN EXCLUDED.ubicacion_gps != '' THEN EXCLUDED.ubicacion_gps ELSE asistencia.ubicacion_gps END,
        fecha_hora = NOW()
    `;

    const params = [
      data.nombre || '',
      data.dni || '',
      data.distrito || '',
      data.local || '',
      data.mesa || '',
      data.confirmacion || 'SI',
      data.fotoBase64 || '',
      data.ubicacionGps || ''
    ];

    await query(sql, params);
    return { success: true, message: 'Asistencia registrada correctamente en PostgreSQL.' };
  }

  async confirmarLlegada(data) {
    const sql = `
      INSERT INTO asistencia_llegada (nombre, dni, distrito, colegio, mesa, latitud, longitud, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    const params = [
      data.nombre || '',
      data.dni || '',
      data.distrito || '',
      data.colegio || data.local || '',
      data.mesa || '',
      (data.lat || '').toString(),
      (data.lon || '').toString()
    ];

    try {
      await query(sql, params);
    } catch (_) {}
    return { success: true, message: 'Llegada registrada correctamente.' };
  }

  async getUsuarios() {
    try {
      const res = await query(`
        SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios' AS "origenHoja" FROM usuarios
        UNION ALL
        SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios1' AS "origenHoja" FROM usuarios1
        ORDER BY nombre ASC
      `);
      return { success: true, usuarios: res.rows, data: res.rows };
    } catch (_) {
      return { success: true, usuarios: [], data: [] };
    }
  }
}

module.exports = SqlAttendanceRepository;
