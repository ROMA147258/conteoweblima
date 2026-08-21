const { query } = require('../database/postgresPool');

class SqlVotesRepository {
  async getResults(filters = {}) {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (filters.distrito && filters.distrito !== 'todos' && filters.distrito !== 'LIMA') {
      whereConditions.push(`LOWER(TRIM(ubicacion)) = LOWER(TRIM($${paramIndex}))`);
      params.push(filters.distrito);
      paramIndex++;
    }

    if (filters.colegio && filters.colegio !== 'todos') {
      whereConditions.push(`LOWER(TRIM(colegio)) = LOWER(TRIM($${paramIndex}))`);
      params.push(filters.colegio);
      paramIndex++;
    }

    if (filters.mesa && filters.mesa !== 'todas') {
      whereConditions.push(`LOWER(TRIM(numero_mesa)) = LOWER(TRIM($${paramIndex}))`);
      params.push(filters.mesa);
      paramIndex++;
    }

    if (filters.origen && filters.origen !== 'todos') {
      whereConditions.push(`LOWER(TRIM(origen)) = LOWER(TRIM($${paramIndex}))`);
      params.push(filters.origen);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sqlTotals = `
      SELECT 
        COALESCE(SUM(p_fp_votos), 0)::int AS "p_FP",
        COALESCE(SUM(p_jp_votos), 0)::int AS "p_JP",
        COALESCE(SUM(p_sp_votos), 0)::int AS "p_SP",
        COALESCE(SUM(p_frepap_votos), 0)::int AS "p_FREPAP",
        COALESCE(SUM(p_verde_votos), 0)::int AS "p_VERDE",
        COALESCE(SUM(p_morado_votos), 0)::int AS "p_MORADO",
        COALESCE(SUM(p_nulos), 0)::int AS "p_NULOS",
        COALESCE(SUM(p_vacios), 0)::int AS "p_VACIOS",
        COALESCE(SUM(p_total_votos), 0)::int AS "p_TOTAL",

        COALESCE(SUM(d_fp_votos), 0)::int AS "d_FP",
        COALESCE(SUM(d_jp_votos), 0)::int AS "d_JP",
        COALESCE(SUM(d_sp_votos), 0)::int AS "d_SP",
        COALESCE(SUM(d_frepap_votos), 0)::int AS "d_FREPAP",
        COALESCE(SUM(d_verde_votos), 0)::int AS "d_VERDE",
        COALESCE(SUM(d_morado_votos), 0)::int AS "d_MORADO",
        COALESCE(SUM(d_nulos), 0)::int AS "d_NULOS",
        COALESCE(SUM(d_vacios), 0)::int AS "d_VACIOS",
        COALESCE(SUM(d_total_votos), 0)::int AS "d_TOTAL",

        COUNT(DISTINCT numero_mesa)::int AS "mesas_escrutadas"
      FROM votos_detalle
      ${whereClause}
    `;

    const totalsResult = await query(sqlTotals, params);
    const row = totalsResult.rows[0] || {};

    const sqlDesglose = `
      SELECT 
        origen,
        COALESCE(SUM(p_fp_votos), 0)::int AS "p_FP",
        COALESCE(SUM(p_jp_votos), 0)::int AS "p_JP",
        COALESCE(SUM(p_sp_votos), 0)::int AS "p_SP",
        COALESCE(SUM(p_frepap_votos), 0)::int AS "p_FREPAP",
        COALESCE(SUM(p_verde_votos), 0)::int AS "p_VERDE",
        COALESCE(SUM(p_morado_votos), 0)::int AS "p_MORADO",
        COALESCE(SUM(p_nulos), 0)::int AS "p_NULOS",
        COALESCE(SUM(p_vacios), 0)::int AS "p_VACIOS",
        COALESCE(SUM(p_total_votos), 0)::int AS "p_TOTAL",

        COALESCE(SUM(d_fp_votos), 0)::int AS "d_FP",
        COALESCE(SUM(d_jp_votos), 0)::int AS "d_JP",
        COALESCE(SUM(d_sp_votos), 0)::int AS "d_SP",
        COALESCE(SUM(d_frepap_votos), 0)::int AS "d_FREPAP",
        COALESCE(SUM(d_verde_votos), 0)::int AS "d_VERDE",
        COALESCE(SUM(d_morado_votos), 0)::int AS "d_MORADO",
        COALESCE(SUM(d_nulos), 0)::int AS "d_NULOS",
        COALESCE(SUM(d_vacios), 0)::int AS "d_VACIOS",
        COALESCE(SUM(d_total_votos), 0)::int AS "d_TOTAL"
      FROM votos_detalle
      ${whereClause}
      GROUP BY origen
    `;

    const desgloseResult = await query(sqlDesglose, params);

    const desglose = {
      manualProvincial: {},
      manualDistrital: {},
      ocrProvincial: {},
      ocrDistrital: {}
    };

    desgloseResult.rows.forEach(r => {
      const orig = (r.origen || '').toUpperCase();
      if (orig === 'MANUAL') {
        desglose.manualProvincial = {
          FP: r.p_FP, JP: r.p_JP, 'SOMOS PERU': r.p_SP, FREPAP: r.p_FREPAP,
          VERDE: r.p_VERDE, MORADO: r.p_MORADO, NULOS: r.p_NULOS, VACIOS: r.p_VACIOS, TOTAL: r.p_TOTAL
        };
        desglose.manualDistrital = {
          FP: r.d_FP, JP: r.d_JP, 'SOMOS PERU': r.d_SP, FREPAP: r.d_FREPAP,
          VERDE: r.d_VERDE, MORADO: r.d_MORADO, NULOS: r.d_NULOS, VACIOS: r.d_VACIOS, TOTAL: r.d_TOTAL
        };
      } else if (orig === 'OCR') {
        desglose.ocrProvincial = {
          FP: r.p_FP, JP: r.p_JP, 'SOMOS PERU': r.p_SP, FREPAP: r.p_FREPAP,
          VERDE: r.p_VERDE, MORADO: r.p_MORADO, NULOS: r.p_NULOS, VACIOS: r.p_VACIOS, TOTAL: r.p_TOTAL
        };
        desglose.ocrDistrital = {
          FP: r.d_FP, JP: r.d_JP, 'SOMOS PERU': r.d_SP, FREPAP: r.d_FREPAP,
          VERDE: r.d_VERDE, MORADO: r.d_MORADO, NULOS: r.d_NULOS, VACIOS: r.d_VACIOS, TOTAL: r.d_TOTAL
        };
      }
    });

    return {
      totalesProvincial: {
        FP: row.p_FP || 0,
        JP: row.p_JP || 0,
        'SOMOS PERU': row.p_SP || 0,
        FREPAP: row.p_FREPAP || 0,
        VERDE: row.p_VERDE || 0,
        MORADO: row.p_MORADO || 0,
        NULOS: row.p_NULOS || 0,
        VACIOS: row.p_VACIOS || 0,
        TOTAL: row.p_TOTAL || 0
      },
      totalesDistrital: {
        FP: row.d_FP || 0,
        JP: row.d_JP || 0,
        'SOMOS PERU': row.d_SP || 0,
        FREPAP: row.d_FREPAP || 0,
        VERDE: row.d_VERDE || 0,
        MORADO: row.d_MORADO || 0,
        NULOS: row.d_NULOS || 0,
        VACIOS: row.d_VACIOS || 0,
        TOTAL: row.d_TOTAL || 0
      },
      mesasEscrutadas: row.mesas_escrutadas || 0,
      desglose
    };
  }

  async registrarVotos(data) {
    const mesaStr = (data.mesa || '').toString().trim();
    const origenStr = (data.origen || 'MANUAL').toString().trim().toUpperCase();
    const prov = data.votos ? (data.votos.provincial || {}) : {};
    const dist = data.votos ? (data.votos.distrital || {}) : {};

    const p_fp_v = prov.FP ? (parseInt(prov.FP.votos) || 0) : 0;
    const p_jp_v = prov.JP ? (parseInt(prov.JP.votos) || 0) : 0;
    const p_sp_v = prov['SOMOS PERU'] ? (parseInt(prov['SOMOS PERU'].votos) || 0) : 0;
    const p_frepap_v = prov.FREPAP ? (parseInt(prov.FREPAP.votos) || 0) : 0;
    const p_verde_v = prov.VERDE ? (parseInt(prov.VERDE.votos) || 0) : 0;
    const p_morado_v = prov.MORADO ? (parseInt(prov.MORADO.votos) || 0) : 0;
    const p_nulos = parseInt(data.votos_nulos) || 0;
    const p_vacios = parseInt(data.votos_vacios) || 0;
    const p_total = p_fp_v + p_jp_v + p_sp_v + p_frepap_v + p_verde_v + p_morado_v + p_nulos + p_vacios;

    const d_fp_v = dist.FP ? (parseInt(dist.FP.votos) || 0) : 0;
    const d_jp_v = dist.JP ? (parseInt(dist.JP.votos) || 0) : 0;
    const d_sp_v = dist['SOMOS PERU'] ? (parseInt(dist['SOMOS PERU'].votos) || 0) : 0;
    const d_frepap_v = dist.FREPAP ? (parseInt(dist.FREPAP.votos) || 0) : 0;
    const d_verde_v = dist.VERDE ? (parseInt(dist.VERDE.votos) || 0) : 0;
    const d_morado_v = dist.MORADO ? (parseInt(dist.MORADO.votos) || 0) : 0;
    const d_nulos = parseInt(data.votos_dist_nulos) || 0;
    const d_vacios = parseInt(data.votos_dist_vacios) || 0;
    const d_total = d_fp_v + d_jp_v + d_sp_v + d_frepap_v + d_verde_v + d_morado_v + d_nulos + d_vacios;

    const sql = `
      INSERT INTO votos_detalle (
        personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
        p_fp_candidato, p_fp_votos, p_jp_candidato, p_jp_votos, p_sp_candidato, p_sp_votos,
        p_frepap_candidato, p_frepap_votos, p_verde_candidato, p_verde_votos, p_morado_candidato, p_morado_votos,
        p_nulos, p_vacios, p_total_votos,
        d_fp_candidato, d_fp_votos, d_jp_candidato, d_jp_votos, d_sp_candidato, d_sp_votos,
        d_frepap_candidato, d_frepap_votos, d_verde_candidato, d_verde_votos, d_morado_candidato, d_morado_votos,
        d_nulos, d_vacios, d_total_votos, fecha_hora
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23,
        $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34, $35,
        $36, $37, $38, NOW()
      )
      ON CONFLICT (numero_mesa, origen) DO UPDATE SET
        personero = EXCLUDED.personero,
        dni = EXCLUDED.dni,
        departamento = EXCLUDED.departamento,
        provincia = EXCLUDED.provincia,
        ubicacion = EXCLUDED.ubicacion,
        colegio = EXCLUDED.colegio,
        p_fp_candidato = EXCLUDED.p_fp_candidato,
        p_fp_votos = EXCLUDED.p_fp_votos,
        p_jp_candidato = EXCLUDED.p_jp_candidato,
        p_jp_votos = EXCLUDED.p_jp_votos,
        p_sp_candidato = EXCLUDED.p_sp_candidato,
        p_sp_votos = EXCLUDED.p_sp_votos,
        p_frepap_candidato = EXCLUDED.p_frepap_candidato,
        p_frepap_votos = EXCLUDED.p_frepap_votos,
        p_verde_candidato = EXCLUDED.p_verde_candidato,
        p_verde_votos = EXCLUDED.p_verde_votos,
        p_morado_candidato = EXCLUDED.p_morado_candidato,
        p_morado_votos = EXCLUDED.p_morado_votos,
        p_nulos = EXCLUDED.p_nulos,
        p_vacios = EXCLUDED.p_vacios,
        p_total_votos = EXCLUDED.p_total_votos,
        d_fp_candidato = EXCLUDED.d_fp_candidato,
        d_fp_votos = EXCLUDED.d_fp_votos,
        d_jp_candidato = EXCLUDED.d_jp_candidato,
        d_jp_votos = EXCLUDED.d_jp_votos,
        d_sp_candidato = EXCLUDED.d_sp_candidato,
        d_sp_votos = EXCLUDED.d_sp_votos,
        d_frepap_candidato = EXCLUDED.d_frepap_candidato,
        d_frepap_votos = EXCLUDED.d_frepap_votos,
        d_verde_candidato = EXCLUDED.d_verde_candidato,
        d_verde_votos = EXCLUDED.d_verde_votos,
        d_morado_candidato = EXCLUDED.d_morado_candidato,
        d_morado_votos = EXCLUDED.d_morado_votos,
        d_nulos = EXCLUDED.d_nulos,
        d_vacios = EXCLUDED.d_vacios,
        d_total_votos = EXCLUDED.d_total_votos,
        fecha_hora = NOW()
    `;

    const params = [
      data.brigadista || '', data.dni || '', data.departamento || 'Lima', data.provincia || 'Lima',
      data.ubicacion || '', data.colegio || '', mesaStr, origenStr,
      prov.FP?.candidato || '', p_fp_v = prov.FP ? (parseInt(prov.FP.votos) || 0) : 0,
      prov.JP?.candidato || '', p_jp_v = prov.JP ? (parseInt(prov.JP.votos) || 0) : 0,
      prov['SOMOS PERU']?.candidato || '', p_sp_v = prov['SOMOS PERU'] ? (parseInt(prov['SOMOS PERU'].votos) || 0) : 0,
      prov.FREPAP?.candidato || '', p_frepap_v = prov.FREPAP ? (parseInt(prov.FREPAP.votos) || 0) : 0,
      prov.VERDE?.candidato || '', p_verde_v = prov.VERDE ? (parseInt(prov.VERDE.votos) || 0) : 0,
      prov.MORADO?.candidato || '', p_morado_v = prov.MORADO ? (parseInt(prov.MORADO.votos) || 0) : 0,
      p_nulos, p_vacios, p_total,
      dist.FP?.candidato || '', d_fp_v = dist.FP ? (parseInt(dist.FP.votos) || 0) : 0,
      dist.JP?.candidato || '', d_jp_v = dist.JP ? (parseInt(dist.JP.votos) || 0) : 0,
      dist['SOMOS PERU']?.candidato || '', d_sp_v = dist['SOMOS PERU'] ? (parseInt(dist['SOMOS PERU'].votos) || 0) : 0,
      dist.FREPAP?.candidato || '', d_frepap_v = dist.FREPAP ? (parseInt(dist.FREPAP.votos) || 0) : 0,
      dist.VERDE?.candidato || '', d_verde_v = dist.VERDE ? (parseInt(dist.VERDE.votos) || 0) : 0,
      dist.MORADO?.candidato || '', d_morado_v = dist.MORADO ? (parseInt(dist.MORADO.votos) || 0) : 0,
      d_nulos, d_vacios, d_total
    ];

    await query(sql, params);
    return { success: true, message: 'Votos registrados correctamente en PostgreSQL.' };
  }

  async getMesas() {
    try {
      const res = await query(`
        SELECT DISTINCT numero_mesa AS mesa, ubicacion AS distrito, colegio FROM votos_detalle WHERE numero_mesa IS NOT NULL AND numero_mesa != ''
        UNION
        SELECT DISTINCT numero_mesa AS mesa, distrito, colegio FROM mesas WHERE numero_mesa IS NOT NULL AND numero_mesa != ''
      `);
      return res.rows || [];
    } catch (_) {
      return [];
    }
  }

  async getReporte() {
    const [reportRes, distRes, mesasRes] = await Promise.all([
      query(`
        SELECT 
          COALESCE(SUM(p_fp_votos),0)::int AS "FP", 
          COALESCE(SUM(p_jp_votos),0)::int AS "JP", 
          COALESCE(SUM(p_sp_votos),0)::int AS "SOMOS PERU",
          COALESCE(SUM(p_frepap_votos),0)::int AS "FREPAP", 
          COALESCE(SUM(p_verde_votos),0)::int AS "VERDE", 
          COALESCE(SUM(p_morado_votos),0)::int AS "MORADO",
          COALESCE(SUM(p_nulos),0)::int AS "NULOS", 
          COALESCE(SUM(p_vacios),0)::int AS "VACIOS" 
        FROM votos_detalle
      `),
      query(`
        SELECT 
          COALESCE(SUM(d_fp_votos),0)::int AS "FP", 
          COALESCE(SUM(d_jp_votos),0)::int AS "JP", 
          COALESCE(SUM(d_sp_votos),0)::int AS "SOMOS PERU",
          COALESCE(SUM(d_frepap_votos),0)::int AS "FREPAP", 
          COALESCE(SUM(d_verde_votos),0)::int AS "VERDE", 
          COALESCE(SUM(d_morado_votos),0)::int AS "MORADO",
          COALESCE(SUM(d_nulos),0)::int AS "NULOS", 
          COALESCE(SUM(d_vacios),0)::int AS "VACIOS" 
        FROM votos_detalle
      `),
      query(`
        SELECT numero_mesa AS mesa, origen, ubicacion, colegio, personero AS brigadista, fecha_hora AS fecha,
               p_fp_votos, p_jp_votos, p_sp_votos, p_frepap_votos, p_verde_votos, p_morado_votos, p_nulos, p_vacios,
               d_fp_votos, d_jp_votos, d_sp_votos, d_frepap_votos, d_verde_votos, d_morado_votos, d_nulos, d_vacios
        FROM votos_detalle
      `)
    ]);

    const mesasFormatted = (mesasRes.rows || []).map(r => ({
      mesa: r.mesa, origen: r.origen, ubicacion: r.ubicacion, colegio: r.colegio,
      brigadista: r.brigadista, fecha: r.fecha,
      votos_provincial: { FP: r.p_fp_votos, JP: r.p_jp_votos, SP: r.p_sp_votos, FREPAP: r.p_frepap_votos, VERDE: r.p_verde_votos, MORADO: r.p_morado_votos, votos_nulos: r.p_nulos, votos_vacios: r.p_vacios },
      votos_distrital: { FP: r.d_fp_votos, JP: r.d_jp_votos, SP: r.d_sp_votos, FREPAP: r.d_frepap_votos, VERDE: r.d_verde_votos, MORADO: r.d_morado_votos, votos_dist_nulos: r.d_nulos, votos_dist_vacios: r.d_vacios }
    }));

    let mesasEstructura = [];
    try {
      const estRes = await query(`
        SELECT numero_mesa AS mesa, distrito, colegio, latitud, longitud, coordenadas_gps, 50 AS radio_metros 
        FROM mesas
        ORDER BY colegio ASC, numero_mesa ASC
      `);
      mesasEstructura = estRes.rows || [];
    } catch (_) {}

    return {
      success: true,
      totales_provincial: reportRes.rows[0] || {},
      totales_distrital: distRes.rows[0] || {},
      mesas: mesasFormatted,
      mesas_estructura: mesasEstructura,
      mesas_escrutadas: mesasFormatted.length
    };
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

  async getAsistenciaPorDni(dni) {
    const dniQuery = (dni || '').toString().trim();
    if (!dniQuery) return { success: false, message: 'Se requiere DNI' };
    const res = await query('SELECT * FROM asistencia WHERE dni ILIKE $1 ORDER BY fecha_hora DESC LIMIT 1', [dniQuery]);
    return { success: true, asistencia: res.rows[0] || null };
  }

  async getConfirmacionesPorColegio(colegio) {
    const colegioQuery = (colegio || '').toString().trim();
    if (!colegioQuery) return { success: false, message: 'Se requiere colegio' };
    const res = await query(`
      SELECT c.*, a.mesa AS personero_mesa
      FROM coordinadores c
      LEFT JOIN asistencia a ON a.dni = c.personero_dni
      WHERE c.local ILIKE $1
      ORDER BY c.fecha_hora DESC
    `, [colegioQuery]);
    return { success: true, confirmaciones: res.rows };
  }

  async getComparisonVotes(filter = {}) {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    const level = (filter.level || 'distrito').toLowerCase();
    const location = (filter.location || '').trim();
    const origen = (filter.origen || '').trim().toUpperCase();
    const votoTipo = (filter.votoTipo || 'todos').toLowerCase();

    if (location && location.toUpperCase() !== 'TODOS' && location.toUpperCase() !== 'LIMA') {
      if (level === 'distrito') {
        whereConditions.push(`LOWER(TRIM(ubicacion)) = LOWER(TRIM($${paramIndex}))`);
        params.push(location);
        paramIndex++;
      } else if (level === 'colegio') {
        whereConditions.push(`LOWER(TRIM(colegio)) = LOWER(TRIM($${paramIndex}))`);
        params.push(location);
        paramIndex++;
      } else if (level === 'mesa') {
        whereConditions.push(`LOWER(TRIM(numero_mesa)) = LOWER(TRIM($${paramIndex}))`);
        params.push(location);
        paramIndex++;
      }
    }

    if (origen && origen !== 'TODOS') {
      if (origen === 'IMAGEN' || origen === 'OCR') {
        whereConditions.push(`(UPPER(TRIM(origen)) = 'OCR' OR UPPER(TRIM(origen)) = 'IMAGEN')`);
      } else {
        whereConditions.push(`UPPER(TRIM(origen)) = $${paramIndex}`);
        params.push(origen);
        paramIndex++;
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let sql;
    if (votoTipo === 'provincial') {
      sql = `
        SELECT 
          COALESCE(SUM(p_fp_votos), 0)::int AS "FP",
          COALESCE(SUM(p_jp_votos), 0)::int AS "JP",
          COALESCE(SUM(p_sp_votos), 0)::int AS "SP",
          COALESCE(SUM(p_sp_votos), 0)::int AS "SOMOS PERU",
          COALESCE(SUM(p_frepap_votos), 0)::int AS "FR",
          COALESCE(SUM(p_frepap_votos), 0)::int AS "FREPAP",
          COALESCE(SUM(p_verde_votos), 0)::int AS "VE",
          COALESCE(SUM(p_verde_votos), 0)::int AS "VERDE",
          COALESCE(SUM(p_morado_votos), 0)::int AS "MO",
          COALESCE(SUM(p_morado_votos), 0)::int AS "MORADO",
          COALESCE(SUM(p_nulos), 0)::int AS "NULOS",
          COALESCE(SUM(p_vacios), 0)::int AS "VACIOS",
          COALESCE(SUM(p_total_votos), 0)::int AS "TOTAL",
          COUNT(DISTINCT numero_mesa)::int AS "mesas"
        FROM votos_detalle
        ${whereClause}
      `;
    } else if (votoTipo === 'distrital') {
      sql = `
        SELECT 
          COALESCE(SUM(d_fp_votos), 0)::int AS "FP",
          COALESCE(SUM(d_jp_votos), 0)::int AS "JP",
          COALESCE(SUM(d_sp_votos), 0)::int AS "SP",
          COALESCE(SUM(d_sp_votos), 0)::int AS "SOMOS PERU",
          COALESCE(SUM(d_frepap_votos), 0)::int AS "FR",
          COALESCE(SUM(d_frepap_votos), 0)::int AS "FREPAP",
          COALESCE(SUM(d_verde_votos), 0)::int AS "VE",
          COALESCE(SUM(d_verde_votos), 0)::int AS "VERDE",
          COALESCE(SUM(d_morado_votos), 0)::int AS "MO",
          COALESCE(SUM(d_morado_votos), 0)::int AS "MORADO",
          COALESCE(SUM(d_nulos), 0)::int AS "NULOS",
          COALESCE(SUM(d_vacios), 0)::int AS "VACIOS",
          COALESCE(SUM(d_total_votos), 0)::int AS "TOTAL",
          COUNT(DISTINCT numero_mesa)::int AS "mesas"
        FROM votos_detalle
        ${whereClause}
      `;
    } else {
      sql = `
        SELECT 
          COALESCE(SUM(p_fp_votos + d_fp_votos), 0)::int AS "FP",
          COALESCE(SUM(p_jp_votos + d_jp_votos), 0)::int AS "JP",
          COALESCE(SUM(p_sp_votos + d_sp_votos), 0)::int AS "SP",
          COALESCE(SUM(p_sp_votos + d_sp_votos), 0)::int AS "SOMOS PERU",
          COALESCE(SUM(p_frepap_votos + d_frepap_votos), 0)::int AS "FR",
          COALESCE(SUM(p_frepap_votos + d_frepap_votos), 0)::int AS "FREPAP",
          COALESCE(SUM(p_verde_votos + d_verde_votos), 0)::int AS "VE",
          COALESCE(SUM(p_verde_votos + d_verde_votos), 0)::int AS "VERDE",
          COALESCE(SUM(p_morado_votos + d_morado_votos), 0)::int AS "MO",
          COALESCE(SUM(p_morado_votos + d_morado_votos), 0)::int AS "MORADO",
          COALESCE(SUM(p_nulos + d_nulos), 0)::int AS "NULOS",
          COALESCE(SUM(p_vacios + d_vacios), 0)::int AS "VACIOS",
          COALESCE(SUM(p_total_votos + d_total_votos), 0)::int AS "TOTAL",
          COUNT(DISTINCT numero_mesa)::int AS "mesas"
        FROM votos_detalle
        ${whereClause}
      `;
    }

    try {
      const res = await query(sql, params);
      return res.rows[0] || {
        FP: 0, JP: 0, SP: 0, 'SOMOS PERU': 0, FR: 0, FREPAP: 0, VE: 0, VERDE: 0, MO: 0, MORADO: 0, NULOS: 0, VACIOS: 0, TOTAL: 0, mesas: 0
      };
    } catch (e) {
      console.error('[getComparisonVotes Error]:', e.message);
      return {
        FP: 0, JP: 0, SP: 0, 'SOMOS PERU': 0, FR: 0, FREPAP: 0, VE: 0, VERDE: 0, MO: 0, MORADO: 0, NULOS: 0, VACIOS: 0, TOTAL: 0, mesas: 0
      };
    }
  }

  async getComparison(filterA, filterB) {
    const [resA, resB] = await Promise.all([
      this.getComparisonVotes(filterA),
      this.getComparisonVotes(filterB)
    ]);
    return {
      sideA: resA,
      sideB: resB,
      filtroA: filterA,
      filtroB: filterB
    };
  }
}

module.exports = SqlVotesRepository;
