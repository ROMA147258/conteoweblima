// ── DATOS ELECTORALES – Estructura ONPE ──
const PARTIES = {
  FP: { label: 'Fuerza Popular', color: '#c41e3a' },
  JP: { label: 'Juntos por el Perú', color: '#e07b39' },
  SP: { label: 'Somos Perú', color: '#1a8a7d' },
  FR: { label: 'FREPAP', color: '#2c5282' },
  VE: { label: 'Verde', color: '#38a169' },
  MO: { label: 'Morado', color: '#6b46c1' },
  NULOS: { label: 'Nulos', color: '#7f8c8d' },
  VACIOS: { label: 'Vacíos', color: '#bdc3c7' },
};
const PARTY_KEYS = Object.keys(PARTIES);
const PARTY_COLORS = PARTY_KEYS.map(k => PARTIES[k].color);
const PARTY_LABELS = PARTY_KEYS.map(k => PARTIES[k].label);

const LIMA_METRO_DISTRITOS = [
  'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla',
  'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima',
  'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac',
  'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
  'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
  'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
  'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
];

const PROVINCIAS = [
  { id: 'lima-metropolitana', name: 'Lima Metropolitana', distritos: LIMA_METRO_DISTRITOS },
  { id: 'barranca', name: 'Barranca', distritos: ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto'] },
  { id: 'cajatambo', name: 'Cajatambo', distritos: ['Cajatambo', 'Copa', 'Gorgor', 'Huancapón', 'Manás'] },
  { id: 'canta', name: 'Canta', distritos: ['Canta', 'Arahuay', 'Lachaqui', 'Santa Rosa de Quives'] },
  { id: 'canete', name: 'Cañete', distritos: ['San Vicente de Cañete', 'Asia', 'Cerro Azul', 'Imperial', 'Lunahuana', 'Mala', 'Nuevo Imperial', 'Quilmana'] },
  { id: 'huaral', name: 'Huaral', distritos: ['Huaral', 'Aucallama', 'Chancay', 'Ihuari', 'Sumbilca'] },
  { id: 'huarochiri', name: 'Huarochirí', distritos: ['Matucana', 'Antioquia', 'Callahuanca', 'Ricardo Palma', 'Santa Eulalia', 'San Bartolomé'] },
  { id: 'huaura', name: 'Huaura', distritos: ['Huacho', 'Ambar', 'Hualmay', 'Huaura', 'Sayán', 'Vegueta'] },
  { id: 'oyon', name: 'Oyón', distritos: ['Oyón', 'Andajes', 'Caujul', 'Pachangara'] },
  { id: 'yauyos', name: 'Yauyos', distritos: ['Yauyos', 'Alis', 'Catahuasi', 'Huancaya', 'Laraos', 'Tomas'] }
];

const LIMA_DISTRITOS = PROVINCIAS.flatMap(p => p.distritos);

function randomVotos(scale = 1) {
  const v = PARTY_KEYS.map(() => Math.floor(Math.random() * 1200 * scale) + 100);
  return Object.fromEntries(PARTY_KEYS.map((k, i) => [k, v[i]]));
}

function totalVotos(data) {
  return Object.values(data).reduce((a, b) => a + b, 0);
}

// Generar colegios y mesas por distrito
const COLEGIOS_POR_DISTRITO = {};
const MESA_DATA = {};
const DISTRICT_DATA = {};

let mesaCounter = 120401;

function colegiosForDistrito(distrito, provinciaId) {
  const known = COLEGIOS_REALES[distrito];
  if (known) return known;
  const base = provinciaId === 'lima-metropolitana' ? 6 : 3;
  const tipos = ['I.E. Emblemática', 'I.E.N.', 'I.E. Particular', 'Colegio Nacional', 'I.E. Técnico Industrial', 'I.E. San', 'I.E. Fe y Alegría', 'I.E. Innova Schools'];
  return tipos.slice(0, base + (distrito.length % 3)).map((t, i) =>
    i < 2 ? `${t} ${distrito}` : `${t} ${distrito} N° ${1200 + i}`
  );
}

const COLEGIOS_REALES = {
  'Miraflores': ['Markham College', 'I.E. San Antonio de Miraflores', 'Colegio San Agustín', 'I.E. Alfonso Ugarte', 'I.E. San Ignacio de Loyola', 'Colegio Carmelitas', 'I.E. Fe y Alegría N° 24'],
  'San Isidro': ['Colegio San Agustín', 'I.E. San Felipe', 'Reina de las Américas', 'I.E. San Juan Bautista', 'San Silvestre School', 'I.E. San Jorge', 'Colegio Alpamayo'],
  'Santiago de Surco': ['I.E. San Ignacio de Recalde', 'Colegio San Agustín de Surco', 'I.E. Fe y Alegría N° 25', 'I.E. San Juan Bautista de La Salle', 'Colegio Claretiano', 'I.E. San Juan Apóstol', 'I.E. San Carlos'],
  'La Molina': ['I.E. La Molina Vieja', 'Colegio San Pedro', 'I.E. Fe y Alegría N° 44', 'I.E. San Carlos', 'Universidad Agraria (local)', 'I.E. San Martín de Porres La Molina'],
  'San Borja': ['I.E. San Borja', 'Colegio San Agustino', 'I.E. San Juan Bautista', 'I.E. San Carlos', 'I.E. San Pedro Claver', 'I.E. San Martín de Porres San Borja'],
  'Los Olivos': ['I.E. Los Olivos', 'I.E. Fe y Alegría N° 3', 'I.E. San Juan Bautista Los Olivos', 'I.E. San Martín de Porres Los Olivos', 'I.E. San Juan Bosco', 'I.E. San Pedro Los Olivos', 'I.E. San Carlos Los Olivos'],
  'Comas': ['I.E. Comas', 'I.E. Fe y Alegría N° 1', 'I.E. San Juan Bosco Comas', 'I.E. San Martín de Porres Comas', 'I.E. San Pedro Comas', 'I.E. San Carlos Comas'],
  'San Juan de Lurigancho': ['I.E. SJL', 'I.E. Fe y Alegría N° 48', 'I.E. San Juan Bautista SJL', 'I.E. San Martín de Porres SJL', 'I.E. San Pedro SJL', 'I.E. San Carlos SJL', 'I.E. San Juan Bosco SJL', 'I.E. San Ignacio SJL'],
  'Villa El Salvador': ['I.E. VES', 'I.E. Fe y Alegría N° 2', 'I.E. San Juan Bosco VES', 'I.E. San Martín de Porres VES', 'I.E. San Pedro VES', 'I.E. San Carlos VES'],
  'Villa María del Triunfo': ['I.E. VMT', 'I.E. Fe y Alegría N° 4', 'I.E. San Juan Bosco VMT', 'I.E. San Martín de Porres VMT', 'I.E. San Pedro VMT', 'I.E. San Carlos VMT'],
  'Ate': [
    'IE 0024 PEDRO ENRIQUE GONZALES SOTO', 'IE 0026 AICHI NAGOYA', 'IE 0032 RAUL PORRAS BARRENECHEA',
    'IE 0034', 'IE 0067 SANTA ELENA', 'IE 0074 FERNANDO BELAUNDE TERRY', 'IE 1135 SANTA CLARA',
    'IE 1136 JOHN F. KENNEDY', 'IE 1138 JOSE ABELARDO QUIÑONES', 'IE 1142 SEÑOR DE LOS MILAGROS',
    'IE 1143 DOMINGO FAUSTINO SARMIENTO', 'IE 1203 DIVINO NIÑO JESUS DE MANYLSA',
    'IE 1209 GRAN MARISCAL TORIBIO DE LUZURIAGA', 'IE 1212 GRUMETE MEDINA', 'IE 1213 LA GLORIA',
    'IE 1222 HUSARES DE JUNIN', 'IE 1226 SOL DE VITARTE', 'IE 1227 INDIRA GANDHI',
    'IE 1228 LEONCIO PRADO GUTIERREZ', 'IE 1228 LEONCIO PRADO GUTIERREZ- SECUNDARIA',
    'IE 1229 JULIO ALBERTO PONCE ANTUNEZ DE MAYOLO', 'IE 1231 JOSE LUIS BUSTAMANTE Y RIVERO',
    'IE 1236 ALFONSO BARRANTES LINGAN', 'IE 1237 JORGE DIOMEDES GILES LLANOS', 'IE 1239 FORTALEZA',
    'IE 1244 MICAELA BASTIDAS', 'IE 1245 JOSE CARLOS MARIATEGUI', 'IE 1248 5 DE ABRIL',
    'IE 1249 JAVIER HERAUD', 'IE 1251 PERUANO SUIZO', 'IE 1255 WALTER PEÑALOZA RAMELLA',
    'IE 1257 REINO UNIDO DE GRAN BRETAÑA', 'IE 1258 SEBASTIAN LORENTE IBAÑEZ', 'IE 1260 EL AMAUTA',
    'IE 1262 EL AMAUTA JOSE CARLOS MARIATEGUI', 'IE 1268 GUSTAVO MOHME LLONA', 'IE 1279',
    'IE 6039 FERNANDO CARBAJAL SEGURA', 'IE AKIRA KATO', 'IE 0029 CORONEL PNP MARCO PUENTE LLANOS',
    'IE COLEGIO NACIONAL DE VITARTE', 'IE FE Y ALEGRIA 53', 'IE JULIO C TELLO',
    'IE 1264 JUAN ANDRES VIVANCO AMORIN', 'IE MIXTO HUAYCAN', 'IE NUESTRA SEÑORA DE LA ESPERANZA',
    'IE RICARDO PALMA', 'IE 046 VICTOR RAUL HAYA DE LA TORRE INEI', 'IE EDELMIRA DEL PANDO',
    'IE 0025 SAN MARTIN DE PORRES', 'IEP INCA GARCILASO DE LA VEGA', 'IEP SAN IGNACIO SCHOOL',
    'IE 167 LAS PIEDRITAS', 'IE 1263 PURUCHUCO', 'CEBE 13 JESÚS AMIGO', 'IEP SANTIAGO APOSTOL',
    'IE 1215 SAN JUAN DE PARIACHI', 'IE 1270 JUAN EL BAUTISTA', 'IE 1281 SANTA MARIA',
    'IE 1208 SAN FRANCISCO DE ASIS', 'IE 1254 MARIA REICHE NEWMANN', 'IE 1265 SANTA ROSA DE LIMA',
    'IE 1271 COLEGIO SAN JUAN BAUTISTA', 'IE 1283 OKINAWA', 'IE 1288 ALBERT EINSTEIN'
  ],
  'Rímac': ['I.E. Rímac', 'I.E. San Juan Bautista Rímac', 'I.E. San Martín de Porres Rímac', 'I.E. San Pedro Rímac', 'I.E. San Carlos Rímac', 'I.E. Fe y Alegría N° 6'],
  'Lima': ['I.E. Alfonso Ugarte', 'I.E. San Juan Bautista Lima', 'I.E. San Carlos Lima', 'I.E. San Pedro Lima', 'I.E. San Martín de Porres Lima', 'I.E. Fe y Alegría N° 7'],
  'Breña': ['I.E. Breña', 'I.E. San Juan Bautista Breña', 'I.E. San Martín de Porres Breña', 'I.E. San Pedro Breña', 'I.E. San Carlos Breña'],
  'La Victoria': ['I.E. La Victoria', 'I.E. San Juan Bautista La Victoria', 'I.E. San Martín de Porres La Victoria', 'I.E. San Pedro La Victoria', 'I.E. San Carlos La Victoria'],
  'Independencia': ['I.E. Independencia', 'I.E. Fe y Alegría N° 8', 'I.E. San Juan Bautista Independencia', 'I.E. San Martín de Porres Independencia', 'I.E. San Pedro Independencia'],
  'San Miguel': ['I.E. San Miguel', 'I.E. San Juan Bautista San Miguel', 'I.E. San Martín de Porres San Miguel', 'I.E. San Pedro San Miguel', 'I.E. San Carlos San Miguel'],
  'Magdalena del Mar': ['I.E. Magdalena', 'I.E. San Juan Bautista Magdalena', 'I.E. San Martín de Porres Magdalena', 'I.E. San Pedro Magdalena', 'I.E. San Carlos Magdalena'],
  'Pueblo Libre': ['I.E. Pueblo Libre', 'I.E. San Juan Bautista Pueblo Libre', 'I.E. San Martín de Porres Pueblo Libre', 'I.E. San Pedro Pueblo Libre', 'I.E. San Carlos Pueblo Libre'],
  'Jesús María': ['I.E. Jesús María', 'I.E. San Juan Bautista Jesús María', 'I.E. San Martín de Porres Jesús María', 'I.E. San Pedro Jesús María', 'I.E. San Carlos Jesús María'],
  'Lince': ['I.E. Lince', 'I.E. San Juan Bautista Lince', 'I.E. San Martín de Porres Lince', 'I.E. San Pedro Lince', 'I.E. San Carlos Lince'],
  'Barranco': ['I.E. Barranco', 'I.E. San Juan Bautista Barranco', 'I.E. San Martín de Porres Barranco', 'I.E. San Pedro Barranco', 'I.E. San Carlos Barranco'],
  'Chorrillos': ['I.E. Chorrillos', 'I.E. San Juan Bautista Chorrillos', 'I.E. San Martín de Porres Chorrillos', 'I.E. San Pedro Chorrillos', 'I.E. San Carlos Chorrillos'],
  'Surquillo': ['I.E. Surquillo', 'I.E. San Juan Bautista Surquillo', 'I.E. San Martín de Porres Surquillo', 'I.E. San Pedro Surquillo', 'I.E. San Carlos Surquillo'],
  'San Luis': ['I.E. San Luis', 'I.E. San Juan Bautista San Luis', 'I.E. San Martín de Porres San Luis', 'I.E. San Pedro San Luis', 'I.E. San Carlos San Luis'],
  'El Agustino': ['I.E. El Agustino', 'I.E. Fe y Alegría N° 9', 'I.E. San Juan Bautista El Agustino', 'I.E. San Martín de Porres El Agustino', 'I.E. San Pedro El Agustino'],
  'Santa Anita': ['I.E. Santa Anita', 'I.E. Fe y Alegría N° 10', 'I.E. San Juan Bautista Santa Anita', 'I.E. San Martín de Porres Santa Anita', 'I.E. San Pedro Santa Anita'],
  'San Juan de Miraflores': ['I.E. SJM', 'I.E. Fe y Alegría N° 11', 'I.E. San Juan Bautista SJM', 'I.E. San Martín de Porres SJM', 'I.E. San Pedro SJM', 'I.E. San Carlos SJM'],
  'San Martín de Porres': ['I.E. SMP', 'I.E. Fe y Alegría N° 12', 'I.E. San Juan Bautista SMP', 'I.E. San Martín de Porres SMP', 'I.E. San Pedro SMP', 'I.E. San Carlos SMP'],
  'Carabayllo': ['I.E. Carabayllo', 'I.E. Fe y Alegría N° 13', 'I.E. San Juan Bautista Carabayllo', 'I.E. San Martín de Porres Carabayllo', 'I.E. San Pedro Carabayllo'],
  'Puente Piedra': ['I.E. Puente Piedra', 'I.E. Fe y Alegría N° 14', 'I.E. San Juan Bautista Puente Piedra', 'I.E. San Martín de Porres Puente Piedra', 'I.E. San Pedro Puente Piedra'],
  'Lurigancho': ['I.E. Lurigancho', 'I.E. Fe y Alegría N° 15', 'I.E. San Juan Bautista Lurigancho', 'I.E. San Martín de Porres Lurigancho', 'I.E. San Pedro Lurigancho'],
  'Lurín': ['I.E. Lurín', 'I.E. San Juan Bautista Lurín', 'I.E. San Martín de Porres Lurín', 'I.E. San Pedro Lurín', 'I.E. San Carlos Lurín'],
  'Pachacámac': ['I.E. Pachacámac', 'I.E. San Juan Bautista Pachacámac', 'I.E. San Martín de Porres Pachacámac', 'I.E. San Pedro Pachacámac', 'I.E. San Carlos Pachacámac'],
  'Chaclacayo': ['I.E. Chaclacayo', 'I.E. San Juan Bautista Chaclacayo', 'I.E. San Martín de Porres Chaclacayo', 'I.E. San Pedro Chaclacayo'],
  'Cieneguilla': ['I.E. Cieneguilla', 'I.E. San Juan Bautista Cieneguilla', 'I.E. San Martín de Porres Cieneguilla', 'I.E. San Pedro Cieneguilla'],
  'Ancón': ['I.E. Ancón', 'I.E. San Juan Bautista Ancón', 'I.E. San Pedro Ancón'],
  'Pucusana': ['I.E. Pucusana', 'I.E. San Juan Bautista Pucusana', 'I.E. San Pedro Pucusana'],
  'Punta Hermosa': ['I.E. Punta Hermosa', 'I.E. San Juan Bautista Punta Hermosa'],
  'Punta Negra': ['I.E. Punta Negra', 'I.E. San Juan Bautista Punta Negra'],
  'San Bartolo': ['I.E. San Bartolo', 'I.E. San Juan Bautista San Bartolo', 'I.E. San Pedro San Bartolo'],
  'Santa María del Mar': ['I.E. Santa María del Mar', 'I.E. San Juan Bautista SMM'],
  'Santa Rosa': ['I.E. Santa Rosa', 'I.E. San Juan Bautista Santa Rosa', 'I.E. San Pedro Santa Rosa']
};

// Mock pre-population loop removed. Data is populated dynamically via Google Sheets synchronization.


function getColegioVotos(distrito, colegio, votoTipo) {
  const totals = {};
  PARTY_KEYS.forEach(k => { totals[k] = 0; });
  const keyType = votoTipo === 'distrital' ? 'votos_distrital' : (votoTipo === 'provincial' ? 'votos_provincial' : 'votos');
  Object.entries(MESA_DATA).forEach(([key, data]) => {
    if (data.distrito === distrito && data.colegio === colegio) {
      const v = data[keyType] || data.votos || {};
      PARTY_KEYS.forEach(k => { totals[k] += (v[k] || 0); });
    }
  });
  return totals;
}

function getMesaVotos(distrito, colegio, mesa, votoTipo) {
  const key = `${distrito}|${colegio}|${mesa}`;
  const data = MESA_DATA[key];
  if (!data) return randomVotos(0.05);
  const keyType = votoTipo === 'distrital' ? 'votos_distrital' : (votoTipo === 'provincial' ? 'votos_provincial' : 'votos');
  return data[keyType] || data.votos || {};
}

function getProvinciaVotos(provinciaId, votoTipo, origenFilter) {
  const prov = PROVINCIAS.find(p => p.id === provinciaId);
  if (!prov) return randomVotos(0);
  const totals = {};
  PARTY_KEYS.forEach(k => { totals[k] = 0; });
  const keyType = votoTipo === 'distrital' ? 'votos_distrital' : (votoTipo === 'provincial' ? 'votos_provincial' : 'votos');
  Object.values(MESA_DATA).forEach(m => {
    const d = DISTRICT_DATA[m.distrito];
    if (!d || d.provincia !== prov.name) return;
    
    if (origenFilter) {
      if (origenFilter === 'MANUAL') {
        if (m.origen !== 'MANUAL') return;
      } else if (origenFilter === 'IMAGEN') {
        if (m.origen !== 'IMAGEN' && m.origen !== 'OCR') return;
      }
    }
    const v = m[keyType] || m.votos || {};
    PARTY_KEYS.forEach(k => {
      totals[k] += (v[k] || 0);
    });
  });
  return totals;
}

function lideres(filter, votoTipo, origenFilter) {
  const isTotalConsolidado = votoTipo === 'total_consolidado' || votoTipo === 'todos_consolidado';
  const keyType = votoTipo === 'distrital' ? 'votos_distrital' : (votoTipo === 'provincial' ? 'votos_provincial' : 'votos');
  
  const totals = {};
  PARTY_KEYS.forEach(k => { totals[k] = 0; });
  
  Object.values(MESA_DATA).forEach(m => {
    // 1. Filter by origen if specified
    if (origenFilter) {
      if (origenFilter === 'MANUAL') {
        if (m.origen !== 'MANUAL') return;
      } else if (origenFilter === 'IMAGEN') {
        if (m.origen !== 'IMAGEN' && m.origen !== 'OCR') return;
      }
    }
    
    // 2. Filter by location
    if (filter) {
      if (filter.level === 'provincia' && filter.provincia) {
        const d = DISTRICT_DATA[m.distrito];
        const p = d ? d.provincia : '';
        const targetProv = PROVINCIAS.find(pr => pr.id === filter.provincia);
        if (!targetProv || targetProv.name !== p) return;
      } else if (filter.level === 'distrito' && filter.distrito) {
        if (m.distrito !== filter.distrito) return;
      } else if (filter.level === 'colegio' && filter.colegio) {
        if (m.distrito !== filter.distrito || m.colegio !== filter.colegio) return;
      } else if (filter.level === 'mesa' && filter.mesa) {
        if (m.distrito !== filter.distrito || (filter.colegio && m.colegio !== filter.colegio) || String(m.mesa) !== String(filter.mesa)) return;
      }
    }
    
    // 3. Accumulate votes
    if (isTotalConsolidado) {
      const vp = m.votos_provincial || m.votos || {};
      PARTY_KEYS.forEach(k => {
        totals[k] += (vp[k] || 0);
      });
    } else {
      const v = m[keyType] || m.votos || {};
      PARTY_KEYS.forEach(k => {
        totals[k] += (v[k] || 0);
      });
    }
  });
  
  return totals;
}

function getFilterContext() {
  return window.VR_FILTER || { level: 'lima' };
}

function getLeader(votos) {
  const politicalParties = PARTY_KEYS.filter(k => k !== 'NULOS' && k !== 'VACIOS');
  if (politicalParties.length === 0) return PARTY_KEYS[0];
  return politicalParties.reduce((a, b) => (votos[a] || 0) > (votos[b] || 0) ? a : b);
}

function getPct(votos, party) {
  const t = totalVotos(votos);
  return t > 0 ? ((votos[party] / t) * 100).toFixed(1) : '0.0';
}
