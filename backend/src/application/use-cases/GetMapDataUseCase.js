class GetMapDataUseCase {
  constructor(schoolsRepository) {
    this.schoolsRepository = schoolsRepository;
  }

  async execute(filter = {}) {
    const data = await this.schoolsRepository.getMapAggregates(filter);
    return data;
  }
}

module.exports = GetMapDataUseCase;
