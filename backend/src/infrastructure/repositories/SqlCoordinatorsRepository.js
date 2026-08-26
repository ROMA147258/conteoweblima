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
        UNION ALL
        SELECT 
          id,
          nombres_y_apellidos AS coordinador_nombre,
          dni AS coordinador_dni,
          COALESCE(NULLIF(TRIM(distrito_asignado), ''), NULLIF(TRIM(distrito_donde_vota), ''), 'LIMA') AS distrito,
          COALESCE(NULLIF(TRIM(local_de_votacion_asignado), ''), NULLIF(TRIM(local_de_votacion), ''), '') AS "local",
          'Coordinador Distrital' AS tipo_coordinador
        FROM rcoordinadoresd
        WHERE dni IS NOT NULL AND dni != ''
        UNION ALL
        SELECT 
          id,
          nombres_y_apellidos AS coordinador_nombre,
          dni AS coordinador_dni,
          COALESCE(NULLIF(TRIM(distrito_asignado), ''), NULLIF(TRIM(distrito_donde_vota), ''), 'LIMA') AS distrito,
          COALESCE(NULLIF(TRIM(local_de_votacion_asignado), ''), NULLIF(TRIM(local_de_votacion), ''), '') AS "local",
          'Coordinador Zonal' AS tipo_coordinador
        FROM rcoordinadoresz
        WHERE dni IS NOT NULL AND dni != ''
        UNION ALL
        SELECT 
          id,
          nombre AS coordinador_nombre,
          dni AS coordinador_dni,
          COALESCE(NULLIF(TRIM(ubicacion), ''), 'LIMA') AS distrito,
          COALESCE(NULLIF(TRIM(colegio), ''), '') AS "local",
          'Coordinador' AS tipo_coordinador
        FROM usuarios1
        WHERE dni IS NOT NULL AND dni != ''
      ),
      all_personeros AS (
        SELECT 
          p.dni AS personero_dni,
          p.nombres_y_apellidos AS personero_nombre,
          COALESCE(NULLIF(TRIM(p.distrito_asignado), ''), NULLIF(TRIM(p.distrito_donde_vota), ''), 'LIMA') AS distrito,
          COALESCE(NULLIF(TRIM(p.local_de_votacion_asignado), ''), NULLIF(TRIM(p.local_de_votacion), ''), '') AS "local",
          COALESCE(NULLIF(TRIM(p.mesa_asignada), ''), NULLIF(TRIM(p.mesa_de_sufragio), ''), '') AS mesa
        FROM rpersoneros p
        WHERE p.dni IS NOT NULL AND p.dni != ''
        UNION
        SELECT 
          u.dni AS personero_dni,
          u.nombre AS personero_nombre,
          COALESCE(NULLIF(TRIM(u.ubicacion), ''), 'LIMA') AS distrito,
          COALESCE(NULLIF(TRIM(u.colegio), ''), '') AS "local",
          COALESCE(NULLIF(TRIM(u.mesa), ''), '') AS mesa
        FROM usuarios u
        WHERE u.dni IS NOT NULL AND u.dni != '' AND u.dni NOT ILIKE '%Admin%'
      )
      SELECT 
        c.id,
        c.coordinador_nombre AS "coordinadorNombre",
        c.coordinador_dni AS "coordinadorDni",
        c.distrito,
        c.local,
        c.tipo_coordinador AS "tipoCoordinador",
        COALESCE(p.personero_nombre, cv.personero_nombre, '') AS "personeroNombre",
        COALESCE(p.personero_dni, cv.personero_dni, '') AS "personeroDni",
        COALESCE(p.mesa, a.mesa, '') AS mesa,
        COALESCE(cv.confirmacion, a.confirmacion, 'PENDIENTE') AS confirmacion,
        COALESCE(cv.foto_url, a.foto_url, '') AS foto_url,
        COALESCE(cv.fecha_hora, a.fecha_hora) AS "fechaHora"
      FROM all_coordinadores c
      LEFT JOIN all_personeros p ON (
        (c.local != '' AND p.local != '' AND LOWER(TRIM(c.local)) = LOWER(TRIM(p.local)))
        OR (c.distrito != '' AND LOWER(TRIM(c.distrito)) = LOWER(TRIM(p.distrito)))
      )
      LEFT JOIN coordinadores cv ON (
        (p.personero_dni IS NOT NULL AND cv.personero_dni = p.personero_dni)
        OR (cv.coordinador_dni = c.coordinador_dni)
      )
      LEFT JOIN asistencia a ON (p.personero_dni IS NOT NULL AND a.dni = p.personero_dni)
      ${whereClause}
      ORDER BY c.distrito ASC, c.coordinador_nombre ASC
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
          SELECT COUNT(DISTINCT dni)::int AS total_coords FROM (
            SELECT dni, distrito_asignado, distrito_donde_vota, local_de_votacion_asignado, local_de_votacion FROM rcoordinadores
            UNION
            SELECT dni, distrito_asignado, distrito_donde_vota, local_de_votacion_asignado, local_de_votacion FROM rcoordinadoresd
            UNION
            SELECT dni, distrito_asignado, distrito_donde_vota, local_de_votacion_asignado, local_de_votacion FROM rcoordinadoresz
            UNION
            SELECT dni, ubicacion AS distrito_asignado, ubicacion AS distrito_donde_vota, colegio AS local_de_votacion_asignado, colegio AS local_de_votacion FROM usuarios1 WHERE dni IS NOT NULL AND dni != ''
          ) all_c ${clauseCoords}
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
}

module.exports = SqlCoordinatorsRepository;
