class GetComparisonUseCase {
  constructor(votesRepository) {
    this.votesRepository = votesRepository;
  }

  async execute({ filterA, filterB }) {
    const raw = await this.votesRepository.getComparison(filterA, filterB);
    const sideA = raw.sideA || {};
    const sideB = raw.sideB || {};

    const parties = ['FP', 'JP', 'SOMOS PERU', 'FREPAP', 'VERDE', 'MORADO', 'NULOS', 'BLANCOS'];
    const partyLabels = {
      FP: 'Fuerza Popular',
      JP: 'Juntos por el Perú',
      'SOMOS PERU': 'Somos Perú',
      FREPAP: 'FREPAP',
      VERDE: 'Verde',
      MORADO: 'Morado',
      NULOS: 'Nulos',
      BLANCOS: 'Blancos',
      VACIOS: 'Blancos'
    };

    const comparativa = parties.map(p => {
      const vA = sideA[p] ?? (p === 'BLANCOS' ? (sideA.BLANCOS ?? sideA.VACIOS ?? 0) : 0);
      const vB = sideB[p] ?? (p === 'BLANCOS' ? (sideB.BLANCOS ?? sideB.VACIOS ?? 0) : 0);
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

    const getLeader = (side, total) => {
      const partyCandidates = [
        { key: 'FP', label: 'Fuerza Popular', votes: side.FP || 0 },
        { key: 'JP', label: 'Juntos por el Perú', votes: side.JP || 0 },
        { key: 'SOMOS PERU', label: 'Somos Perú', votes: side.SP || side['SOMOS PERU'] || 0 },
        { key: 'FREPAP', label: 'FREPAP', votes: side.FR || side.FREPAP || 0 },
        { key: 'VERDE', label: 'Verde', votes: side.VE || side.VERDE || 0 },
        { key: 'MORADO', label: 'Morado', votes: side.MO || side.MORADO || 0 }
      ];
      partyCandidates.sort((a, b) => b.votes - a.votes);
      const top = partyCandidates[0];
      if (!top || top.votes === 0 || total === 0) {
        return { label: 'Sin votos', pct: '0.0', key: '' };
      }
      const pct = ((top.votes / total) * 100).toFixed(1);
      return { label: top.label, pct, key: top.key, votes: top.votes };
    };

    const liderA = getLeader(sideA, totalA);
    const liderB = getLeader(sideB, totalB);

    return {
      sideA: {
        raw: sideA,
        total: totalA,
        mesas: sideA.mesas || 0,
        lider: liderA
      },
      sideB: {
        raw: sideB,
        total: totalB,
        mesas: sideB.mesas || 0,
        lider: liderB
      },
      brechaAbsoluta,
      variacionPct,
      comparativa
    };
  }
}

module.exports = GetComparisonUseCase;
