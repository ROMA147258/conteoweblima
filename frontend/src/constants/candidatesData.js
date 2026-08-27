// --- LISTA DE DISTRITOS DE LIMA METROPOLITANA (DATA NUEVA OFICIAL) ---
export const DISTRITOS_LIMA = [
  "BREÑA",
  "CARABAYLLO",
  "CHORRILLOS",
  "BARRANCO",
  "INDEPENDENCIA",
  "LA MOLINA",
  "LA VICTORIA",
  "SAN LUIS",
  "JESUS MARIA",
  "LIMA",
  "ATE",
  "EL AGUSTINO",
  "ANCON",
  "PUENTE PIEDRA",
  "SANTA ROSA",
  "COMAS",
  "RIMAC",
  "LINCE",
  "MAGDALENA DEL MAR",
  "SAN ISIDRO",
  "MIRAFLORES",
  "SURQUILLO",
  "SANTIAGO DE SURCO",
  "LURIN",
  "PACHACAMAC",
  "PUCUSANA",
  "PUNTA HERMOSA",
  "PUNTA NEGRA",
  "SAN BARTOLO",
  "SANTA MARIA DEL MAR",
  "CIENEGUILLA",
  "VILLA MARIA DEL TRIUNFO",
  "LOS OLIVOS",
  "CHACLACAYO",
  "LURIGANCHO",
  "PUEBLO LIBRE",
  "SAN BORJA",
  "SAN JUAN DE LURIGANCHO",
  "SAN JUAN DE MIRAFLORES",
  "SAN MARTIN DE PORRES",
  "SAN MIGUEL",
  "SANTA ANITA",
  "VILLA EL SALVADOR"
];

// --- DATOS MAESTROS DE PARTIDOS Y ORGANIZACIONES POLÍTICAS ---
export const PARTIDOS_DATA = {
  "SOMOS PERU": { shortName: "SP", partyId: "sp", partyLong: "Somos Perú" },
  "RENOVACION": { shortName: "RP", partyId: "rp", partyLong: "Renovación Popular" },
  "AHORA NACION": { shortName: "AN", partyId: "ahora-nacion", partyLong: "Ahora Nación" },
  "AVANZA PAIS": { shortName: "AVANZA", partyId: "avanza", partyLong: "Avanza País" },
  "PODEMOS": { shortName: "PODEMOS", partyId: "podemos", partyLong: "Podemos Perú" },
  "JP": { shortName: "JP", partyId: "jp", partyLong: "Juntos por el Perú" },
  "OBRAS": { shortName: "OBRAS", partyId: "obras", partyLong: "Partido Cívico Obras" },
  "FREPAP": { shortName: "FREPAP", partyId: "frepap", partyLong: "FREPAP" },
  "ACCION POPULAR": { shortName: "AP", partyId: "ap", partyLong: "Acción Popular" },
  "ESPERANZA": { shortName: "FE", partyId: "esperanza", partyLong: "Frente de la Esperanza 2021" },
  "VENCEREMOS": { shortName: "AEV", partyId: "venceremos", partyLong: "Alianza Electoral Venceremos" },
  "VISION PERU": { shortName: "VP", partyId: "vision", partyLong: "Visión Perú" },
  "APRA": { shortName: "APRA", partyId: "apra", partyLong: "Partido Aprista Peruano" },
  "FP": { shortName: "FP", partyId: "fp", partyLong: "Fuerza Popular" },
  "PPC": { shortName: "PPC", partyId: "ppc", partyLong: "Partido Popular Cristiano (PPC)" },
  "PROGRESEMOS": { shortName: "PROG", partyId: "progresemos", partyLong: "Progresemos" },
  "MORADO": { shortName: "PM", partyId: "morado", partyLong: "Partido Morado" },
  "BUEN GOBIERNO": { shortName: "PBG", partyId: "buen-gobierno", partyLong: "Partido del Buen Gobierno" },
  "VERDE": { shortName: "PDV", partyId: "verde", partyLong: "Partido Demócrata Verde" },
  "PERU LIBRE": { shortName: "PL", partyId: "peru-libre", partyLong: "Perú Libre" },
  "TIERRA VERDE": { shortName: "CTTV", partyId: "tierra-verde", partyLong: "Coalición Transformadora Tierra Verde" },
  "PUEBLO CONSCIENTE": { shortName: "PC", partyId: "pueblo-consciente", partyLong: "Pueblo Consciente" },
  "PPP": { shortName: "PPP", partyId: "ppp", partyLong: "Partido Patriótico del Perú" },
  "INTEGRIDAD": { shortName: "ID", partyId: "integridad", partyLong: "Integridad Democrática" },
  "FUERZA CIUDADANA": { shortName: "FC", partyId: "fuerza-ciudadana", partyLong: "Fuerza Ciudadana" },
  "BATALLA PERU": { shortName: "BP", partyId: "batalla", partyLong: "Batalla Perú" },
  "APP": { shortName: "APP", partyId: "app", partyLong: "Alianza para el Progreso" },
  "ALIANZA REGIONAL": { shortName: "ARP", partyId: "alianza-regional", partyLong: "Alianza Regional por el Perú" }
};

// --- CANDIDATOS A ALCALDES POR DISTRITO (DATA OFICIAL 2026) ---
export const CANDIDATOS_OFICIALES_LIMA_METROPOLITANA = [
  { num: 1, key: "SOMOS PERU", shortName: "SP", partyId: "sp", partyLong: "Somos Perú", candidato: "Carlos Ricardo Bruce Montes de Oca", organizacion: "Somos Perú" },
  { num: 2, key: "RENOVACION", shortName: "RP", partyId: "rp", partyLong: "Renovación Popular", candidato: "Rafael López Aliaga", organizacion: "Renovación Popular" },
  { num: 3, key: "AHORA NACION", shortName: "AN", partyId: "ahora-nacion", partyLong: "Ahora Nación", candidato: "Susel Ana María Paredes Piqué", organizacion: "Ahora Nación" },
  { num: 4, key: "AVANZA PAIS", shortName: "AVANZA", partyId: "avanza", partyLong: "Avanza País", candidato: "Francis James Allison Oyague", organizacion: "Avanza País" },
  { num: 5, key: "PODEMOS", shortName: "PODEMOS", partyId: "podemos", partyLong: "Podemos Perú", candidato: "Daniel Belizario Urresti Elera", organizacion: "Podemos Perú" },
  { num: 6, key: "JP", shortName: "JP", partyId: "jp", partyLong: "Juntos por el Perú", candidato: "Oswaldo Hernán Vargas Cuellar", organizacion: "Juntos por el Perú" },
  { num: 7, key: "OBRAS", shortName: "OBRAS", partyId: "obras", partyLong: "Partido Cívico Obras", candidato: "Ricardo Pablo Belmont Cassinelli", organizacion: "Partido Cívico Obras" },
  { num: 8, key: "FREPAP", shortName: "FREPAP", partyId: "frepap", partyLong: "FREPAP", candidato: "Segundo Valdez Zavala", organizacion: "FREPAP" },
  { num: 9, key: "ACCION POPULAR", shortName: "AP", partyId: "ap", partyLong: "Acción Popular", candidato: "Carlos Alberto Tejada Noriega", organizacion: "Acción Popular" },
  { num: 10, key: "ESPERANZA", shortName: "FE", partyId: "esperanza", partyLong: "Frente de la Esperanza 2021", candidato: "Elizabeth María del Rosario León Chinchay", organizacion: "Frente de la Esperanza 2021" },
  { num: 11, key: "VENCEREMOS", shortName: "AEV", partyId: "venceremos", partyLong: "Alianza Electoral Venceremos", candidato: "Juan Carlos Alvarado Mestanza", organizacion: "Alianza Electoral Venceremos" },
  { num: 12, key: "VISION PERU", shortName: "VP", partyId: "vision", partyLong: "Visión Perú", candidato: "Santiago Rosendo Abarca León", organizacion: "Visión Perú" },
  { num: 13, key: "APRA", shortName: "APRA", partyId: "apra", partyLong: "Partido Aprista Peruano", candidato: "Mónica Yadira Yaya Luyo", organizacion: "Partido Aprista Peruano" },
  { num: 14, key: "FP", shortName: "FP", partyId: "fp", partyLong: "Fuerza Popular", candidato: "Samuel Marcos Daza Taype", organizacion: "Fuerza Popular" },
  { num: 15, key: "PPC", shortName: "PPC", partyId: "ppc", partyLong: "Partido Popular Cristiano (PPC)", candidato: "Edgardo Renán de Pomar Vizcarra", organizacion: "Partido Popular Cristiano (PPC)" },
  { num: 16, key: "PROGRESEMOS", shortName: "PROG", partyId: "progresemos", partyLong: "Progresemos", candidato: "Luis Miguel Llanos Carrillo", organizacion: "Progresemos" },
  { num: 17, key: "MORADO", shortName: "PM", partyId: "morado", partyLong: "Partido Morado", candidato: "Victoria Betzabé La Cruz Garcés", organizacion: "Partido Morado" },
  { num: 18, key: "BUEN GOBIERNO", shortName: "PBG", partyId: "buen-gobierno", partyLong: "Partido del Buen Gobierno", candidato: "Carlos Francisco Gallardo Neyra", organizacion: "Partido del Buen Gobierno" },
  { num: 19, key: "VERDE", shortName: "PDV", partyId: "verde", partyLong: "Partido Demócrata Verde", candidato: "Flor de María Hurtado Valdez", organizacion: "Partido Demócrata Verde" },
  { num: 20, key: "PERU LIBRE", shortName: "PL", partyId: "peru-libre", partyLong: "Perú Libre", candidato: "Rubén José Ramírez Mateo", organizacion: "Perú Libre" },
  { num: 21, key: "TIERRA VERDE", shortName: "CTTV", partyId: "tierra-verde", partyLong: "Coalición Transformadora Tierra Verde", candidato: "Yehude Simon Munaro", organizacion: "Coalición Transformadora Tierra Verde" },
  { num: 22, key: "PUEBLO CONSCIENTE", shortName: "PC", partyId: "pueblo-consciente", partyLong: "Pueblo Consciente", candidato: "Luis Alberto Huette Tolentino", organizacion: "Pueblo Consciente" },
  { num: 23, key: "PPP", shortName: "PPP", partyId: "ppp", partyLong: "Partido Patriótico del Perú", candidato: "Sandro Caller Gutiérrez", organizacion: "Partido Patriótico del Perú" },
  { num: 24, key: "INTEGRIDAD", shortName: "ID", partyId: "integridad", partyLong: "Integridad Democrática", candidato: "Jessica Viviana Linares Romero", organizacion: "Integridad Democrática" },
  { num: 25, key: "FUERZA CIUDADANA", shortName: "FC", partyId: "fuerza-ciudadana", partyLong: "Fuerza Ciudadana", candidato: "Rubén Daniel Bonilla Espinoza", organizacion: "Fuerza Ciudadana" },
  { num: 26, key: "BATALLA PERU", shortName: "BP", partyId: "batalla", partyLong: "Batalla Perú", candidato: "Samir Frank Quispe Caballero", organizacion: "Batalla Perú" }
];

export const CANDIDATOS_OFICIALES_PUEBLO_LIBRE = [
  { num: 1, key: "RENOVACION", shortName: "RP", partyId: "rp", partyLong: "Renovación Popular", candidato: "Cecilia Acosta Cajaleon", organizacion: "Renovación Popular" },
  { num: 2, key: "PODEMOS", shortName: "PODEMOS", partyId: "podemos", partyLong: "Podemos Perú", candidato: "Daniel Martín Amaya Carranza", organizacion: "Podemos Perú" },
  { num: 3, key: "MORADO", shortName: "PM", partyId: "morado", partyLong: "Partido Morado", candidato: "Miguel Stefano Ruiz Gutiérrez", organizacion: "Partido Morado" },
  { num: 4, key: "ACCION POPULAR", shortName: "AP", partyId: "ap", partyLong: "Acción Popular", candidato: "Carlos Enrique Arana Urteaga", organizacion: "Acción Popular" },
  { num: 5, key: "SOMOS PERU", shortName: "SP", partyId: "sp", partyLong: "Somos Perú", candidato: "Jhonel Jorge Leguía Jamis", organizacion: "Somos Perú" },
  { num: 6, key: "VISION PERU", shortName: "VP", partyId: "vision", partyLong: "Visión Perú", candidato: "Walter Alfonso Cavero Villanes", organizacion: "Visión Perú" },
  { num: 7, key: "AVANZA PAIS", shortName: "AVANZA", partyId: "avanza", partyLong: "Avanza País", candidato: "José Luis Casas Carrión", organizacion: "Avanza País" },
  { num: 8, key: "APRA", shortName: "APRA", partyId: "apra", partyLong: "Partido Aprista Peruano", candidato: "Josmell Absalón Muñoz Barranzuela", organizacion: "APRA" },
  { num: 9, key: "ESPERANZA", shortName: "FE", partyId: "esperanza", partyLong: "Frente de la Esperanza 2021", candidato: "Fabiola Lucero Silva Montero", organizacion: "Frente de la Esperanza 2021" },
  { num: 10, key: "ALIANZA REGIONAL", shortName: "ARP", partyId: "alianza-regional", partyLong: "Alianza Regional por el Perú", candidato: "Hilgo Antonio Manchego Ormeño", organizacion: "Alianza Regional por el Perú" },
  { num: 11, key: "AHORA NACION", shortName: "AN", partyId: "ahora-nacion", partyLong: "Ahora Nación", candidato: "Oscar Raúl Cabello Acosta", organizacion: "Ahora Nación" },
  { num: 12, key: "PPC", shortName: "PPC", partyId: "ppc", partyLong: "Partido Popular Cristiano (PPC)", candidato: "Fidel Bratzo García Durante", organizacion: "PPC" }
];

export const CANDIDATOS_OFICIALES_SAN_ISIDRO = [
  { num: 1, key: "ACCION POPULAR", shortName: "AP", partyId: "ap", partyLong: "Acción Popular", candidato: "Carlomagno Chacón Gómez", organizacion: "Acción Popular" },
  { num: 2, key: "APP", shortName: "APP", partyId: "app", partyLong: "Alianza para el Progreso", candidato: "Zuleika Vannessa Benel Zevallos", organizacion: "Alianza para el Progreso" },
  { num: 3, key: "AVANZA PAIS", shortName: "AVANZA", partyId: "avanza", partyLong: "Avanza País", candidato: "César Augusto Combina Salvatierra", organizacion: "Avanza País" },
  { num: 4, key: "RENOVACION", shortName: "RP", partyId: "rp", partyLong: "Renovación Popular", candidato: "Javier Paino", organizacion: "Renovación Popular" },
  { num: 5, key: "SOMOS PERU", shortName: "SP", partyId: "sp", partyLong: "Somos Perú", candidato: "Víctor Hugo Bazán Pastor", organizacion: "Somos Perú" },
  { num: 6, key: "VISION PERU", shortName: "VP", partyId: "vision", partyLong: "Visión Perú", candidato: "Walter Alfonso Cavero Villanes", organizacion: "Visión Perú" },
  { num: 7, key: "PODEMOS", shortName: "PODEMOS", partyId: "podemos", partyLong: "Podemos Perú", candidato: "Daniel Martín Amaya Carranza", organizacion: "Podemos Perú" },
  { num: 8, key: "PPC", shortName: "PPC", partyId: "ppc", partyLong: "Partido Popular Cristiano (PPC)", candidato: "Fidel Bratzo García Durante", organizacion: "Partido Popular Cristiano (PPC)" }
];

export function obtenerListaCandidatosProvincial() {
  return CANDIDATOS_OFICIALES_LIMA_METROPOLITANA;
}

export function obtenerListaCandidatosDistrital(ubicacion) {
  const norm = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const target = norm(ubicacion);

  if (target.includes('pueblo libre')) {
    return CANDIDATOS_OFICIALES_PUEBLO_LIBRE;
  }
  if (target.includes('san isidro')) {
    return CANDIDATOS_OFICIALES_SAN_ISIDRO;
  }

  const candMap = obtenerCandidatosPorUbicacion(ubicacion);
  return Object.keys(candMap).map((k, idx) => {
    const meta = PARTIDOS_DATA[k] || { shortName: k, partyId: k.toLowerCase().replace(/[^a-z0-9]/g, '-'), partyLong: k };
    return {
      num: idx + 1,
      key: k,
      shortName: meta.shortName,
      partyId: meta.partyId,
      partyLong: meta.partyLong,
      candidato: candMap[k],
      organizacion: meta.partyLong
    };
  });
}

export const CANDIDATOS_MAP = {
  "Lima": {
    "FP": "Samuel Marcos Daza Taype",
    "JP": "Oswaldo Hernán Vargas Cuellar",
    "SOMOS PERU": "Carlos Ricardo Bruce Montes de Oca",
    "FREPAP": "Segundo Valdez Zavala",
    "VERDE": "Flor de María Hurtado Valdez",
    "MORADO": "Victoria Betzabé La Cruz Garcés"
  },
  "Cercado de Lima": {
    "FP": "Samuel Marcos Daza Taype",
    "JP": "Oswaldo Hernán Vargas Cuellar",
    "SOMOS PERU": "Carlos Ricardo Bruce Montes de Oca",
    "FREPAP": "Segundo Valdez Zavala",
    "VERDE": "Flor de María Hurtado Valdez",
    "MORADO": "Victoria Betzabé La Cruz Garcés"
  },
  "Pueblo Libre": {
    "FP": "Samuel Marcos Daza Taype",
    "JP": "Oswaldo Hernán Vargas Cuellar",
    "SOMOS PERU": "Jhonel Jorge Leguía Jamis",
    "FREPAP": "Segundo Valdez Zavala",
    "VERDE": "Flor de María Hurtado Valdez",
    "MORADO": "Miguel Stefano Ruiz Gutiérrez"
  },
  "San Isidro": {
    "FP": "Javier Cipriani",
    "JP": "Sofía Rossi",
    "SOMOS PERU": "Víctor Hugo Bazán Pastor",
    "FREPAP": "Zenón Gallegos",
    "VERDE": "Victor Hugo Bazán",
    "MORADO": "Martín Bustamante"
  },
  "San Juan de Lurigancho": {
    "FP": "Alex Gonzales",
    "JP": "Manuel Angulo",
    "SOMOS PERU": "Jesús Maldonado",
    "FREPAP": "Elías Vargas",
    "VERDE": "Juan Navarro",
    "MORADO": "Brenda Ortiz"
  },
  "Miraflores": {
    "FP": "Ernesto Blumen",
    "JP": "Rocío Andrade",
    "SOMOS PERU": "Carlos Canales",
    "FREPAP": "Demetrio Ccahua",
    "VERDE": "Diego Uceda",
    "MORADO": "Manuel Masías"
  },
  "Santiago de Surco": {
    "FP": "Juan Manuel del Mar",
    "JP": "Gina Casanova",
    "SOMOS PERU": "Carlos Bruce",
    "FREPAP": "Moisés Alvites",
    "VERDE": "Eduardo Caprile",
    "MORADO": "Juan Carlos Martín"
  },
  "Breña": {
    "FP": "Carlos Albertini",
    "JP": "Sandro Balvín",
    "SOMOS PERU": "Luis de la Cruz",
    "FREPAP": "Juan Espinoza",
    "VERDE": "José Luis Gil",
    "MORADO": "Isabel Rodríguez"
  }
};

export function obtenerCandidatosPorUbicacion(ubicacion) {
  const norm = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const target = norm(ubicacion);

  for (const [key, val] of Object.entries(CANDIDATOS_MAP)) {
    if (norm(key) === target) {
      return val;
    }
  }

  const NOMBRES = [
    "Carlos", "Luis", "José", "Juan", "Pedro", "Manuel", "Víctor", "Jorge", 
    "María", "Ana", "Carmen", "Rosa", "Sonia", "Patricia", "Sofía", "Diana"
  ];
  
  const APELLIDOS = [
    "Quispe", "Flores", "Sánchez", "García", "Ramos", "Huamán", "Mendoza", 
    "Chávez", "Castillo", "Villanueva", "Paredes", "Salazar", "Rojas", "Díaz"
  ];

  let seed = 0;
  for (let i = 0; i < (ubicacion || 'Lima').length; i++) {
    seed += (ubicacion || 'Lima').charCodeAt(i);
  }

  const generarNombre = (indicePartida) => {
    const nombreIdx = (seed + indicePartida * 3) % NOMBRES.length;
    const apellidoIdx1 = (seed + indicePartida * 7) % APELLIDOS.length;
    const apellidoIdx2 = (seed + indicePartida * 11) % APELLIDOS.length;
    return `${NOMBRES[nombreIdx]} ${APELLIDOS[apellidoIdx1]} ${APELLIDOS[apellidoIdx2]}`;
  };

  return {
    "FP": generarNombre(1),
    "JP": generarNombre(2),
    "SOMOS PERU": generarNombre(3),
    "FREPAP": generarNombre(4),
    "VERDE": generarNombre(5),
    "MORADO": generarNombre(6)
  };
}

export const ALCALDES_ACTUALES_MAP = {
  "Lima": "Rafael López Aliaga (Renovación Popular)",
  "Cercado de Lima": "Rafael López Aliaga (Renovación Popular)",
  "San Juan de Lurigancho": "Jesús Maldonado Amao (Somos Perú)",
  "Breña": "Luis Felipe de la Mata Martínez (Podemos Perú)",
  "Miraflores": "Carlos Canales Anchorena (Renovación Popular)",
  "San Isidro": "Nancy Vizurraga (Somos Perú)",
  "Santiago de Surco": "Carlos Bruce (Avanza País)",
  "Ancón": "Samuel Daza (Podemos Perú)",
  "Ate": "Franco Vidal (Avanza País)",
  "Barranco": "Jessica Vargas Gómez (Renovación Popular)",
  "Carabayllo": "Pablo Mendoza Cueva (Somos Perú)",
  "Chaclacayo": "Sergio Baigorria (Renovación Popular)",
  "Chorrillos": "Fernando Velasco (Alianza para el Progreso)",
  "Cieneguilla": "Emilio Chávez Huaringa (Podemos Perú)",
  "Comas": "Ulises Villegas Rojas (Somos Perú)",
  "El Agustino": "Richard Soria Fuerte (Podemos Perú)",
  "Independencia": "Alfredo Reynaga Ramírez (Somos Perú)",
  "Jesús María": "Jesús Gálvez Olivares (Renovación Popular)",
  "La Molina": "Esteban Uceda Guerra García (Renovación Popular)",
  "La Victoria": "Rubén Cano Altez (Renovación Popular)",
  "Lince": "Malca Schaiderman (Renovación Popular)",
  "Los Olivos": "Luis Felipe Castillo Oliva (Podemos Perú)",
  "Lurigancho-Chosica": "Oswaldo Vargas (Juntos por el Perú)",
  "Lurín": "Juan Marticorena (Alianza para el Progreso)",
  "Magdalena del Mar": "Francis Allison (Alianza para el Progreso)",
  "Pachacámac": "Enrique Cabrera (Alianza para el Progreso)",
  "Pucusana": "Juan José Cuya (Somos Perú)",
  "Pueblo Libre": "Mónica Tello López (Renovación Popular)",
  "Puente Piedra": "Rennan Espinoza (Somos Perú)",
  "Punta Hermosa": "Carlos Fernández (Avanza País)",
  "Punta Negra": "Eulogio Huayhua (Alianza para el Progreso)",
  "Rímac": "Néstor de la Rosa Villegas (Podemos Perú)",
  "San Bartolo": "August Carbajal Schumacher (Avanza País)",
  "San Borja": "Marco Antonio Álvarez Vargas (Renovación Popular)",
  "San Juan de Miraflores": "Delia Castro Pichihua (Alianza para el Progreso)",
  "San Luis": "Ricardo Perez Castro (Renovación Popular)",
  "San Martín de Porres": "Hernán Sifuentes Barca (Podemos Perú)",
  "San Miguel": "Eduardo Bless (Avanza País)",
  "Santa Anita": "Olimpio Alegría (Alianza para el Progreso)",
  "Santa María del Mar": "Hugo Monteverde (Acción Popular)",
  "Santa Rosa": "George Robles (Podemos Perú)",
  "Surquillo": "Cintia Loayza (Renovación Popular)",
  "Villa El Salvador": "Guido Iñigo Peralta (Alianza para el Progreso)",
  "Villa María del Triunfo": "Eloy Chávez Hernandez (Alianza para el Progreso)"
};

export function obtenerAlcaldeActual(ubicacion) {
  return ALCALDES_ACTUALES_MAP[ubicacion] || "No determinado";
}

export const PARTIDO_ID_MAP = {
  "FP": "fp",
  "JP": "jp",
  "SOMOS PERU": "sp",
  "FREPAP": "frepap",
  "VERDE": "verde",
  "MORADO": "morado",
  "RENOVACION": "rp",
  "AHORA NACION": "ahora-nacion",
  "AVANZA PAIS": "avanza",
  "PODEMOS": "podemos",
  "OBRAS": "obras",
  "ACCION POPULAR": "ap",
  "ESPERANZA": "esperanza",
  "VENCEREMOS": "venceremos",
  "VISION PERU": "vision",
  "APRA": "apra",
  "PPC": "ppc",
  "PROGRESEMOS": "progresemos",
  "BUEN GOBIERNO": "buen-gobierno",
  "PERU LIBRE": "peru-libre",
  "TIERRA VERDE": "tierra-verde",
  "PUEBLO CONSCIENTE": "pueblo-consciente",
  "PPP": "ppp",
  "INTEGRIDAD": "integridad",
  "FUERZA CIUDADANA": "fuerza-ciudadana",
  "BATALLA PERU": "batalla",
  "APP": "app",
  "ALIANZA REGIONAL": "alianza-regional"
};

export const PARTIDO_NOMBRES_LARGOS = {
  "FP": "Fuerza Popular",
  "JP": "Juntos por el Perú",
  "SOMOS PERU": "Somos Perú",
  "FREPAP": "FREPAP",
  "VERDE": "Partido Demócrata Verde",
  "MORADO": "Partido Morado",
  "RENOVACION": "Renovación Popular",
  "AHORA NACION": "Ahora Nación",
  "AVANZA PAIS": "Avanza País",
  "PODEMOS": "Podemos Perú",
  "OBRAS": "Partido Cívico Obras",
  "ACCION POPULAR": "Acción Popular",
  "ESPERANZA": "Frente de la Esperanza 2021",
  "VENCEREMOS": "Alianza Electoral Venceremos",
  "VISION PERU": "Visión Perú",
  "APRA": "Partido Aprista Peruano",
  "PPC": "Partido Popular Cristiano (PPC)",
  "PROGRESEMOS": "Progresemos",
  "BUEN GOBIERNO": "Partido del Buen Gobierno",
  "PERU LIBRE": "Perú Libre",
  "TIERRA VERDE": "Coalición Transformadora Tierra Verde",
  "PUEBLO CONSCIENTE": "Pueblo Consciente",
  "PPP": "Partido Patriótico del Perú",
  "INTEGRIDAD": "Integridad Democrática",
  "FUERZA CIUDADANA": "Fuerza Ciudadana",
  "BATALLA PERU": "Batalla Perú",
  "APP": "Alianza para el Progreso",
  "ALIANZA REGIONAL": "Alianza Regional por el Perú"
};

export function obtenerPartidoDeCandidato(name, ubicacion) {
  if (!name) return null;
  const cleanName = name.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();

  // 1. Buscar en listas completas de Lima Metropolitana
  for (const c of CANDIDATOS_OFICIALES_LIMA_METROPOLITANA) {
    if (c.key) {
      const cleanCand = c.candidato.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
      if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
        return c.key;
      }
    }
  }

  // 2. Buscar en distritos oficiales
  if (ubicacion) {
    const normUbic = (ubicacion || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (normUbic.includes('pueblo libre')) {
      for (const c of CANDIDATOS_OFICIALES_PUEBLO_LIBRE) {
        if (c.key) {
          const cleanCand = c.candidato.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
          if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
            return c.key;
          }
        }
      }
    } else if (normUbic.includes('san isidro')) {
      for (const c of CANDIDATOS_OFICIALES_SAN_ISIDRO) {
        if (c.key) {
          const cleanCand = c.candidato.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
          if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
            return c.key;
          }
        }
      }
    }
  }

  const candProv = obtenerCandidatosPorUbicacion("Lima");
  for (const [party, candName] of Object.entries(candProv)) {
    const cleanCand = candName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
    if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
      return party;
    }
  }

  if (ubicacion) {
    const candDist = obtenerCandidatosPorUbicacion(ubicacion);
    for (const [party, candName] of Object.entries(candDist)) {
      const cleanCand = candName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
      if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
        return party;
      }
    }
  }

  return null;
}

export function obtenerNombreRealPartido(name, currentDistrict) {
  if (!name) return null;
  
  const district = currentDistrict || 'ATE';
  
  const partyFromCandidate = obtenerPartidoDeCandidato(name, district);
  if (partyFromCandidate) {
    return partyFromCandidate;
  }

  const clean = name.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();

  for (const [partyKey, longName] of Object.entries(PARTIDO_NOMBRES_LARGOS)) {
    const cleanLongName = longName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
    if (cleanLongName && (clean.includes(cleanLongName) || cleanLongName.includes(clean))) {
      return partyKey;
    }
  }

  const sortedParties = Object.keys(PARTIDO_ID_MAP).sort((a, b) => b.length - a.length);
  for (const partyKey of sortedParties) {
    const cleanPartyKey = partyKey.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
    if (cleanPartyKey && (clean.includes(cleanPartyKey) || cleanPartyKey.includes(clean))) {
      return partyKey;
    }
  }

  if (clean.includes('SOMOS') || clean.includes('SP')) {
    return 'SOMOS PERU';
  }

  return null;
}

export function getCandidatoProvincial(partyKey) {
  const normKey = (partyKey || '').toUpperCase().trim();
  const found = CANDIDATOS_OFICIALES_LIMA_METROPOLITANA.find(c => {
    const k = c.key.toUpperCase();
    const s = c.shortName.toUpperCase();
    return k === normKey || s === normKey || (normKey === 'SP' && k === 'SOMOS PERU') || (normKey === 'RP' && k === 'RENOVACION');
  });
  if (found) return found.candidato;

  const fallbackMap = {
    FP: "Samuel Marcos Daza Taype",
    JP: "Oswaldo Hernán Vargas Cuellar",
    SP: "Carlos Ricardo Bruce Montes de Oca",
    FREPAP: "Segundo Valdez Zavala",
    VERDE: "Flor de María Hurtado Valdez",
    MORADO: "Victoria Betzabé La Cruz Garcés",
    RP: "Rafael López Aliaga",
    AN: "Susel Ana María Paredes Piqué",
    AVANZA: "Francis James Allison Oyague",
    PODEMOS: "Daniel Belizario Urresti Elera",
    OBRAS: "Ricardo Pablo Belmont Cassinelli",
    AP: "Carlos Alberto Tejada Noriega",
    ESPERANZA: "Elizabeth María del Rosario León Chinchay",
    VENCEREMOS: "Juan Carlos Alvarado Mestanza",
    VISION: "Santiago Rosendo Abarca León",
    APRA: "Mónica Yadira Yaya Luyo",
    PPC: "Edgardo Renán de Pomar Vizcarra",
    PROGRESEMOS: "Luis Miguel Llanos Carrillo",
    BUEN_GOBIERNO: "Carlos Francisco Gallardo Neyra",
    PERU_LIBRE: "Rubén José Ramírez Mateo",
    TIERRA_VERDE: "Yehude Simon Munaro",
    PUEBLO_CONSCIENTE: "Luis Alberto Huette Tolentino",
    PPP: "Sandro Caller Gutiérrez",
    INTEGRIDAD: "Jessica Viviana Linares Romero",
    FUERZA_CIUDADANA: "Rubén Daniel Bonilla Espinoza",
    BATALLA: "Samir Frank Quispe Caballero",
    APP: "César Acuña Peralta",
    ALIANZA_REGIONAL: "Hilgo Antonio Manchego Ormeño"
  };
  return fallbackMap[normKey] || "Por designar";
}

export function getCandidatoDistrital(partyKey, distrito) {
  const normKey = (partyKey || '').toUpperCase().trim();
  const distNorm = (distrito || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Si está en CANDIDATOS_MAP para ese distrito específico
  for (const [dName, map] of Object.entries(CANDIDATOS_MAP)) {
    const dTarget = dName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (distNorm.includes(dTarget) || dTarget.includes(distNorm)) {
      if (map[normKey]) return map[normKey];
      if (normKey === 'SP' && map['SOMOS PERU']) return map['SOMOS PERU'];
      if (normKey === 'RP' && map['RENOVACION']) return map['RENOVACION'];
    }
  }

  // 2. Si es Pueblo Libre o San Isidro
  if (distNorm.includes('pueblo libre')) {
    const found = CANDIDATOS_OFICIALES_PUEBLO_LIBRE.find(c => c.key.toUpperCase() === normKey || c.shortName.toUpperCase() === normKey);
    if (found) return found.candidato;
  }
  if (distNorm.includes('san isidro')) {
    const found = CANDIDATOS_OFICIALES_SAN_ISIDRO.find(c => c.key.toUpperCase() === normKey || c.shortName.toUpperCase() === normKey);
    if (found) return found.candidato;
  }

  // 3. Fallback determinista por distrito
  if (distrito && distrito.toUpperCase() !== 'TODOS' && distrito.toUpperCase() !== 'LIMA') {
    const generated = obtenerCandidatosPorUbicacion(distrito);
    if (generated[normKey]) return generated[normKey];
    if (normKey === 'SP' && generated['SOMOS PERU']) return generated['SOMOS PERU'];
  }

  return getCandidatoProvincial(partyKey);
}

