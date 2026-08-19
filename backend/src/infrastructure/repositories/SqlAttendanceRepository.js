const { getPool, mssql } = require('../database/sqlServerPool');

class SqlAttendanceRepository {
  async getAttendanceList(filter = {}) {
    const pool = await getPool();

    const query = `
      SELECT 
        u.dni, 
        u.nombre, 
        u.ubicacion AS distrito, 
        u.colegio AS [local], 
        u.mesa, 
        a.fecha_hora AS fechaHora, 
        a.foto_url AS foto, 
        a.ubicacion_gps AS ubicacionGps,
        ISNULL(a.confirmacion, 'PENDIENTE') AS confirmacion,
        ISNULL(a.confirmacion, 'PENDIENTE') AS confirmacion1,
        'PENDIENTE' AS confirmacion2
      FROM dbo.Usuarios u
      LEFT JOIN dbo.Asistencia a ON u.dni = a.dni
      UNION
      SELECT 
        a.dni, 
        a.nombre, 
        a.distrito, 
        a.[local], 
        a.mesa, 
        a.fecha_hora AS fechaHora, 
        a.foto_url AS foto, 
        a.ubicacion_gps AS ubicacionGps, 
        a.confirmacion, 
        a.confirmacion AS confirmacion1, 
        'PENDIENTE' AS confirmacion2
      FROM dbo.Asistencia a
      WHERE NOT EXISTS (SELECT 1 FROM dbo.Usuarios u WHERE u.dni = a.dni)
      ORDER BY nombre ASC
    `;

    try {
      const res = await pool.request().query(query);
      return res.recordset || [];
    } catch (e) {
      const fb = await pool.request().query('SELECT * FROM dbo.Asistencia ORDER BY fecha_hora DESC');
      return fb.recordset || [];
    }
  }

  async getAggregates() {
    const pool = await getPool();

    const [totalUsersRes, conf1Res, distritosReporteRes] = await Promise.all([
      pool.request().query('SELECT COUNT(*) AS total FROM dbo.Usuarios'),
      pool.request().query('SELECT COUNT(*) AS conf1 FROM dbo.Asistencia WHERE confirmacion = \'SI\' OR confirmacion = \'CONFIRMADO\''),
      pool.request().query('SELECT COUNT(DISTINCT distrito) AS distritos FROM dbo.Asistencia WHERE distrito IS NOT NULL AND distrito != \'\'')
    ]);

    const totalPersoneros = totalUsersRes.recordset[0]?.total || 1661;
    const conf1 = conf1Res.recordset[0]?.conf1 || 0;
    const distritosConReporte = distritosReporteRes.recordset[0]?.distritos || 0;

    // Conteo por distrito
    const porDistritoRes = await pool.request().query(`
      SELECT distrito, COUNT(*) AS confirmados
      FROM dbo.Asistencia
      WHERE confirmacion = 'SI' OR confirmacion = 'CONFIRMADO'
      GROUP BY distrito
    `);

    const porDistrito = {};
    (porDistritoRes.recordset || []).forEach(r => {
      if (r.distrito) {
        porDistrito[r.distrito] = r.confirmados;
      }
    });

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
}

module.exports = SqlAttendanceRepository;
