class GetCoordinatorsUseCase {
  constructor(coordinatorsRepository) {
    this.coordinatorsRepository = coordinatorsRepository;
  }

  async execute(filter = {}) {
    const [coordinatorsList, aggregates] = await Promise.all([
      this.coordinatorsRepository.getCoordinators(filter),
      this.coordinatorsRepository.getAggregates()
    ]);

    // Agrupar por coordinador / local para la grilla de tarjetas
    const grouped = {};
    coordinatorsList.forEach(c => {
      const coordName = c.coordinadorNombre || 'Sin Coordinador Asignado';
      const key = `${coordName}_${c.local || ''}`;
      if (!grouped[key]) {
        grouped[key] = {
          coordinadorNombre: coordName,
          coordinadorDni: c.coordinadorDni || '',
          local: c.local || '',
          distrito: c.distrito || '',
          totalMesas: 0,
          personerosAsistieron: 0,
          personerosFaltantes: 0,
          personeros: []
        };
      }
      grouped[key].totalMesas += 1;
      const isAsistio = c.confirmacion === 'SI' || c.confirmacion === 'CONFIRMADO';
      if (isAsistio) {
        grouped[key].personerosAsistieron += 1;
      } else {
        grouped[key].personerosFaltantes += 1;
      }
      grouped[key].personeros.push({
        nombre: c.personeroNombre,
        dni: c.personeroDni,
        mesa: c.mesa,
        confirmacion: c.confirmacion,
        fotoUrl: c.foto_url,
        fechaHora: c.fechaHora
      });
    });

    const totalPersonasAsistieron = coordinatorsList.filter(c => c.confirmacion === 'SI' || c.confirmacion === 'CONFIRMADO').length;
    const totalPersonasEsperadas = coordinatorsList.length;
    const porcentajeAsistencia = totalPersonasEsperadas > 0
      ? ((totalPersonasAsistieron / totalPersonasEsperadas) * 100).toFixed(1)
      : '0.0';

    return {
      kpis: {
        totalMesasEsperadas: aggregates.totalMesasEsperadas,
        personasQueAsistieron: totalPersonasAsistieron,
        coordinadoresFaltantes: aggregates.coordinadoresFaltantes,
        porcentajeAsistencia: porcentajeAsistencia
      },
      coordinadoresAgrupados: Object.values(grouped),
      totalConfirmadas: totalPersonasAsistieron,
      totalPorConfirmar: Math.max(0, aggregates.totalMesasEsperadas - totalPersonasAsistieron)
    };
  }
}

module.exports = GetCoordinatorsUseCase;
