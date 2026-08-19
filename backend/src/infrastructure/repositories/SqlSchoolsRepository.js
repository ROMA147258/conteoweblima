const { getPool, mssql } = require('../database/sqlServerPool');

class SqlSchoolsRepository {
  async getAllSchools(filter = {}) {
    const pool = await getPool();
    const req = pool.request();

    let where = [];
    if (filter.distrito && filter.distrito !== 'todos' && filter.distrito !== 'LIMA') {
      where.push('LTRIM(RTRIM(LOWER(distrito))) = LTRIM(RTRIM(LOWER(@distrito)))');
      req.input('distrito', mssql.VarChar, filter.distrito);
    }
    if (filter.provincia && filter.provincia !== 'todas' && filter.provincia !== 'Lima') {
      where.push('LTRIM(RTRIM(LOWER(provincia))) = LTRIM(RTRIM(LOWER(@provincia)))');
      req.input('provincia', mssql.VarChar, filter.provincia);
    }

    const whereStr = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT 
        id,
        ubigeo,
        departamento,
        provincia,
        distrito,
        colegio,
        direccion,
        ISNULL(num_mesas, 0) AS num_mesas,
        latitud,
        longitud,
        coordenadas_gps,
        radio_metros,
        estado
      FROM dbo.Colegios
      ${whereStr}
      ORDER BY distrito ASC, colegio ASC
    `;

    const res = await req.query(query);
    return res.recordset || [];
  }

  async getMapAggregates(filter = {}) {
    const pool = await getPool();
    
    // Obtener colegios con coordenadas válidas
    const schools = await this.getAllSchools(filter);

    // Obtener mesas escrutadas y votos por colegio/distrito
    const votesQuery = `
      SELECT 
        ubicacion AS distrito,
        colegio,
        COUNT(DISTINCT numero_mesa) AS mesas_escrutadas,
        SUM(p_total_votos + d_total_votos) AS total_votos,
        SUM(p_fp_votos + d_fp_votos) AS FP,
        SUM(p_jp_votos + d_jp_votos) AS JP,
        SUM(p_sp_votos + d_sp_votos) AS SP,
        SUM(p_frepap_votos + d_frepap_votos) AS FREPAP,
        SUM(p_verde_votos + d_verde_votos) AS VERDE,
        SUM(p_morado_votos + d_morado_votos) AS MORADO,
        SUM(p_nulos + d_nulos) AS NULOS,
        SUM(p_vacios + d_vacios) AS VACIOS
      FROM dbo.Votos_Detalle
      GROUP BY ubicacion, colegio
    `;

    const votesRes = await pool.request().query(votesQuery);
    const votesMap = {};
    const districtSummary = {};

    (votesRes.recordset || []).forEach(r => {
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

    // Mapear colegios con datos de resultados
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

    // Totales de mesas esperadas
    const totalExpectedMesasRes = await pool.request().query('SELECT SUM(num_mesas) AS total_mesas FROM dbo.Colegios');
    const totalExpectedMesas = totalExpectedMesasRes.recordset[0]?.total_mesas || 3648;

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
