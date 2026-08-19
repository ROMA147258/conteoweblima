/**
 * Interfaz de Repositorio de Votos (Contrato de Dominio)
 */
export class IVotesRepository {
  async getAggregatedVotes(filters) {
    throw new Error('Método no implementado');
  }

  async getComparisonVotes(filters) {
    throw new Error('Método no implementado');
  }
}
