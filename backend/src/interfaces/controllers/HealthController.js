class HealthController {
  constructor(healthCheckUseCase) {
    this.healthCheckUseCase = healthCheckUseCase;
  }

  async check(req, res, next) {
    try {
      const data = await this.healthCheckUseCase.execute();
      const statusCode = data.status === 'ok' ? 200 : 503;
      return res.status(statusCode).json({
        success: data.status === 'ok',
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = HealthController;
