function normalizeStr(str) {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

class GetCoordinatorsUseCase {
  constructor(coordinatorsRepository) {
    this.coordinatorsRepository = coordinatorsRepository;
  }

  async execute(filter = {}) {
    const [coordinatorsList, aggregates, colegiosList] = await Promise.all([
      this.coordinatorsRepository.getCoordinators(filter),
      this.coordinatorsRepository.getAggregates(filter),
      this.coordinatorsRepository.getColegiosList ? this.coordinatorsRepository.getColegiosList() : []
    ]);

    const colegios = colegiosList.map(c => ({
      distrito: normalizeStr(c.distrito),
      colegio: normalizeStr(c.colegio),
      num_mesas: c.num_mesas || 0
    }));

    function getMesasForCoordinator(distrito, localStr, tipo) {
      if (!localStr || localStr === 'No aplica') {
        if (tipo === 'Coordinador Distrital') {
          const dNorm = normalizeStr(distrito);
          return colegios
            .filter(c => c.distrito === dNorm)
            .reduce((acc, c) => acc + c.num_mesas, 0);
        }
        return 0;
      }

      const cleanDist = normalizeStr(distrito);
      const cleanLocal = normalizeStr(localStr);

      const localNames = cleanLocal.split(',').map(s => s.trim()).filter(Boolean);
      let sumMesas = 0;

      for (const loc of localNames) {
        let matched = colegios.find(c => c.distrito === cleanDist && c.colegio === loc);
        if (!matched) {
          matched = colegios.find(c => c.distrito === cleanDist && (c.colegio.includes(loc) || loc.includes(c.colegio)));
        }
        if (!matched) {
          matched = colegios.find(c => c.colegio.includes(loc) || loc.includes(c.colegio));
        }
        if (matched) {
          sumMesas += matched.num_mesas;
        }
      }

      if (sumMesas === 0 && tipo === 'Coordinador Distrital') {
        return colegios
          .filter(c => c.distrito === cleanDist)
          .reduce((acc, c) => acc + c.num_mesas, 0);
      }

      return sumMesas > 0 ? sumMesas : 1;
    }

    // Agrupar por coordinador / local para la grilla de tarjetas
    const grouped = {};
    coordinatorsList.forEach(c => {
      const coordName = c.coordinadorNombre || 'Sin Coordinador Asignado';
      const key = `${coordName}_${c.local || ''}`;
      if (!grouped[key]) {
        const calculatedMesas = getMesasForCoordinator(c.distrito, c.local, c.tipoCoordinador);
        grouped[key] = {
          coordinadorNombre: coordName,
          coordinadorDni: c.coordinadorDni || '',
          local: c.local || '',
          distrito: c.distrito || '',
          tipoCoordinador: c.tipoCoordinador || 'Coordinador',
          totalMesas: calculatedMesas,
          personerosAsistieron: 0,
          personerosFaltantes: calculatedMesas,
          personeros: []
        };
      }
      const isAsistio = c.confirmacion === 'SI' || c.confirmacion === 'CONFIRMADO';
      if (isAsistio) {
        grouped[key].personerosAsistieron += 1;
        grouped[key].personerosFaltantes = Math.max(0, grouped[key].totalMesas - grouped[key].personerosAsistieron);
      }
      if (c.personeroDni || c.personeroNombre) {
        grouped[key].personeros.push({
          nombre: c.personeroNombre,
          dni: c.personeroDni,
          mesa: c.mesa,
          confirmacion: c.confirmacion,
          fotoUrl: c.foto_url,
          fechaHora: c.fechaHora
        });
      }
    });

    const totalPersonasAsistieron = coordinatorsList.filter(c => c.confirmacion === 'SI' || c.confirmacion === 'CONFIRMADO').length;
    const totalEsperadas = aggregates.totalMesasEsperadas > 0 ? aggregates.totalMesasEsperadas : coordinatorsList.length;
    const porcentajeAsistencia = totalEsperadas > 0
      ? ((totalPersonasAsistieron / totalEsperadas) * 100).toFixed(1)
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
