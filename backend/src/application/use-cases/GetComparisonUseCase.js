class GetComparisonUseCase {
  constructor(votesRepository) {
    this.votesRepository = votesRepository;
  }

  async execute({ filterA, filterB }) {
    const raw = await this.votesRepository.getComparison(filterA, filterB);
    const sideA = raw.sideA || {};
    const sideB = raw.sideB || {};

    const parties = ['FP', 'JP', 'SOMOS PERU', 'FREPAP', 'VERDE', 'MORADO', 'NULOS', 'VACIOS'];
    const partyLabels = {
      FP: 'Fuerza Popular',
      JP: 'Juntos por el Perú',
      'SOMOS PERU': 'Somos Perú',
      FREPAP: 'FREPAP',
      VERDE: 'Verde',
      MORADO: 'Morado',
      NULOS: 'Nulos',
      VACIOS: 'Vacíos'
    };

    const comparativa = parties.map(p => {
      const vA = sideA[p] || 0;
      const vB = sideB[p] || 0;
      return {
        partido: partyLabels[p] || p,
        key: p,
        ladoA: vA,
        ladoB: vB,
        diferencia: vA - vB
      };
    });

    const totalA = sideA.TOTAL || 0;
    const totalB = sideB.TOTAL || 0;
    const brechaAbsoluta = Math.abs(totalA - totalB);
    const variacionPct = totalA > 0 ? (((totalB - totalA) / totalA) * 100).toFixed(1) : '0.0';

    return {
      sideA: {
        raw: sideA,
        total: totalA
      },
      sideB: {
        raw: sideB,
        total: totalB
      },
      brechaAbsoluta,
      variacionPct,
      comparativa
    };
  }
}

module.exports = GetComparisonUseCase;
