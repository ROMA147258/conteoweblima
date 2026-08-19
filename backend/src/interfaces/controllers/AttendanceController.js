class AttendanceController {
  constructor(getAttendanceUseCase) {
    this.getAttendanceUseCase = getAttendanceUseCase;
  }

  async getAttendance(req, res, next) {
    try {
      const filter = {
        distrito: req.query.distrito || '',
        local: req.query.local || ''
      };

      const data = await this.getAttendanceUseCase.execute(filter);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AttendanceController;
