const TokenService = require('../../infrastructure/services/TokenService');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere un token de acceso válido.'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = TokenService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.'
    });
  }

  req.user = decoded;
  next();
}

module.exports = authMiddleware;
