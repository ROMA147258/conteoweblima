const { getPool, mssql } = require('../database/sqlServerPool');

class SqlVotesRepository {
  async getResults(filters = {}) {
    const pool = await getPool();
    const request = pool.request();

    let whereClauses = [];

    if (filters.departamento) {
      whereClauses.push('LTRIM(RTRIM(LOWER(departamento))) = LTRIM(RTRIM(LOWER(@departamento)))');
      request.input('departamento', mssql.VarChar, filters.departamento);
    }
    if (filters.provincia && filters.provincia !== 'todas' && filters.provincia !== 'lima-metropolitana' && filters.provincia !== 'Lima') {
      whereClauses.push('LTRIM(RTRIM(LOWER(provincia))) = LTRIM(RTRIM(LOWER(@provincia)))');
      request.input('provincia', mssql.VarChar, filters.provincia);
    }
    if (filters.distrito && filters.distrito !== 'todos' && filters.distrito !== 'LIMA') {
      whereClauses.push('LTRIM(RTRIM(LOWER(ubicacion))) = LTRIM(RTRIM(LOWER(@distrito)))');
      request.input('distrito', mssql.VarChar, filters.distrito);
    }
    if (filters.colegio && filters.colegio !== 'todos') {
      whereClauses.push('LTRIM(RTRIM(LOWER(colegio))) = LTRIM(RTRIM(LOWER(@colegio)))');
      request.input('colegio', mssql.VarChar, filters.colegio);
    }
    if (filters.mesa && filters.mesa !== 'todas') {
      whereClauses.push('LTRIM(RTRIM(LOWER(numero_mesa))) = LTRIM(RTRIM(LOWER(@mesa)))');
      request.input('mesa', mssql.VarChar, filters.mesa);
    }
    if (filters.origen && filters.origen !== 'todos' && filters.origen !== '') {
      if (filters.origen.toUpperCase() === 'IMAGEN' || filters.origen.toUpperCase() === 'OCR') {
        whereClauses.push('(origen = \'IMAGEN\' OR origen = \'OCR\')');
      } else {
        whereClauses.push('origen = @origen');
        request.input('origen', mssql.VarChar, filters.origen.toUpperCase());
      }
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Totales Provinciales
    const provQuery = `
      SELECT 
        ISNULL(SUM(p_fp_votos), 0) AS FP,
        ISNULL(SUM(p_jp_votos), 0) AS JP,
        ISNULL(SUM(p_sp_votos), 0) AS [SOMOS PERU],
        ISNULL(SUM(p_frepap_votos), 0) AS FREPAP,
        ISNULL(SUM(p_verde_votos), 0) AS VERDE,
        ISNULL(SUM(p_morado_votos), 0) AS MORADO,
        ISNULL(SUM(p_nulos), 0) AS NULOS,
        ISNULL(SUM(p_vacios), 0) AS VACIOS,
        ISNULL(SUM(p_total_votos), 0) AS TOTAL
      FROM dbo.Votos_Detalle
      ${whereStr}
    `;

    // Totales Distritales
    const distQuery = `
      SELECT 
        ISNULL(SUM(d_fp_votos), 0) AS FP,
        ISNULL(SUM(d_jp_votos), 0) AS JP,
        ISNULL(SUM(d_sp_votos), 0) AS [SOMOS PERU],
        ISNULL(SUM(d_frepap_votos), 0) AS FREPAP,
        ISNULL(SUM(d_verde_votos), 0) AS VERDE,
        ISNULL(SUM(d_morado_votos), 0) AS MORADO,
        ISNULL(SUM(d_nulos), 0) AS NULOS,
        ISNULL(SUM(d_vacios), 0) AS VACIOS,
        ISNULL(SUM(d_total_votos), 0) AS TOTAL
      FROM dbo.Votos_Detalle
      ${whereStr}
    `;

    // Detalle de mesas
    const mesasQuery = `
      SELECT 
        numero_mesa AS mesa,
        origen,
        ubicacion AS distrito,
        provincia,
        departamento,
        colegio,
        personero AS brigadista,
        fecha_hora AS fecha,
        p_fp_votos, p_jp_votos, p_sp_votos, p_frepap_votos, p_verde_votos, p_morado_votos, p_nulos, p_vacios, p_total_votos,
        d_fp_votos, d_jp_votos, d_sp_votos, d_frepap_votos, d_verde_votos, d_morado_votos, d_nulos, d_vacios, d_total_votos
      FROM dbo.Votos_Detalle
      ${whereStr}
      ORDER BY fecha_hora DESC
    `;

    const [provRes, distRes, mesasRes] = await Promise.all([
      request.query(provQuery),
      request.query(distQuery),
      request.query(mesasQuery)
    ]);

    // Resumen por Origen (Manual vs OCR)
    const manualReq = pool.request();
    const ocrReq = pool.request();
    
    // Copiar filtros aplicados a los queries de desglose
    whereClauses.forEach((_, i) => {
      // Re-query para manual y OCR
    });

    const [manualProv, manualDist, ocrProv, ocrDist] = await Promise.all([
      pool.request().query(`
        SELECT 
          ISNULL(SUM(p_fp_votos), 0) AS FP, ISNULL(SUM(p_jp_votos), 0) AS JP, ISNULL(SUM(p_sp_votos), 0) AS [SOMOS PERU],
          ISNULL(SUM(p_frepap_votos), 0) AS FREPAP, ISNULL(SUM(p_verde_votos), 0) AS VERDE, ISNULL(SUM(p_morado_votos), 0) AS MORADO,
          ISNULL(SUM(p_nulos), 0) AS NULOS, ISNULL(SUM(p_vacios), 0) AS VACIOS, ISNULL(SUM(p_total_votos), 0) AS TOTAL
        FROM dbo.Votos_Detalle WHERE origen = 'MANUAL'
      `),
      pool.request().query(`
        SELECT 
          ISNULL(SUM(d_fp_votos), 0) AS FP, ISNULL(SUM(d_jp_votos), 0) AS JP, ISNULL(SUM(d_sp_votos), 0) AS [SOMOS PERU],
          ISNULL(SUM(d_frepap_votos), 0) AS FREPAP, ISNULL(SUM(d_verde_votos), 0) AS VERDE, ISNULL(SUM(d_morado_votos), 0) AS MORADO,
          ISNULL(SUM(d_nulos), 0) AS NULOS, ISNULL(SUM(d_vacios), 0) AS VACIOS, ISNULL(SUM(d_total_votos), 0) AS TOTAL
        FROM dbo.Votos_Detalle WHERE origen = 'MANUAL'
      `),
      pool.request().query(`
        SELECT 
          ISNULL(SUM(p_fp_votos), 0) AS FP, ISNULL(SUM(p_jp_votos), 0) AS JP, ISNULL(SUM(p_sp_votos), 0) AS [SOMOS PERU],
          ISNULL(SUM(p_frepap_votos), 0) AS FREPAP, ISNULL(SUM(p_verde_votos), 0) AS VERDE, ISNULL(SUM(p_morado_votos), 0) AS MORADO,
          ISNULL(SUM(p_nulos), 0) AS NULOS, ISNULL(SUM(p_vacios), 0) AS VACIOS, ISNULL(SUM(p_total_votos), 0) AS TOTAL
        FROM dbo.Votos_Detalle WHERE (origen = 'IMAGEN' OR origen = 'OCR')
      `),
      pool.request().query(`
        SELECT 
          ISNULL(SUM(d_fp_votos), 0) AS FP, ISNULL(SUM(d_jp_votos), 0) AS JP, ISNULL(SUM(d_sp_votos), 0) AS [SOMOS PERU],
          ISNULL(SUM(d_frepap_votos), 0) AS FREPAP, ISNULL(SUM(d_verde_votos), 0) AS VERDE, ISNULL(SUM(d_morado_votos), 0) AS MORADO,
          ISNULL(SUM(d_nulos), 0) AS NULOS, ISNULL(SUM(d_vacios), 0) AS VACIOS, ISNULL(SUM(d_total_votos), 0) AS TOTAL
        FROM dbo.Votos_Detalle WHERE (origen = 'IMAGEN' OR origen = 'OCR')
      `)
    ]);

    return {
      totalesProvincial: provRes.recordset[0] || {},
      totalesDistrital: distRes.recordset[0] || {},
      desglose: {
        manualProvincial: manualProv.recordset[0] || {},
        manualDistrital: manualDist.recordset[0] || {},
        ocrProvincial: ocrProv.recordset[0] || {},
        ocrDistrital: ocrDist.recordset[0] || {}
      },
      mesas: mesasRes.recordset.map(r => ({
        mesa: r.mesa,
        origen: r.origen,
        distrito: r.distrito,
        provincia: r.provincia,
        departamento: r.departamento,
        colegio: r.colegio,
        brigadista: r.brigadista,
        fecha: r.fecha,
        votosProvincial: {
          FP: r.p_fp_votos,
          JP: r.p_jp_votos,
          SP: r.p_sp_votos,
          FREPAP: r.p_frepap_votos,
          VERDE: r.p_verde_votos,
          MORADO: r.p_morado_votos,
          NULOS: r.p_nulos,
          VACIOS: r.p_vacios,
          TOTAL: r.p_total_votos
        },
        votosDistrital: {
          FP: r.d_fp_votos,
          JP: r.d_jp_votos,
          SP: r.d_sp_votos,
          FREPAP: r.d_frepap_votos,
          VERDE: r.d_verde_votos,
          MORADO: r.d_morado_votos,
          NULOS: r.d_nulos,
          VACIOS: r.d_vacios,
          TOTAL: r.d_total_votos
        }
      })),
      totalMesasEscrutadas: mesasRes.recordset.length
    };
  }

  async getComparison(filterA, filterB) {
    const pool = await getPool();

    const getSideData = async (side) => {
      const req = pool.request();
      let where = [];

      if (side.level === 'distrito' && side.location && side.location !== 'LIMA') {
        where.push('LTRIM(RTRIM(LOWER(ubicacion))) = LTRIM(RTRIM(LOWER(@loc)))');
        req.input('loc', mssql.VarChar, side.location);
      } else if (side.level === 'provincia' && side.location) {
        where.push('LTRIM(RTRIM(LOWER(provincia))) = LTRIM(RTRIM(LOWER(@loc)))');
        req.input('loc', mssql.VarChar, side.location);
      } else if (side.level === 'colegio' && side.location) {
        where.push('LTRIM(RTRIM(LOWER(colegio))) = LTRIM(RTRIM(LOWER(@loc)))');
        req.input('loc', mssql.VarChar, side.location);
      } else if (side.level === 'mesa' && side.location) {
        where.push('LTRIM(RTRIM(LOWER(numero_mesa))) = LTRIM(RTRIM(LOWER(@loc)))');
        req.input('loc', mssql.VarChar, side.location);
      }

      if (side.origenFilter) {
        if (side.origenFilter.toUpperCase() === 'IMAGEN' || side.origenFilter.toUpperCase() === 'OCR') {
          where.push('(origen = \'IMAGEN\' OR origen = \'OCR\')');
        } else if (side.origenFilter.toUpperCase() === 'MANUAL') {
          where.push('origen = \'MANUAL\'');
        }
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const isProvincial = side.votoTipo === 'provincial';
      const isDistrital = side.votoTipo === 'distrital';

      let query = '';
      if (isProvincial) {
        query = `
          SELECT 
            ISNULL(SUM(p_fp_votos), 0) AS FP, ISNULL(SUM(p_jp_votos), 0) AS JP, ISNULL(SUM(p_sp_votos), 0) AS [SOMOS PERU],
            ISNULL(SUM(p_frepap_votos), 0) AS FREPAP, ISNULL(SUM(p_verde_votos), 0) AS VERDE, ISNULL(SUM(p_morado_votos), 0) AS MORADO,
            ISNULL(SUM(p_nulos), 0) AS NULOS, ISNULL(SUM(p_vacios), 0) AS VACIOS, ISNULL(SUM(p_total_votos), 0) AS TOTAL
          FROM dbo.Votos_Detalle ${whereClause}
        `;
      } else if (isDistrital) {
        query = `
          SELECT 
            ISNULL(SUM(d_fp_votos), 0) AS FP, ISNULL(SUM(d_jp_votos), 0) AS JP, ISNULL(SUM(d_sp_votos), 0) AS [SOMOS PERU],
            ISNULL(SUM(d_frepap_votos), 0) AS FREPAP, ISNULL(SUM(d_verde_votos), 0) AS VERDE, ISNULL(SUM(d_morado_votos), 0) AS MORADO,
            ISNULL(SUM(d_nulos), 0) AS NULOS, ISNULL(SUM(d_vacios), 0) AS VACIOS, ISNULL(SUM(d_total_votos), 0) AS TOTAL
          FROM dbo.Votos_Detalle ${whereClause}
        `;
      } else {
        // Provincial + Distrital combinados
        query = `
          SELECT 
            ISNULL(SUM(p_fp_votos + d_fp_votos), 0) AS FP,
            ISNULL(SUM(p_jp_votos + d_jp_votos), 0) AS JP,
            ISNULL(SUM(p_sp_votos + d_sp_votos), 0) AS [SOMOS PERU],
            ISNULL(SUM(p_frepap_votos + d_frepap_votos), 0) AS FREPAP,
            ISNULL(SUM(p_verde_votos + d_verde_votos), 0) AS VERDE,
            ISNULL(SUM(p_morado_votos + d_morado_votos), 0) AS MORADO,
            ISNULL(SUM(p_nulos + d_nulos), 0) AS NULOS,
            ISNULL(SUM(p_vacios + d_vacios), 0) AS VACIOS,
            ISNULL(SUM(p_total_votos + d_total_votos), 0) AS TOTAL
          FROM dbo.Votos_Detalle ${whereClause}
        `;
      }

      const res = await req.query(query);
      return res.recordset[0] || {};
    };

    const [dataA, dataB] = await Promise.all([
      getSideData(filterA || {}),
      getSideData(filterB || {})
    ]);

    return {
      sideA: dataA,
      sideB: dataB
    };
  }
}

module.exports = SqlVotesRepository;
