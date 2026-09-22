const alertService = require('../../infrastructure/services/AlertNotificationService');

function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  // Si es un error crítico no controlado 500, disparar alerta automática
  if (statusCode >= 500) {
    alertService.notifyCriticalError(err, req).catch(() => {});
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

module.exports = errorHandler;
