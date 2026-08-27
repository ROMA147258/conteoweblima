const { query } = require('../database/postgresPool');

class SqlSchoolsRepository {
  async getAllSchools(filter = {}) {
    let where = [];
    let params = [];
    let paramIndex = 1;

    if (filter.distrito && filter.distrito !== 'todos' && filter.distrito !== 'LIMA') {
      where.push(`TRIM(LOWER(distrito)) = TRIM(LOWER($${paramIndex}))`);
      params.push(filter.distrito);
      paramIndex++;
    }
    if (filter.provincia && filter.provincia !== 'todas' && filter.provincia !== 'Lima') {
      where.push(`TRIM(LOWER(provincia)) = TRIM(LOWER($${paramIndex}))`);
      params.push(filter.provincia);
      paramIndex++;
    }

    const whereStr = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT 
        id,
        ubigeo,
        departamento,
        provincia,
        distrito,
        colegio,
        direccion,
        COALESCE(num_mesas, 0)::int AS num_mesas,
        latitud,
        longitud,
        coordenadas_gps,
        radio_metros,
        estado
      FROM colegios
      ${whereStr}
      ORDER BY distrito ASC, colegio ASC
    `;

    try {
      const res = await query(sql, params);
      return res.rows || [];
    } catch (_) {
      return [];
    }
  }

  async getMapAggregates(filter = {}) {
    const schools = await this.getAllSchools(filter);

    let votesRows = [];
    try {
      const votesQuery = `
        SELECT 
          ubicacion AS distrito,
          colegio,
          COUNT(DISTINCT numero_mesa)::int AS mesas_escrutadas,
          COALESCE(SUM(p_total_votos + d_total_votos), 0)::int AS total_votos,
          COALESCE(SUM(p_fp_votos + d_fp_votos), 0)::int AS "FP",
          COALESCE(SUM(p_jp_votos + d_jp_votos), 0)::int AS "JP",
          COALESCE(SUM(p_sp_votos + d_sp_votos), 0)::int AS "SP",
          COALESCE(SUM(p_frepap_votos + d_frepap_votos), 0)::int AS "FREPAP",
          COALESCE(SUM(p_verde_votos + d_verde_votos), 0)::int AS "VERDE",
          COALESCE(SUM(p_morado_votos + d_morado_votos), 0)::int AS "MORADO",
          COALESCE(SUM(p_nulos + d_nulos), 0)::int AS "NULOS",
          COALESCE(SUM(p_vacios + d_vacios), 0)::int AS "VACIOS"
        FROM votos_detalle
        GROUP BY ubicacion, colegio
      `;
      const votesRes = await query(votesQuery);
      votesRows = votesRes.rows || [];
    } catch (_) {}

    const votesMap = {};
    const districtSummary = {};

    votesRows.forEach(r => {
      const colKey = `${(r.distrito || '').trim().toUpperCase()}_${(r.colegio || '').trim().toUpperCase()}`;
      votesMap[colKey] = r;

      const distKey = (r.distrito || '').trim().toUpperCase();
      if (!districtSummary[distKey]) {
        districtSummary[distKey] = {
          distrito: r.distrito,
          mesasEscrutadas: 0,
          totalVotos: 0,
          votosPorPartido: { FP: 0, JP: 0, SP: 0, FREPAP: 0, VERDE: 0, MORADO: 0, NULOS: 0, VACIOS: 0 }
        };
      }
      districtSummary[distKey].mesasEscrutadas += r.mesas_escrutadas || 0;
      districtSummary[distKey].totalVotos += r.total_votos || 0;
      districtSummary[distKey].votosPorPartido.FP += r.FP || 0;
      districtSummary[distKey].votosPorPartido.JP += r.JP || 0;
      districtSummary[distKey].votosPorPartido.SP += r.SP || 0;
      districtSummary[distKey].votosPorPartido.FREPAP += r.FREPAP || 0;
      districtSummary[distKey].votosPorPartido.VERDE += r.VERDE || 0;
      districtSummary[distKey].votosPorPartido.MORADO += r.MORADO || 0;
      districtSummary[distKey].votosPorPartido.NULOS += r.NULOS || 0;
      districtSummary[distKey].votosPorPartido.VACIOS += r.VACIOS || 0;
    });

    const schoolsWithData = schools.map(s => {
      const colKey = `${(s.distrito || '').trim().toUpperCase()}_${(s.colegio || '').trim().toUpperCase()}`;
      const vData = votesMap[colKey];
      return {
        id: s.id,
        colegio: s.colegio,
        distrito: s.distrito,
        provincia: s.provincia,
        direccion: s.direccion,
        numMesas: s.num_mesas,
        latitud: s.latitud ? parseFloat(s.latitud) : null,
        longitud: s.longitud ? parseFloat(s.longitud) : null,
        mesasEscrutadas: vData ? vData.mesas_escrutadas : 0,
        totalVotos: vData ? vData.total_votos : 0,
        resultados: vData ? {
          FP: vData.FP,
          JP: vData.JP,
          SP: vData.SP,
          FREPAP: vData.FREPAP,
          VERDE: vData.VERDE,
          MORADO: vData.MORADO,
          NULOS: vData.NULOS,
          VACIOS: vData.VACIOS
        } : null
      };
    });

    let totalExpectedMesas = 29121;
    try {
      const totalExpectedMesasRes = await query('SELECT COALESCE(SUM(num_mesas), 0)::int AS total_mesas FROM colegios');
      totalExpectedMesas = totalExpectedMesasRes.rows[0]?.total_mesas || 29121;
    } catch (_) {}

    return {
      colegios: schoolsWithData,
      distritosResumen: districtSummary,
      totalMesasEsperadas: totalExpectedMesas,
      totalMesasEscrutadas: Object.values(votesMap).reduce((acc, v) => acc + (v.mesas_escrutadas || 0), 0),
      totalVotos: Object.values(votesMap).reduce((acc, v) => acc + (v.total_votos || 0), 0)
    };
  }
}

module.exports = SqlSchoolsRepository;
