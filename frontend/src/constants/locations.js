export const LIMA_METRO_DISTRITOS = [
  'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla',
  'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima',
  'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac',
  'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
  'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
  'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
  'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
];

export const PROVINCIAS = [
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

export const ALL_DISTRITOS = PROVINCIAS.flatMap(p => p.distritos);

export const DISTRICT_COORDS = {
  'Ancón': [-11.7333, -77.1667], 'Ate': [-12.0267, -76.9217], 'Barranco': [-12.1467, -77.0217],
  'Breña': [-12.0583, -77.0500], 'Carabayllo': [-11.8750, -77.0333], 'Chaclacayo': [-11.9833, -76.7667],
  'Chorrillos': [-12.1833, -77.0167], 'Cieneguilla': [-12.0167, -76.8167], 'Comas': [-11.9333, -77.0667],
  'El Agustino': [-12.0333, -77.0000], 'Independencia': [-11.9917, -77.0500], 'Jesús María': [-12.0750, -77.0417],
  'La Molina': [-12.0833, -76.9333], 'La Victoria': [-12.0667, -77.0167], 'Lima': [-12.0464, -77.0428],
  'Lince': [-12.0833, -77.0333], 'Los Olivos': [-11.9667, -77.0667], 'Lurigancho': [-11.9667, -76.8333],
  'Lurín': [-12.2833, -76.8667], 'Magdalena del Mar': [-12.0917, -77.0667], 'Miraflores': [-12.1167, -77.0333],
  'Pachacámac': [-12.2333, -76.8667], 'Pucusana': [-12.4833, -76.8000], 'Pueblo Libre': [-12.0750, -77.0667],
  'Puente Piedra': [-11.8667, -77.0833], 'Punta Hermosa': [-12.3333, -76.8167], 'Punta Negra': [-12.3667, -76.8000],
  'Rímac': [-12.0333, -77.0333], 'San Bartolo': [-12.3833, -76.7833], 'San Borja': [-12.1000, -77.0000],
  'San Isidro': [-12.1000, -77.0333], 'San Juan de Lurigancho': [-11.9833, -76.9833],
  'San Juan de Miraflores': [-12.1500, -76.9833], 'San Luis': [-12.0833, -77.0000],
  'San Martín de Porres': [-12.0000, -77.0833], 'San Miguel': [-12.0833, -77.0833],
  'Santa Anita': [-12.0500, -76.9667], 'Santa María del Mar': [-12.4000, -76.7667], 'Santa Rosa': [-11.7833, -77.1667],
  'Santiago de Surco': [-12.1333, -76.9833], 'Surquillo': [-12.1167, -77.0167],
  'Villa El Salvador': [-12.2167, -76.9333], 'Villa María del Triunfo': [-12.1500, -76.9333],
  'Barranca': [-10.7533, -77.7606], 'Paramonga': [-10.6728, -77.8203], 'Pativilca': [-10.6975, -77.7842],
  'Supe': [-10.7981, -77.7428], 'Supe Puerto': [-10.8039, -77.7511],
  'Cajatambo': [-10.4739, -76.9847], 'Canta': [-11.4722, -76.6231],
  'San Vicente de Cañete': [-13.0758, -76.3853], 'Huaral': [-11.4947, -77.2078],
  'Matucana': [-11.8433, -76.3989], 'Huacho': [-11.1089, -77.6083], 'Oyón': [-10.6694, -76.7725],
  'Yauyos': [-12.4608, -75.9225]
};
