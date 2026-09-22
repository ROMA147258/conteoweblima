/**
 * ==============================================================================
 * SISTEMA DE ALERTAS AUTOMÁTICAS Y TELEMETRÍA ACTIVA
 * Conteo y Verificación Electoral - Voto Real Lima
 * ==============================================================================
 */

const os = require('os');
const config = require('../../config/environment');

class AlertNotificationService {
  constructor() {
    this.recipient = config.alert?.recipient || 'ricardo27romax@outlook.com';
    this.enabled = config.alert?.enabled !== false;
    this.recentAlerts = new Map();
    this.cooldownMs = 60000; // 60 segundos de cooldown entre alertas duplicadas
  }

  /**
   * Obtiene la telemetría actual del sistema
   */
  getTelemetrySnapshot() {
    return {
      timestamp: new Date().toISOString(),
      service: 'conteo-votos-backend',
      environment: config.nodeEnv,
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      hostname: os.hostname(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: {
        rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
        heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)
      },
      alertRecipient: this.recipient,
      telemetryStatus: 'ACTIVE_MONITORING'
    };
  }

  /**
   * Verifica si la alerta está en periodo de cooldown para evitar spam
   */
  _isRateLimited(alertKey) {
    const now = Date.now();
    const lastSent = this.recentAlerts.get(alertKey);
    if (lastSent && now - lastSent < this.cooldownMs) {
      return true;
    }
    this.recentAlerts.set(alertKey, now);
    return false;
  }

  /**
   * Envía una alerta automática y registra la telemetría
   */
  async sendAlert({ type = 'INFO', title, message, details = {}, severity = 'NORMAL' }) {
    if (!this.enabled) return null;

    const alertKey = `${type}_${title}`;
    if (this._isRateLimited(alertKey)) {
      return { skipped: true, reason: 'COOLDOWN_ACTIVE' };
    }

    const telemetry = this.getTelemetrySnapshot();
    const alertPayload = {
      recipient: this.recipient,
      severity,
      type,
      title,
      message,
      details,
      telemetry,
      dispatchedAt: new Date().toISOString()
    };

    // Registro visual y estructurado de telemetría activa en consola/logs
    console.log('\n🚨 ==================== [TELEMETRY ALERT DISPATCHED] ====================');
    console.log(`📧 Destinatario:   ${this.recipient}`);
    console.log(`⚡ Severidad:      [${severity}] | Tipo: [${type}]`);
    console.log(`📌 Título:         ${title}`);
    console.log(`📝 Mensaje:        ${message}`);
    if (Object.keys(details).length > 0) {
      console.log(`🔍 Detalles:       ${JSON.stringify(details, null, 2)}`);
    }
    console.log(`📊 Telemetría:     Memoria: ${telemetry.memoryUsageMB.heapUsed}MB / Uptime: ${telemetry.uptimeSeconds}s`);
    console.log('==========================================================================\n');

    return {
      success: true,
      recipient: this.recipient,
      alertPayload
    };
  }

  /**
   * Notificación de inicio de servidor
   */
  async notifyServerStartup(port, dbStatus = 'CONNECTED') {
    return this.sendAlert({
      type: 'SYSTEM_STARTUP',
      severity: 'INFO',
      title: '🗳️ Servidor de Conteo de Votos Iniciado',
      message: `El backend de Voto Real Lima se ha iniciado correctamente en el puerto ${port}.`,
      details: {
        port,
        dbStatus,
        nodeEnv: config.nodeEnv
      }
    });
  }

  /**
   * Notificación de error crítico de base de datos
   */
  async notifyDatabaseError(error) {
    return this.sendAlert({
      type: 'DATABASE_ERROR',
      severity: 'CRITICAL',
      title: '⚠️ Fallo Crítico en Conexión a Base de Datos',
      message: error?.message || 'Error de conexión a PostgreSQL',
      details: {
        errorCode: error?.code,
        errorStack: error?.stack?.split('\n').slice(0, 3).join(' ')
      }
    });
  }

  /**
   * Notificación de incidente de seguridad o ataque de fuerza bruta
   */
  async notifySecurityIncident(incidentType, details = {}) {
    return this.sendAlert({
      type: 'SECURITY_INCIDENT',
      severity: 'SECURITY',
      title: `🛡️ Incidente de Seguridad Detectado: ${incidentType}`,
      message: `Se ha registrado una actividad sospechosa o bloqueo de seguridad en la plataforma.`,
      details
    });
  }

  /**
   * Notificación de error no controlado (500)
   */
  async notifyCriticalError(err, req) {
    return this.sendAlert({
      type: 'UNHANDLED_EXCEPTION',
      severity: 'HIGH',
      title: '🚨 Error 500 no controlado en la API',
      message: err?.message || 'Error interno del servidor',
      details: {
        method: req?.method,
        url: req?.originalUrl,
        ip: req?.ip,
        userAgent: req?.headers ? req.headers['user-agent'] : 'unknown'
      }
    });
  }
}

const alertService = new AlertNotificationService();
module.exports = alertService;
