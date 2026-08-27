const { query } = require('../database/postgresPool');

class SqlCoordinatorsRepository {
  async getCoordinators(filter = {}) {
    let whereConditions = [];
    let params = [];
    let pIdx = 1;

    const distrito = (filter.distrito || '').trim();
    const colegio = (filter.colegio || filter.local || '').trim();

    if (distrito && distrito.toUpperCase() !== 'TODOS' && distrito.toUpperCase() !== 'LIMA') {
      whereConditions.push(`LOWER(TRIM(c.distrito)) = LOWER(TRIM($${pIdx}))`);
      params.push(distrito);
      pIdx++;
    }

    if (colegio && colegio.toUpperCase() !== 'TODOS') {
      whereConditions.push(`LOWER(TRIM(c.local)) ILIKE '%' || LOWER(TRIM($${pIdx})) || '%'`);
      params.push(colegio);
      pIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      WITH all_coordinadores AS (
        SELECT 
          id,
          nombres_y_apellidos AS coordinador_nombre,
          dni AS coordinador_dni,
          COALESCE(NULLIF(TRIM(distrito_asignado), ''), NULLIF(TRIM(distrito_donde_vota), ''), 'LIMA') AS distrito,
          COALESCE(NULLIF(TRIM(local_de_votacion_asignado), ''), NULLIF(TRIM(local_de_votacion), ''), '') AS "local",
          'Coordinador de Local' AS tipo_coordinador
        FROM rcoordinadores
        WHERE dni IS NOT NULL AND dni != ''
      ),
      filtered_coordinadores AS (
        SELECT * FROM all_coordinadores c
        ${whereClause}
      ),
      verificaciones AS (
        SELECT 
          cv.coordinador_dni,
          cv.personero_dni,
          cv.personero_nombre,
          cv.distrito,
          cv.local,
          cv.confirmacion,
          cv.foto_url,
          cv.fecha_hora,
          a.mesa
        FROM coordinadores cv
        LEFT JOIN asistencia a ON cv.personero_dni = a.dni
      ),
      personeros_padron AS (
        SELECT 
          p.dni AS personero_dni,
          p.nombres_y_apellidos AS personero_nombre,
          COALESCE(NULLIF(TRIM(p.distrito_asignado), ''), NULLIF(TRIM(p.distrito_donde_vota), ''), 'LIMA') AS distrito,
          COALESCE(NULLIF(TRIM(p.local_de_votacion_asignado), ''), NULLIF(TRIM(p.local_de_votacion), ''), '') AS "local",
          COALESCE(NULLIF(TRIM(p.mesa_asignada), ''), NULLIF(TRIM(p.mesa_de_sufragio), ''), '') AS mesa,
          COALESCE(a.confirmacion, 'PENDIENTE') AS confirmacion,
          COALESCE(a.foto_url, '') AS foto_url,
          a.fecha_hora
        FROM rpersoneros p
        LEFT JOIN asistencia a ON p.dni = a.dni
        WHERE p.dni IS NOT NULL AND p.dni != ''
      )
      SELECT 
        c.id,
        c.coordinador_nombre AS "coordinadorNombre",
        c.coordinador_dni AS "coordinadorDni",
        c.distrito,
        c.local,
        c.tipo_coordinador AS "tipoCoordinador",
        v.personero_nombre AS "personeroNombre",
        v.personero_dni AS "personeroDni",
        COALESCE(v.mesa, '') AS mesa,
        v.confirmacion AS confirmacion,
        v.foto_url AS foto_url,
        v.fecha_hora AS "fechaHora"
      FROM filtered_coordinadores c
      INNER JOIN verificaciones v ON (
        v.coordinador_dni = c.coordinador_dni
        OR (c.local != '' AND v.local != '' AND LOWER(TRIM(c.local)) = LOWER(TRIM(v.local)))
      )
      UNION
      SELECT 
        c.id,
        c.coordinador_nombre AS "coordinadorNombre",
        c.coordinador_dni AS "coordinadorDni",
        c.distrito,
        c.local,
        c.tipo_coordinador AS "tipoCoordinador",
        p.personero_nombre AS "personeroNombre",
        p.personero_dni AS "personeroDni",
        p.mesa AS mesa,
        p.confirmacion AS confirmacion,
        p.foto_url AS foto_url,
        p.fecha_hora AS "fechaHora"
      FROM filtered_coordinadores c
      INNER JOIN personeros_padron p ON (
        c.local != '' AND p.local != '' AND LOWER(TRIM(c.local)) = LOWER(TRIM(p.local))
      )
      WHERE NOT EXISTS (
        SELECT 1 FROM verificaciones v WHERE v.personero_dni = p.personero_dni AND v.coordinador_dni = c.coordinador_dni
      )
      UNION
      SELECT 
        c.id,
        c.coordinador_nombre AS "coordinadorNombre",
        c.coordinador_dni AS "coordinadorDni",
        c.distrito,
        c.local,
        c.tipo_coordinador AS "tipoCoordinador",
        '' AS "personeroNombre",
        '' AS "personeroDni",
        '' AS mesa,
        'PENDIENTE' AS confirmacion,
        '' AS foto_url,
        NULL AS "fechaHora"
      FROM filtered_coordinadores c
      WHERE NOT EXISTS (
        SELECT 1 FROM verificaciones v WHERE v.coordinador_dni = c.coordinador_dni OR (c.local != '' AND v.local != '' AND LOWER(TRIM(c.local)) = LOWER(TRIM(v.local)))
      )
      AND NOT EXISTS (
        SELECT 1 FROM personeros_padron p WHERE c.local != '' AND p.local != '' AND LOWER(TRIM(c.local)) = LOWER(TRIM(p.local))
      )
      ORDER BY "coordinadorNombre" ASC
    `;

    try {
      const res = await query(sql, params);
      return res.rows || [];
    } catch (err) {
      console.error('[getCoordinators Error]:', err.message);
      try {
        const fb = await query('SELECT * FROM coordinadores ORDER BY fecha_hora DESC');
        return fb.rows || [];
      } catch (_) {
        return [];
      }
    }
  }

  async getAggregates(filter = {}) {
    let whereColegios = [];
    let whereCoords = [];
    let params = [];
    let pIdx = 1;

    const distrito = (filter.distrito || '').trim();
    const colegio = (filter.colegio || filter.local || '').trim();

    if (distrito && distrito.toUpperCase() !== 'TODOS' && distrito.toUpperCase() !== 'LIMA') {
      whereColegios.push(`LOWER(TRIM(distrito)) = LOWER(TRIM($${pIdx}))`);
      whereCoords.push(`(LOWER(TRIM(distrito_asignado)) = LOWER(TRIM($${pIdx})) OR LOWER(TRIM(distrito_donde_vota)) = LOWER(TRIM($${pIdx})))`);
      params.push(distrito);
      pIdx++;
    }

    if (colegio && colegio.toUpperCase() !== 'TODOS') {
      whereColegios.push(`LOWER(TRIM(colegio)) = LOWER(TRIM($${pIdx}))`);
      whereCoords.push(`(LOWER(TRIM(local_de_votacion_asignado)) ILIKE '%' || LOWER(TRIM($${pIdx})) || '%' OR LOWER(TRIM(local_de_votacion)) ILIKE '%' || LOWER(TRIM($${pIdx})) || '%')`);
      params.push(colegio);
      pIdx++;
    }

    const clauseColegios = whereColegios.length > 0 ? `WHERE ${whereColegios.join(' AND ')}` : '';
    const clauseCoords = whereCoords.length > 0 ? `WHERE ${whereCoords.join(' AND ')}` : '';

    let totalMesasEsperadas = 25703;
    let totalCoords = 97;
    let coordsConfirmados = 0;

    try {
      const [mesasTotalRes, coordsPadronRes, coordsConfirmadosRes] = await Promise.all([
        query(`SELECT COALESCE(SUM(num_mesas), 0)::int AS total_mesas FROM colegios ${clauseColegios}`, params),
        query(`
          SELECT COUNT(DISTINCT dni)::int AS total_coords 
          FROM rcoordinadores
          ${clauseCoords}
        `, params),
        query(`
          SELECT COUNT(DISTINCT coordinador_dni)::int AS coords_confirmados 
          FROM coordinadores 
          WHERE confirmacion = 'SI' OR confirmacion = 'CONFIRMADO'
        `)
      ]);

      totalMesasEsperadas = mesasTotalRes.rows[0]?.total_mesas || 0;
      totalCoords = coordsPadronRes.rows[0]?.total_coords || 0;
      coordsConfirmados = coordsConfirmadosRes.rows[0]?.coords_confirmados || 0;
    } catch (err) {
      console.error('[getAggregates Error]:', err.message);
    }

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

  async getColegiosList() {
    try {
      const res = await query('SELECT distrito, colegio, num_mesas FROM colegios');
      return res.rows || [];
    } catch (_) {
      return [];
    }
  }
}

module.exports = SqlCoordinatorsRepository;
