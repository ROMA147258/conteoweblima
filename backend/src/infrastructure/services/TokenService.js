const jwt = require('jsonwebtoken');
const config = require('../../config/environment');

class TokenService {
  static generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, config.auth.jwtSecret, { expiresIn });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtSecret);
    } catch (_) {
      return null;
    }
  }
}

module.exports = TokenService;
