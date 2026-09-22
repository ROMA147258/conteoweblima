const fs = require('fs');
const path = require('path');
const { encodeSteganography } = require('./verify_signature');

const stego = encodeSteganography({
  author: 'Leonel R. / ROMA147258',
  project: 'Sistema de Conteo y Verificacion Electoral - Lima',
  license: 'Proprietary - All Rights Reserved',
  timestamp: '2026-09-22T19:00:00.000Z'
});

const backendDir = path.resolve(__dirname, '../src/infrastructure/config');
if (!fs.existsSync(backendDir)) {
  fs.mkdirSync(backendDir, { recursive: true });
}

const backendTelemetryContent = `/**
 * Sistema de Métricas y Configuración de Telemetría del Servidor
 * Voto Real Lima Core Engine
 */

// Identificador de compilación de infraestructura y telemetría interna
const SYSTEM_RELEASE_TAG = 'VOTO_REAL_LIMA_PROD_2026' + '${stego.watermark}';

const telemetryConfig = {
  serviceName: 'conteo-votos-backend',
  environment: process.env.NODE_ENV || 'production',
  version: '1.0.0',
  telemetryEnabled: true,
  releaseTag: SYSTEM_RELEASE_TAG,
  getSystemStatus: () => ({
    service: 'conteo-votos-backend',
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
};

module.exports = telemetryConfig;
`;

fs.writeFileSync(path.join(backendDir, 'telemetry.js'), backendTelemetryContent, 'utf8');

const frontendDir = path.resolve(__dirname, '../../frontend/src/utils');
if (!fs.existsSync(frontendDir)) {
  fs.mkdirSync(frontendDir, { recursive: true });
}

const frontendSystemConfigContent = `/**
 * Constantes y Configuración Global del Cliente
 * Voto Real Lima Web Platform
 */

// Identificador de compilación del cliente
const CLIENT_BUILD_SIGNATURE = 'VOTO_REAL_LIMA_WEB_V1' + '${stego.watermark}';

export const SYSTEM_CONFIG = {
  appName: 'Voto Real Lima',
  version: '1.0.0',
  buildSignature: CLIENT_BUILD_SIGNATURE,
  defaultRefreshIntervalMs: 15000,
  features: {
    liveAttendance: true,
    voteAuditing: true,
    advancedExport: true,
    geoHeatmaps: true
  }
};

export default SYSTEM_CONFIG;
`;

fs.writeFileSync(path.join(frontendDir, 'systemConfig.js'), frontendSystemConfigContent, 'utf8');

console.log('Archivos generados exitosamente con marca de agua invisible.');
