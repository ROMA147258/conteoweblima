const cors = require('cors');

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const clean = origin.replace(/\/$/, '').toLowerCase();

  // 1. Dominio oficial de producción y subdominios de Vercel
  if (clean === 'https://conteoweblima.vercel.app' || clean.endsWith('.vercel.app')) {
    return true;
  }

  // 2. Tunnels de Cloudflare
  if (clean.endsWith('.trycloudflare.com') || clean.endsWith('.cloudflare.com')) {
    return true;
  }

  // 3. Localhost y 127.0.0.1 en cualquier puerto (5173, 5174, 3000, 8080, etc.)
  if (/^http:\/\/localhost(:\d+)?$/.test(clean) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(clean)) {
    return true;
  }

  // 4. Redes locales (192.168.x.x, 10.x.x.x, 172.x.x.x)
  if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(clean)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

module.exports = cors(corsOptions);

