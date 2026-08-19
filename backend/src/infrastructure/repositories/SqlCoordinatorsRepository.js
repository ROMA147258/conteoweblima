const { getPool, mssql } = require('../database/sqlServerPool');

class SqlCoordinatorsRepository {
  async getCoordinators(filter = {}) {
    const pool = await getPool();

    // Query robusto unificando Usuarios1 (padrón maestro coordinadores), Usuarios (personeros asignados),
    // Asistencia y tabla de confirmaciones Coordinadores
    const query = `
      SELECT 
        ISNULL(c.id, ROW_NUMBER() OVER(ORDER BY coord.nombre, u.nombre)) AS id,
        ISNULL(c.fecha_hora, a.fecha_hora) AS fechaHora,
        u.nombre AS personeroNombre,
        u.dni AS personeroDni,
        ISNULL(u.ubicacion, coord.ubicacion) AS distrito,
        ISNULL(u.colegio, coord.colegio) AS [local],
        coord.nombre AS coordinadorNombre,
        coord.dni AS coordinadorDni,
        ISNULL(u.mesa, a.mesa) AS mesa,
        ISNULL(c.confirmacion, ISNULL(a.confirmacion, 'PENDIENTE')) AS confirmacion,
        ISNULL(c.foto_url, a.foto_url) AS foto_url
      FROM dbo.Usuarios1 coord
      INNER JOIN dbo.Usuarios u ON (
        LTRIM(RTRIM(LOWER(coord.colegio))) = LTRIM(RTRIM(LOWER(u.colegio)))
        OR (ISNULL(coord.colegio, '') = '' AND LTRIM(RTRIM(LOWER(coord.ubicacion))) = LTRIM(RTRIM(LOWER(u.ubicacion))))
      )
      LEFT JOIN dbo.Asistencia a ON u.dni = a.dni
      LEFT JOIN dbo.Coordinadores c ON u.dni = c.personero_dni
      UNION
      SELECT 
        c.id,
        c.fecha_hora AS fechaHora,
        c.personero_nombre AS personeroNombre,
        c.personero_dni AS personeroDni,
        c.distrito,
        c.[local],
        c.coordinador_nombre AS coordinadorNombre,
        c.coordinador_dni AS coordinadorDni,
        a.mesa,
        c.confirmacion,
        c.foto_url
      FROM dbo.Coordinadores c
      LEFT JOIN dbo.Asistencia a ON c.personero_dni = a.dni
      WHERE NOT EXISTS (
        SELECT 1 FROM dbo.Usuarios u 
        INNER JOIN dbo.Usuarios1 coord ON LTRIM(RTRIM(LOWER(coord.colegio))) = LTRIM(RTRIM(LOWER(u.colegio)))
        WHERE u.dni = c.personero_dni
      )
      ORDER BY coordinadorNombre ASC, personeroNombre ASC
    `;

    try {
      const res = await pool.request().query(query);
      return res.recordset || [];
    } catch (err) {
      // Fallback a tabla Coordinadores directa si hubiera discrepancia
      const fb = await pool.request().query('SELECT * FROM dbo.Coordinadores ORDER BY fecha_hora DESC');
      return fb.recordset || [];
    }
  }

  async getAggregates() {
    const pool = await getPool();
    const [mesasTotalRes, coordsPadrónRes, coordsConfirmadosRes] = await Promise.all([
      pool.request().query('SELECT ISNULL(SUM(num_mesas), 3647) AS total_mesas FROM dbo.Colegios'),
      pool.request().query('SELECT COUNT(DISTINCT dni) AS total_coords FROM dbo.Usuarios1'),
      pool.request().query('SELECT COUNT(DISTINCT coordinador_dni) AS coords_confirmados FROM dbo.Coordinadores WHERE confirmacion = \'SI\' OR confirmacion = \'CONFIRMADO\'')
    ]);

    const totalMesasEsperadas = mesasTotalRes.recordset[0]?.total_mesas || 3647;
    const totalCoords = coordsPadrónRes.recordset[0]?.total_coords || 125;
    const coordsConfirmados = coordsConfirmadosRes.recordset[0]?.coords_confirmados || 0;

    return {
      totalMesasEsperadas,
      totalCoordinadores: totalCoords,
      coordinadoresConfirmados: coordsConfirmados,
      coordinadoresFaltantes: Math.max(0, totalCoords - coordsConfirmados)
    };
  }
}

module.exports = SqlCoordinatorsRepository;
