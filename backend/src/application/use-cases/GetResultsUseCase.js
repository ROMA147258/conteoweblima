class GetResultsUseCase {
  constructor(votesRepository) {
    this.votesRepository = votesRepository;
  }

  async execute(filters = {}) {
    const data = await this.votesRepository.getResults(filters);
    return data;
  }
}

module.exports = GetResultsUseCase;
