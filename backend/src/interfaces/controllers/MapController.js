class MapController {
  constructor(getMapDataUseCase) {
    this.getMapDataUseCase = getMapDataUseCase;
  }

  async getMapData(req, res, next) {
    try {
      const filter = {
        distrito: req.query.distrito || '',
        provincia: req.query.provincia || ''
      };

      const data = await this.getMapDataUseCase.execute(filter);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MapController;
