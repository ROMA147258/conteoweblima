const { query } = require('../database/postgresPool');

class SqlAttendanceRepository {
  async getAttendanceList(filter = {}) {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    const distrito = (filter.distrito || '').trim();
    const local = (filter.local || filter.colegio || '').trim();

    if (distrito && distrito.toUpperCase() !== 'TODOS' && distrito.toUpperCase() !== 'LIMA') {
      whereConditions.push(`LOWER(TRIM(p.distrito)) = LOWER(TRIM($${paramIndex}))`);
      params.push(distrito);
      paramIndex++;
    }

    if (local && local.toUpperCase() !== 'TODOS') {
      whereConditions.push(`LOWER(TRIM(p.local)) = LOWER(TRIM($${paramIndex}))`);
      params.push(local);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      WITH base_personeros AS (
        SELECT 
          r.dni, 
          r.nombres_y_apellidos AS nombre, 
          r.celular,
          COALESCE(NULLIF(TRIM(r.distrito_asignado), ''), NULLIF(TRIM(r.distrito_donde_vota), ''), 'LIMA') AS distrito, 
          COALESCE(NULLIF(TRIM(r.local_de_votacion_asignado), ''), NULLIF(TRIM(r.local_de_votacion), ''), '') AS "local", 
          COALESCE(NULLIF(TRIM(r.mesa_asignada), ''), NULLIF(TRIM(r.mesa_de_sufragio), ''), '') AS mesa
        FROM rpersoneros r
        WHERE r.dni IS NOT NULL AND r.dni != ''
        UNION
        SELECT 
          a.dni, 
          a.nombre, 
          '' AS celular,
          COALESCE(NULLIF(TRIM(a.distrito), ''), 'LIMA') AS distrito, 
          COALESCE(NULLIF(TRIM(a.local), ''), '') AS "local", 
          COALESCE(NULLIF(TRIM(a.mesa), ''), '') AS mesa
        FROM asistencia a
        WHERE a.dni IS NOT NULL AND a.dni != ''
          AND NOT EXISTS (SELECT 1 FROM rpersoneros r2 WHERE r2.dni = a.dni)
      ),
      llegadas_recent AS (
        SELECT DISTINCT ON (dni) 
          dni, latitud, longitud, distancia_metros, radio_permitido, estado, fecha_registro
        FROM asistenciallegada
        ORDER BY dni, fecha_registro DESC
      ),
      votos_manual AS (
        SELECT DISTINCT ON (TRIM(dni))
          TRIM(dni) AS dni,
          numero_mesa,
          fecha_hora AS fecha_manual,
          COALESCE(p_total_votos, 0) + COALESCE(d_total_votos, 0) AS total_manual
        FROM votos_detalle
        WHERE UPPER(TRIM(origen)) = 'MANUAL' AND dni IS NOT NULL AND TRIM(dni) != ''
        ORDER BY TRIM(dni), fecha_hora DESC
      ),
      votos_imagen AS (
        SELECT DISTINCT ON (TRIM(dni))
          TRIM(dni) AS dni,
          numero_mesa,
          fecha_hora AS fecha_imagen,
          COALESCE(p_total_votos, 0) + COALESCE(d_total_votos, 0) AS total_imagen
        FROM votos_detalle
        WHERE UPPER(TRIM(origen)) IN ('IMAGEN', 'OCR') AND dni IS NOT NULL AND TRIM(dni) != ''
        ORDER BY TRIM(dni), fecha_hora DESC
      )
      SELECT 
        p.dni,
        p.nombre,
        p.celular,
        p.distrito,
        p.local,
        p.mesa,
        a.fecha_hora AS "fechaHora1",
        a.foto_url AS foto,
        CASE 
          WHEN a.confirmacion IN ('SI', 'CONFIRMADO') OR (a.foto_url IS NOT NULL AND a.foto_url != '') THEN 'CONFIRMADO'
          ELSE 'PENDIENTE'
        END AS confirmacion1,
        COALESCE(al.fecha_registro, a.fecha_hora) AS "fechaHora2",
        COALESCE(
          NULLIF(CONCAT(al.latitud, ', ', al.longitud), ', '),
          a.ubicacion_gps,
          ''
        ) AS "ubicacionGps",
        al.distancia_metros AS "distanciaMetros",
        al.estado AS "estadoLlegada",
        CASE 
          WHEN al.dni IS NOT NULL OR (a.ubicacion_gps IS NOT NULL AND a.ubicacion_gps != '') THEN 'CONFIRMADO'
          ELSE 'PENDIENTE'
        END AS confirmacion2,
        CASE WHEN vm.dni IS NOT NULL THEN 'ENVIADO' ELSE 'PENDIENTE' END AS "envioManual",
        vm.fecha_manual AS "fechaManual",
        COALESCE(vm.total_manual, 0) AS "votosManual",
        CASE WHEN vi.dni IS NOT NULL THEN 'ENVIADO' ELSE 'PENDIENTE' END AS "envioImagen",
        vi.fecha_imagen AS "fechaImagen",
        COALESCE(vi.total_imagen, 0) AS "votosImagen",
        CASE
          WHEN vm.dni IS NOT NULL AND vi.dni IS NOT NULL THEN 'AMBOS'
          WHEN vm.dni IS NOT NULL AND vi.dni IS NULL THEN 'SOLO_MANUAL'
          WHEN vm.dni IS NULL AND vi.dni IS NOT NULL THEN 'SOLO_IMAGEN'
          ELSE 'SIN_ENVIO'
        END AS "estadoEnvio"
      FROM base_personeros p
      LEFT JOIN asistencia a ON p.dni = a.dni
      LEFT JOIN llegadas_recent al ON p.dni = al.dni
      LEFT JOIN votos_manual vm ON p.dni = vm.dni
      LEFT JOIN votos_imagen vi ON p.dni = vi.dni
      ${whereClause}
      ORDER BY p.nombre ASC
    `;

    try {
      const res = await query(sql, params);
      return res.rows || [];
    } catch (e) {
      console.error('[getAttendanceList Error]:', e.message);
      try {
        const fb = await query('SELECT * FROM asistencia ORDER BY fecha_hora DESC');
        return fb.rows || [];
      } catch (_) {
        return [];
      }
    }
  }

  async getAggregates(filter = {}) {
    let totalPersoneros = 0;
    let conf1 = 0;
    let conf2 = 0;
    let distritosConReporte = 0;
    let countManual = 0;
    let countImagen = 0;
    let countAmbos = 0;
    const porDistrito1 = {};
    const porDistrito2 = {};

    let distParam = (filter.distrito || '').trim();
    let localParam = (filter.local || filter.colegio || '').trim();
    let filterDist = distParam && distParam.toUpperCase() !== 'TODOS' && distParam.toUpperCase() !== 'LIMA';
    let filterLocal = localParam && localParam.toUpperCase() !== 'TODOS';

    let whereColegios = [];
    let whereAsis = [];
    let whereLlegadas = [];
    let params = [];
    let pIdx = 1;

    if (filterDist) {
      whereColegios.push(`LOWER(TRIM(distrito)) = LOWER(TRIM($${pIdx}))`);
      whereAsis.push(`LOWER(TRIM(distrito)) = LOWER(TRIM($${pIdx}))`);
      whereLlegadas.push(`LOWER(TRIM(distrito)) = LOWER(TRIM($${pIdx}))`);
      params.push(distParam);
      pIdx++;
    }

    if (filterLocal) {
      whereColegios.push(`LOWER(TRIM(colegio)) ILIKE '%' || LOWER(TRIM($${pIdx})) || '%'`);
      whereAsis.push(`LOWER(TRIM(local)) ILIKE '%' || LOWER(TRIM($${pIdx})) || '%'`);
      whereLlegadas.push(`LOWER(TRIM(colegio)) ILIKE '%' || LOWER(TRIM($${pIdx})) || '%'`);
      params.push(localParam);
      pIdx++;
    }

    const clauseColegios = whereColegios.length > 0 ? `WHERE ${whereColegios.join(' AND ')}` : '';
    const clauseAsis = whereAsis.length > 0 ? `AND ${whereAsis.join(' AND ')}` : '';
    const clauseLlegadas = whereLlegadas.length > 0 ? `WHERE ${whereLlegadas.join(' AND ')}` : '';

    try {
      // 1. Total personeros esperados (igual a la cantidad de mesas de los locales de votación)
      const totalMesasSql = `SELECT COALESCE(SUM(num_mesas), 0)::int AS total FROM colegios ${clauseColegios}`;
      const totalMesasRes = await query(totalMesasSql, params);
      totalPersoneros = totalMesasRes.rows[0]?.total || 0;
      if (totalPersoneros === 0 && !filterDist && !filterLocal) totalPersoneros = 29121;

      // 2. Primera Asistencia (Foto / Apertura)
      const conf1Sql = `
        SELECT COUNT(DISTINCT dni)::int AS total 
        FROM asistencia 
        WHERE (confirmacion IN ('SI', 'CONFIRMADO') OR (foto_url IS NOT NULL AND foto_url != ''))
        ${clauseAsis}
      `;
      const conf1Res = await query(conf1Sql, params);
      conf1 = conf1Res.rows[0]?.total || 0;

      // 3. Segunda Asistencia (Llegada con GPS)
      const conf2Sql = `
        SELECT COUNT(DISTINCT dni)::int AS total FROM (
          SELECT dni, distrito, colegio FROM asistenciallegada WHERE dni IS NOT NULL AND dni != ''
          UNION
          SELECT dni, distrito, local AS colegio FROM asistencia WHERE ubicacion_gps IS NOT NULL AND ubicacion_gps != ''
        ) l ${clauseLlegadas}
      `;
      const conf2Res = await query(conf2Sql, params);
      conf2 = conf2Res.rows[0]?.total || 0;

      // 4. Distritos con reporte
      const distReportRes = await query(`
        SELECT COUNT(DISTINCT distrito)::int AS distritos FROM (
          SELECT distrito FROM asistencia WHERE (confirmacion IN ('SI', 'CONFIRMADO') OR (foto_url IS NOT NULL AND foto_url != '')) AND distrito IS NOT NULL AND distrito != ''
          UNION
          SELECT distrito FROM asistenciallegada WHERE distrito IS NOT NULL AND distrito != ''
        ) d
      `);
      distritosConReporte = distReportRes.rows[0]?.distritos || 0;

      // 5. Desglose 1ª Asistencia por Distrito
      const porDistrito1Res = await query(`
        SELECT UPPER(TRIM(distrito)) AS distrito, COUNT(DISTINCT dni)::int AS confirmados
        FROM asistencia
        WHERE (confirmacion IN ('SI', 'CONFIRMADO') OR (foto_url IS NOT NULL AND foto_url != ''))
          AND distrito IS NOT NULL AND distrito != ''
        GROUP BY UPPER(TRIM(distrito))
        ORDER BY confirmados DESC
      `);
      (porDistrito1Res.rows || []).forEach(r => {
        if (r.distrito) porDistrito1[r.distrito] = r.confirmados;
      });

      // 6. Desglose 2ª Asistencia por Distrito
      const porDistrito2Res = await query(`
        SELECT UPPER(TRIM(distrito)) AS distrito, COUNT(DISTINCT dni)::int AS confirmados FROM (
          SELECT dni, distrito FROM asistenciallegada WHERE distrito IS NOT NULL AND distrito != ''
          UNION
          SELECT dni, distrito FROM asistencia WHERE ubicacion_gps IS NOT NULL AND ubicacion_gps != ''
        ) l
        GROUP BY UPPER(TRIM(distrito))
        ORDER BY confirmados DESC
      `);
      (porDistrito2Res.rows || []).forEach(r => {
        if (r.distrito) porDistrito2[r.distrito] = r.confirmados;
      });

      // 7. Envíos de Actas (Manual vs Imagen / OCR)
      try {
        const transSql = `
          WITH personeros_ambit AS (
            SELECT DISTINCT TRIM(dni) AS dni FROM rpersoneros WHERE dni IS NOT NULL AND TRIM(dni) != ''
          ),
          v_man AS (
            SELECT DISTINCT TRIM(dni) AS dni FROM votos_detalle WHERE UPPER(TRIM(origen)) = 'MANUAL' AND dni IS NOT NULL AND TRIM(dni) != ''
          ),
          v_img AS (
            SELECT DISTINCT TRIM(dni) AS dni FROM votos_detalle WHERE UPPER(TRIM(origen)) IN ('IMAGEN', 'OCR') AND dni IS NOT NULL AND TRIM(dni) != ''
          )
          SELECT 
            COUNT(DISTINCT v_man.dni)::int AS manual_count,
            COUNT(DISTINCT v_img.dni)::int AS imagen_count,
            COUNT(DISTINCT CASE WHEN v_man.dni IS NOT NULL AND v_img.dni IS NOT NULL THEN p.dni END)::int AS ambos_count
          FROM personeros_ambit p
          LEFT JOIN v_man ON p.dni = v_man.dni
          LEFT JOIN v_img ON p.dni = v_img.dni
        `;
        const transRes = await query(transSql);
        countManual = transRes.rows[0]?.manual_count || 0;
        countImagen = transRes.rows[0]?.imagen_count || 0;
        countAmbos = transRes.rows[0]?.ambos_count || 0;
      } catch (_) {}

    } catch (err) {
      console.error('[getAggregates Error]:', err.message);
    }

    return {
      totalPersonerosRegistrados: totalPersoneros,
      primeraAsistencia: conf1,
      segundaAsistencia: conf2,
      distritosConReporte: distritosConReporte,
      porDistrito1: porDistrito1,
      porDistrito2: porDistrito2,
      faltantesPrimera: Math.max(0, totalPersoneros - conf1),
      faltantesSegunda: Math.max(0, totalPersoneros - conf2),
      enviosManual: countManual,
      enviosImagen: countImagen,
      enviosAmbos: countAmbos,
      enviosSoloManual: Math.max(0, countManual - countAmbos),
      enviosSoloImagen: Math.max(0, countImagen - countAmbos),
      sinEnvio: Math.max(0, totalPersoneros - (countManual + countImagen - countAmbos))
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
      data.local || data.colegio || '',
      data.mesa || '',
      data.confirmacion || 'SI',
      data.fotoBase64 || data.foto_url || data.foto || '',
      data.ubicacionGps || data.ubicacion_gps || ''
    ];

    try {
      await query(sql, params);
      return { success: true, message: '1ª Asistencia (con foto) registrada correctamente en PostgreSQL.' };
    } catch (e) {
      console.error('[registrarAsistencia Error]:', e.message);
      return { success: false, message: 'Error registrando 1ª asistencia: ' + e.message };
    }
  }

  async confirmarLlegada(data) {
    const sql = `
      INSERT INTO asistenciallegada (nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido, estado, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `;

    const params = [
      data.nombre || '',
      data.dni || '',
      data.distrito || '',
      data.colegio || data.local || '',
      data.mesa || '',
      (data.lat || data.latitud || '').toString(),
      (data.lon || data.longitud || '').toString(),
      parseFloat(data.distancia_metros || data.distanciaMetros || 0) || 0,
      parseInt(data.radio_permitido || data.radioPermitido || 50) || 50,
      data.estado || 'CONFIRMADO'
    ];

    try {
      await query(sql, params);

      // Si existe registro en asistencia, actualizar también ubicación_gps
      const gpsStr = `${data.lat || data.latitud || ''}, ${data.lon || data.longitud || ''}`;
      if (data.dni && gpsStr.trim() !== ',') {
        try {
          await query(
            `UPDATE asistencia SET ubicacion_gps = $1, fecha_hora = NOW() WHERE dni = $2`,
            [gpsStr, data.dni]
          );
        } catch (_) {}
      }

      return { success: true, message: '2ª Asistencia (llegada con GPS) registrada correctamente.' };
    } catch (e) {
      console.error('[confirmarLlegada Error]:', e.message);
      return { success: false, message: 'Error registrando llegada con GPS: ' + e.message };
    }
  }

  async getUsuarios() {
    try {
      const res = await query(`
        SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios' AS "origenHoja" FROM usuarios
        UNION ALL
        SELECT 
          dni, 
          nombres_y_apellidos AS nombre, 
          'Personero' AS rol, 
          COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion, 
          COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio, 
          COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa, 
          'Rpersoneros' AS "origenHoja"
        FROM rpersoneros
        ORDER BY nombre ASC
      `);
      return { success: true, usuarios: res.rows, data: res.rows };
    } catch (_) {
      return { success: true, usuarios: [], data: [] };
    }
  }
}

module.exports = SqlAttendanceRepository;
