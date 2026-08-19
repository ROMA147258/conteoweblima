export const PARTIES = {
  FP: { label: 'Fuerza Popular', short: 'FP', color: '#c41e3a' },
  JP: { label: 'Juntos por el Perú', short: 'JP', color: '#e07b39' },
  SP: { label: 'Somos Perú', short: 'SP', color: '#1a8a7d' },
  FR: { label: 'FREPAP', short: 'FR', color: '#2c5282' },
  VE: { label: 'Verde', short: 'VE', color: '#38a169' },
  MO: { label: 'Morado', short: 'MO', color: '#6b46c1' },
  NULOS: { label: 'Nulos', short: 'NULOS', color: '#7f8c8d' },
  VACIOS: { label: 'Vacíos', short: 'VACIOS', color: '#bdc3c7' }
};

export const PARTY_KEYS = Object.keys(PARTIES);
export const PARTY_COLORS = PARTY_KEYS.map(k => PARTIES[k].color);
export const PARTY_LABELS = PARTY_KEYS.map(k => PARTIES[k].label);
