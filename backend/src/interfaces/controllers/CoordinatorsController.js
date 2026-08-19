class CoordinatorsController {
  constructor(getCoordinatorsUseCase) {
    this.getCoordinatorsUseCase = getCoordinatorsUseCase;
  }

  async getCoordinators(req, res, next) {
    try {
      const filter = {
        distrito: req.query.distrito || '',
        local: req.query.local || req.query.colegio || ''
      };

      const data = await this.getCoordinatorsUseCase.execute(filter);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CoordinatorsController;
