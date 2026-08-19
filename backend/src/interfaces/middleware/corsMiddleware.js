const cors = require('cors');
const config = require('../../config/environment');

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como scripts locales, Postman, apps móviles)
    if (!origin) return callback(null, true);
    if (config.corsOrigin === '*' || config.corsOrigin.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true); // Modo permisivo para desarrollo
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);
