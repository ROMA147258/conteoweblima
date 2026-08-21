class ComparisonController {
  constructor(getComparisonUseCase) {
    this.getComparisonUseCase = getComparisonUseCase;
  }

  async getComparison(req, res, next) {
    try {
      const filterA = {
        level: req.query.levelA || 'distrito',
        location: req.query.locationA || '',
        votoTipo: req.query.votoTipoA || 'todos',
        origen: req.query.origenA || req.query.origenFilterA || ''
      };

      const filterB = {
        level: req.query.levelB || 'distrito',
        location: req.query.locationB || '',
        votoTipo: req.query.votoTipoB || 'todos',
        origen: req.query.origenB || req.query.origenFilterB || ''
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
