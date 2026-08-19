class AuthController {
  constructor(loginUseCase) {
    this.loginUseCase = loginUseCase;
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await this.loginUseCase.execute({ username, password });
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.message
      });
    }
  }

  async logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  }
}

module.exports = AuthController;
