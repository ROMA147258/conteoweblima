const { query } = require('../database/postgresPool');

class SqlCoordinatorsRepository {
  async getCoordinators(filter = {}) {
    const sql = `
      SELECT 
        COALESCE(c.id, ROW_NUMBER() OVER(ORDER BY coord.nombre, u.nombre)) AS id,
        COALESCE(c.fecha_hora, a.fecha_hora) AS "fechaHora",
        u.nombre AS "personeroNombre",
        u.dni AS "personeroDni",
        COALESCE(u.ubicacion, coord.ubicacion) AS distrito,
        COALESCE(u.colegio, coord.colegio) AS "local",
        coord.nombre AS "coordinadorNombre",
        coord.dni AS "coordinadorDni",
        COALESCE(u.mesa, a.mesa) AS mesa,
        COALESCE(c.confirmacion, COALESCE(a.confirmacion, 'PENDIENTE')) AS confirmacion,
        COALESCE(c.foto_url, a.foto_url) AS foto_url
      FROM usuarios1 coord
      INNER JOIN usuarios u ON (
        TRIM(LOWER(coord.colegio)) = TRIM(LOWER(u.colegio))
        OR (COALESCE(coord.colegio, '') = '' AND TRIM(LOWER(coord.ubicacion)) = TRIM(LOWER(u.ubicacion)))
      )
      LEFT JOIN asistencia a ON u.dni = a.dni
      LEFT JOIN coordinadores c ON u.dni = c.personero_dni
      UNION
      SELECT 
        c.id,
        c.fecha_hora AS "fechaHora",
        c.personero_nombre AS "personeroNombre",
        c.personero_dni AS "personeroDni",
        c.distrito,
        c.local,
        c.coordinador_nombre AS "coordinadorNombre",
        c.coordinador_dni AS "coordinadorDni",
        a.mesa,
        c.confirmacion,
        c.foto_url
      FROM coordinadores c
      LEFT JOIN asistencia a ON c.personero_dni = a.dni
      WHERE NOT EXISTS (
        SELECT 1 FROM usuarios u 
        INNER JOIN usuarios1 coord ON TRIM(LOWER(coord.colegio)) = TRIM(LOWER(u.colegio))
        WHERE u.dni = c.personero_dni
      )
      ORDER BY "coordinadorNombre" ASC, "personeroNombre" ASC
    `;

    try {
      const res = await query(sql);
      return res.rows || [];
    } catch (err) {
      try {
        const fb = await query('SELECT * FROM coordinadores ORDER BY fecha_hora DESC');
        return fb.rows || [];
      } catch (_) {
        return [];
      }
    }
  }

  async getAggregates() {
    let totalMesasEsperadas = 3647;
    let totalCoords = 125;
    let coordsConfirmados = 0;

    try {
      const [mesasTotalRes, coordsPadronRes, coordsConfirmadosRes] = await Promise.all([
        query('SELECT COALESCE(SUM(num_mesas), 3647)::int AS total_mesas FROM colegios'),
        query('SELECT COUNT(DISTINCT dni)::int AS total_coords FROM usuarios1'),
        query("SELECT COUNT(DISTINCT coordinador_dni)::int AS coords_confirmados FROM coordinadores WHERE confirmacion = 'SI' OR confirmacion = 'CONFIRMADO'")
      ]);

      totalMesasEsperadas = mesasTotalRes.rows[0]?.total_mesas || 3647;
      totalCoords = coordsPadronRes.rows[0]?.total_coords || 125;
      coordsConfirmados = coordsConfirmadosRes.rows[0]?.coords_confirmados || 0;
    } catch (_) {}

    return {
      totalMesasEsperadas,
      totalCoordinadores: totalCoords,
      coordinadoresConfirmados: coordsConfirmados,
      coordinadoresFaltantes: Math.max(0, totalCoords - coordsConfirmados)
    };
  }

  async confirmarCoordinador(data) {
    const sql = `
      INSERT INTO coordinadores (personero_nombre, personero_dni, distrito, local, coordinador_nombre, coordinador_dni, confirmacion, foto_url, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (personero_dni) DO UPDATE SET
        confirmacion = EXCLUDED.confirmacion,
        personero_nombre = EXCLUDED.personero_nombre,
        coordinador_nombre = EXCLUDED.coordinador_nombre,
        coordinador_dni = EXCLUDED.coordinador_dni,
        distrito = EXCLUDED.distrito,
        local = EXCLUDED.local,
        foto_url = EXCLUDED.foto_url,
        fecha_hora = NOW()
    `;

    const params = [
      data.personeroNombre || '',
      data.personeroDni || '',
      data.distrito || '',
      data.local || '',
      data.coordinadorNombre || '',
      data.coordinadorDni || '',
      data.confirmacion || 'SI',
      data.fotoBase64 || ''
    ];

    await query(sql, params);
    return { success: true, message: 'Verificación de coordinador guardada en PostgreSQL.' };
  }
}

module.exports = SqlCoordinatorsRepository;
