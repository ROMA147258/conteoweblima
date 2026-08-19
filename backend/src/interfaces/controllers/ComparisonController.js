class ComparisonController {
  constructor(getComparisonUseCase) {
    this.getComparisonUseCase = getComparisonUseCase;
  }

  async getComparison(req, res, next) {
    try {
      const filterA = {
        level: req.query.levelA || 'distrito',
        location: req.query.locationA || 'Ate',
        votoTipo: req.query.votoTipoA || 'todos',
        origenFilter: req.query.origenA || ''
      };

      const filterB = {
        level: req.query.levelB || 'distrito',
        location: req.query.locationB || 'San Juan de Lurigancho',
        votoTipo: req.query.votoTipoB || 'todos',
        origenFilter: req.query.origenB || ''
      };

      const data = await this.getComparisonUseCase.execute({ filterA, filterB });
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ComparisonController;
