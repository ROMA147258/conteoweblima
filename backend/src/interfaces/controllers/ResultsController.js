class ResultsController {
  constructor(getResultsUseCase) {
    this.getResultsUseCase = getResultsUseCase;
  }

  async getResults(req, res, next) {
    try {
      const filters = {
        departamento: req.query.departamento || req.query.dep || 'Lima',
        provincia: req.query.provincia || req.query.prov || '',
        distrito: req.query.distrito || req.query.dist || '',
        colegio: req.query.colegio || req.query.local || '',
        mesa: req.query.mesa || '',
        origen: req.query.origen || '',
        partido: req.query.partido || ''
      };

      const data = await this.getResultsUseCase.execute(filters);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ResultsController;
