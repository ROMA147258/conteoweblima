export const PARTIES = {
  FP: {
    label: 'Fuerza Popular',
    short: 'FP',
    color: '#ff5722',
    symbol: '/images/party/fp.webp'
  },
  JP: {
    label: 'Juntos por el Perú',
    short: 'JP',
    color: '#00b4d8',
    symbol: '/images/party/jp.webp'
  },
  SP: {
    label: 'Somos Perú',
    short: 'SP',
    color: '#e63946',
    symbol: '/images/party/sp.jpg'
  },
  FREPAP: {
    label: 'FREPAP',
    short: 'FREPAP',
    color: '#2b9348',
    symbol: '/images/party/frepap.jpg'
  },
  VERDE: {
    label: 'Demócrata Verde',
    short: 'VERDE',
    color: '#55a630',
    symbol: '/images/party/verde.webp'
  },
  MORADO: {
    label: 'Partido Morado',
    short: 'MORADO',
    color: '#7b2cbf',
    symbol: '/images/party/morado.jpg'
  },
  RP: {
    label: 'Renovación Popular',
    short: 'RP',
    color: '#0077b6',
    symbol: '/images/party/rp.jpg'
  },
  AN: {
    label: 'Ahora Nación',
    short: 'AN',
    color: '#d90429',
    symbol: '/images/party/an.jpg'
  },
  AVANZA: {
    label: 'Avanza País',
    short: 'AVANZA',
    color: '#003566',
    symbol: '/images/party/avanza.jpg'
  },
  PODEMOS: {
    label: 'Podemos Perú',
    short: 'PODEMOS',
    color: '#d97706',
    symbol: '/images/party/podemos.png'
  },
  OBRAS: {
    label: 'Partido Cívico Obras',
    short: 'OBRAS',
    color: '#b45309',
    symbol: '/images/party/obras.png'
  },
  AP: {
    label: 'Acción Popular',
    short: 'AP',
    color: '#e11d48',
    symbol: '/images/party/ap.jpg'
  },
  ESPERANZA: {
    label: 'Frente de la Esperanza',
    short: 'ESPERANZA',
    color: '#10b981',
    symbol: '/images/party/esperanza.webp'
  },
  VENCEREMOS: {
    label: 'Alianza Electoral Venceremos',
    short: 'VENCEREMOS',
    color: '#ef4444',
    symbol: '/images/party/venceremos.png'
  },
  VISION: {
    label: 'Visión Perú',
    short: 'VISIÓN',
    color: '#1e3a8a',
    symbol: '/images/party/vision.svg'
  },
  APRA: {
    label: 'Partido Aprista Peruano (APRA)',
    short: 'APRA',
    color: '#dc2626',
    symbol: '/images/party/apra.webp'
  },
  PPC: {
    label: 'Partido Popular Cristiano (PPC)',
    short: 'PPC',
    color: '#059669',
    symbol: '/images/party/ppc.png'
  },
  PROGRESEMOS: {
    label: 'Progresemos',
    short: 'PROGRESEMOS',
    color: '#2563eb',
    symbol: '/images/party/progresemos.jpg'
  },
  BUEN_GOBIERNO: {
    label: 'Partido del Buen Gobierno',
    short: 'BUEN GOB.',
    color: '#8b5cf6',
    symbol: '/images/party/buen_gobierno.jpg'
  },
  PERU_LIBRE: {
    label: 'Perú Libre',
    short: 'PERÚ LIBRE',
    color: '#b91c1c',
    symbol: '/images/party/peru_libre.webp'
  },
  TIERRA_VERDE: {
    label: 'Coalición Transf. Tierra Verde',
    short: 'TIERRA VERDE',
    color: '#15803d',
    symbol: '/images/party/tierra_verde.svg'
  },
  PUEBLO_CONSCIENTE: {
    label: 'Pueblo Consciente',
    short: 'P. CONSCIENTE',
    color: '#ca8a04',
    symbol: '/images/party/pueblo_consciente.jpg'
  },
  PPP: {
    label: 'Partido Patriótico del Perú',
    short: 'PPP',
    color: '#0284c7',
    symbol: '/images/party/ppp.webp'
  },
  INTEGRIDAD: {
    label: 'Integridad Democrática',
    short: 'INTEGRIDAD',
    color: '#a21caf',
    symbol: '/images/party/integridad.svg'
  },
  FUERZA_CIUDADANA: {
    label: 'Fuerza Ciudadana',
    short: 'F. CIUDADANA',
    color: '#db2777',
    symbol: '/images/party/fuerza_ciudadana.png'
  },
  BATALLA: {
    label: 'Batalla Perú',
    short: 'BATALLA',
    color: '#475569',
    symbol: '/images/party/batalla.png'
  },
  APP: {
    label: 'Alianza para el Progreso (APP)',
    short: 'APP',
    color: '#0284c7',
    symbol: '/images/party/app.jpeg'
  },
  ALIANZA_REGIONAL: {
    label: 'Alianza Regional por el Perú',
    short: 'ALIANZA REG.',
    color: '#c2410c',
    symbol: '/images/party/alianza_regional.svg'
  },
  NULOS: {
    label: 'Votos Nulos',
    short: 'NULOS',
    color: '#64748b',
    symbol: null
  },
  VACIOS: {
    label: 'Votos Blancos / Vacíos',
    short: 'BLANCOS',
    color: '#94a3b8',
    symbol: null
  },
  IMPUGNADOS: {
    label: 'Votos Impugnados',
    short: 'IMPUGNADOS',
    color: '#eab308',
    symbol: null
  }
};

export const PARTY_KEYS = Object.keys(PARTIES);
export const PARTY_COLORS = PARTY_KEYS.map(k => PARTIES[k].color);
export const PARTY_LABELS = PARTY_KEYS.map(k => PARTIES[k].label);
