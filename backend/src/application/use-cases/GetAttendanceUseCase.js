class GetAttendanceUseCase {
  constructor(attendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  async execute(filter = {}) {
    const [attendanceList, aggregates] = await Promise.all([
      this.attendanceRepository.getAttendanceList(filter),
      this.attendanceRepository.getAggregates()
    ]);

    return {
      kpis: {
        totalPersonerosRegistrados: aggregates.totalPersonerosRegistrados,
        primeraAsistencia: aggregates.primeraAsistencia,
        segundaAsistencia: aggregates.segundaAsistencia,
        distritosConReporte: aggregates.distritosConReporte
      },
      charts: {
        conf1Global: {
          confirmados: aggregates.primeraAsistencia,
          faltantes: aggregates.faltantesPrimera
        },
        conf1PorDistrito: aggregates.porDistrito,
        conf2Global: {
          confirmados: aggregates.segundaAsistencia,
          faltantes: aggregates.faltantesSegunda
        },
        conf2PorDistrito: {}
      },
      registros: attendanceList
    };
  }
}

module.exports = GetAttendanceUseCase;
