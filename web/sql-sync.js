// ── SINCRONIZACIÓN SQL SERVER 2022 (BD: conteo) ──
/**
 * Almacenamiento seguro en localStorage que previene el error QuotaExceededError
 */
function safeSetLocalStorage(key, value) {
  try {
    const valStr = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, valStr);
    return true;
  } catch (e) {
    console.warn(`localStorage QuotaExceededError capturado al guardar '${key}'. Ejecutando rutina de limpieza...`);
    try {
      localStorage.removeItem('vr_sheet_report');
      localStorage.removeItem('vr_combined_asistencia_data_old');
      localStorage.removeItem('vr_activity');
    } catch (_) {}
    
    try {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, valStr);
      return true;
    } catch (err2) {
      console.warn(`No se pudo guardar '${key}' en localStorage (se mantendrá en memoria global).`, err2);
      return false;
    }
  }
}
window.safeSetLocalStorage = safeSetLocalStorage;

const DISTRICT_ALIASES = {
  'Cercado de Lima': 'Lima',
  'Lurigancho-Chosica': 'Lurigancho',
  'Lurigancho Chosica': 'Lurigancho',
  'San Juan de Lurigancho (SJL)': 'San Juan de Lurigancho',
  'Villa El Salvador (VES)': 'Villa El Salvador',
  'Villa María del Triunfo (VMT)': 'Villa María del Triunfo',
};

const SQL_TO_PARTY = {
  FP: 'FP', JP: 'JP', SP: 'SP',
  SOMOS_PERU: 'SP', FREPAP: 'FR', VERDE: 'VE', MORADO: 'MO',
  NULOS: 'NULOS', VACIOS: 'VACIOS',
  votos_nulos: 'NULOS', votos_vacios: 'VACIOS',
  votos_dist_nulos: 'NULOS', votos_dist_vacios: 'VACIOS'
};

function getZeroVotesObj() {
  const obj = {};
  PARTY_KEYS.forEach(k => { obj[k] = 0; });
  return obj;
}

function normalizeDistrito(name) {
  if (!name) return null;
  const trimmed = name.toString().trim();
  if (DISTRICT_ALIASES[trimmed]) return DISTRICT_ALIASES[trimmed];
  
  const clean = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const cleanedTarget = clean(trimmed);
  
  const match = Object.keys(DISTRICT_DATA).find(k => clean(k) === cleanedTarget);
  if (match) return match;
  
  const found = LIMA_DISTRITOS.find(d => clean(d) === cleanedTarget);
  return found || trimmed;
}

function mapSqlVotes(votosObj) {
  const mapped = getZeroVotesObj();
  if (!votosObj) return mapped;
  Object.entries(votosObj).forEach(([key, val]) => {
    const party = SQL_TO_PARTY[key] || SQL_TO_PARTY[key.toUpperCase()];
    if (party) mapped[party] += parseInt(val) || 0;
  });
  return mapped;
}

function rebuildDistrictTotals() {
  Object.keys(DISTRICT_DATA).forEach(d => {
    const totals = getZeroVotesObj();
    const provTotals = getZeroVotesObj();
    const distTotals = getZeroVotesObj();
    const uniqueMesas = new Set();
    const uniqueEscMesas = new Set();
    const colegioSet = new Set(COLEGIOS_REALES[d] || []);

    Object.values(MESA_DATA).forEach(m => {
      if (m.distrito === d) {
        uniqueMesas.add(m.mesa);
        if (m.colegio) colegioSet.add(m.colegio);
        PARTY_KEYS.forEach(k => {
          totals[k] += (m.votos?.[k] || 0);
          provTotals[k] += (m.votos_provincial?.[k] || 0);
          distTotals[k] += (m.votos_distrital?.[k] || 0);
        });
        if (totalVotos(m.votos || {}) > 0 || totalVotos(m.votos_provincial || {}) > 0 || totalVotos(m.votos_distrital || {}) > 0) {
          uniqueEscMesas.add(m.mesa);
        }
      }
    });

    COLEGIOS_POR_DISTRITO[d] = [...colegioSet].sort();
    DISTRICT_DATA[d].votos = totals;
    DISTRICT_DATA[d].votos_provincial = provTotals;
    DISTRICT_DATA[d].votos_distrital = distTotals;
    DISTRICT_DATA[d].mesas = uniqueMesas.size || 1;
    DISTRICT_DATA[d].mesasEsc = uniqueEscMesas.size;
  });
}

function applySqlReport(report) {
  if (!report || !report.success) return { ok: false, message: 'Respuesta inválida del servidor' };

  let mesasActualizadas = 0;

  // 1. Construir estructura dinámica de mesas
  if (Array.isArray(report.mesas_estructura) && report.mesas_estructura.length > 0) {
    PROVINCIAS.length = 0;
    LIMA_DISTRITOS.length = 0;
    for (const key in COLEGIOS_POR_DISTRITO) delete COLEGIOS_POR_DISTRITO[key];
    for (const key in MESA_DATA) delete MESA_DATA[key];
    for (const key in DISTRICT_DATA) delete DISTRICT_DATA[key];

    const tempProvincias = {};

    report.mesas_estructura.forEach(item => {
      const provName = item.provincia || 'Lima Metropolitana';
      const distName = item.distrito;
      const realCols = COLEGIOS_REALES[distName] || [];
      const defaultCol = realCols[0] || `Colegio ${distName}`;
      const colName = item.colegio || defaultCol;
      const mesaNum = String(item.mesa || '').trim();

      if (!distName || !mesaNum) return;

      if (!tempProvincias[provName]) {
        tempProvincias[provName] = {
          id: provName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          name: provName,
          distritos: new Set()
        };
      }
      tempProvincias[provName].distritos.add(distName);

      if (!COLEGIOS_POR_DISTRITO[distName]) {
        COLEGIOS_POR_DISTRITO[distName] = [];
      }
      if (!COLEGIOS_POR_DISTRITO[distName].includes(colName)) {
        COLEGIOS_POR_DISTRITO[distName].push(colName);
      }

      // Mesa MANUAL
      const keyManual = `${distName}|${colName}|${mesaNum}|MANUAL`;
      MESA_DATA[keyManual] = {
        votos: getZeroVotesObj(),
        votos_provincial: getZeroVotesObj(),
        votos_distrital: getZeroVotesObj(),
        distrito: distName,
        colegio: colName,
        mesa: mesaNum,
        brigadista: '',
        origen: 'MANUAL',
        fecha: null,
        fromSql: false
      };

      // Mesa IMAGEN
      const keyImagen = `${distName}|${colName}|${mesaNum}|IMAGEN`;
      MESA_DATA[keyImagen] = {
        votos: getZeroVotesObj(),
        votos_provincial: getZeroVotesObj(),
        votos_distrital: getZeroVotesObj(),
        distrito: distName,
        colegio: colName,
        mesa: mesaNum,
        brigadista: '',
        origen: 'IMAGEN',
        fecha: null,
        fromSql: false
      };

      if (!DISTRICT_DATA[distName]) {
        DISTRICT_DATA[distName] = {
          votos: getZeroVotesObj(),
          votos_provincial: getZeroVotesObj(),
          votos_distrital: getZeroVotesObj(),
          mesas: 0,
          mesasEsc: 0,
          colegios: COLEGIOS_POR_DISTRITO[distName],
          provincia: provName
        };
      }
    });

    Object.values(tempProvincias).forEach(p => {
      PROVINCIAS.push({
        id: p.id,
        name: p.name,
        distritos: Array.from(p.distritos).sort()
      });
    });

    PROVINCIAS.sort((a, b) => a.name.localeCompare(b.name));

    PROVINCIAS.forEach(p => {
      p.distritos.forEach(d => {
        LIMA_DISTRITOS.push(d);
      });
    });

    localStorage.setItem('vr_provincias', JSON.stringify(PROVINCIAS));
    localStorage.setItem('vr_lima_distritos', JSON.stringify(LIMA_DISTRITOS));
    localStorage.setItem('vr_colegios_por_distrito', JSON.stringify(COLEGIOS_POR_DISTRITO));
  } else {
    Object.keys(MESA_DATA).forEach(key => {
      MESA_DATA[key].votos = getZeroVotesObj();
      MESA_DATA[key].votos_provincial = getZeroVotesObj();
      MESA_DATA[key].votos_distrital = getZeroVotesObj();
      MESA_DATA[key].fromSql = false;
      MESA_DATA[key].brigadista = '';
      MESA_DATA[key].fecha = null;
      if (!MESA_DATA[key].origen) {
        MESA_DATA[key].origen = key.endsWith('|IMAGEN') ? 'IMAGEN' : 'MANUAL';
      }
    });

    Object.keys(DISTRICT_DATA).forEach(d => {
      DISTRICT_DATA[d].votos = getZeroVotesObj();
      DISTRICT_DATA[d].votos_provincial = getZeroVotesObj();
      DISTRICT_DATA[d].votos_distrital = getZeroVotesObj();
      DISTRICT_DATA[d].mesasEsc = 0;
    });
  }

  if (Array.isArray(report.mesas)) {
    report.mesas.forEach(row => {
      const distrito = normalizeDistrito(row.ubicacion);
      if (!distrito) return;

      const mesaNum = String(row.mesa || '').trim();
      if (!mesaNum) return;

      const provVotos = mapSqlVotes(row.votos_provincial);
      const distVotos = mapSqlVotes(row.votos_distrital);
      const hasVotes = totalVotos(distVotos) > 0 || totalVotos(provVotos) > 0;
      const votos = totalVotos(distVotos) > 0 ? distVotos : provVotos;

      const targetOrigen = (row.origen === 'OCR' || row.origen === 'IMAGEN') ? 'IMAGEN' : 'MANUAL';

      let key = Object.keys(MESA_DATA).find(k => {
        const m = MESA_DATA[k];
        return m.distrito === distrito && String(m.mesa) === String(mesaNum) && m.origen === targetOrigen;
      });

      let colegio = row.colegio || (key ? MESA_DATA[key].colegio : null);
      if (!colegio) {
        const realCols = COLEGIOS_REALES[distrito] || [];
        colegio = realCols[0] || `Colegio ${distrito}`;
      }
      key = `${distrito}|${colegio}|${mesaNum}|${targetOrigen}`;

      if (!DISTRICT_DATA[distrito]) {
        const foundProv = PROVINCIAS.find(p => p.distritos.includes(distrito));
        const provName = foundProv ? foundProv.name : 'Lima Metropolitana';
        DISTRICT_DATA[distrito] = {
          votos: getZeroVotesObj(),
          votos_provincial: getZeroVotesObj(),
          votos_distrital: getZeroVotesObj(),
          mesas: 0,
          mesasEsc: 0,
          colegios: [colegio],
          provincia: provName,
        };
        COLEGIOS_POR_DISTRITO[distrito] = DISTRICT_DATA[distrito].colegios;
      }

      if (!COLEGIOS_POR_DISTRITO[distrito]?.includes(colegio)) {
        COLEGIOS_POR_DISTRITO[distrito] = COLEGIOS_POR_DISTRITO[distrito] || [];
        COLEGIOS_POR_DISTRITO[distrito].push(colegio);
      }

      MESA_DATA[key] = {
        votos: hasVotes ? { ...votos } : getZeroVotesObj(),
        votos_provincial: provVotos,
        votos_distrital: distVotos,
        distrito,
        colegio,
        mesa: mesaNum,
        brigadista: row.brigadista || '',
        origen: targetOrigen,
        fecha: row.fecha || null,
        fromSql: true,
      };

      if (hasVotes) mesasActualizadas++;
    });
    rebuildDistrictTotals();
  }

  window.VR_SHEET_REPORT = report;
  safeSetLocalStorage('vr_sheet_report', report);
  safeSetLocalStorage('vr_district_data', DISTRICT_DATA);
  
  const customMesas = {};
  Object.entries(MESA_DATA).forEach(([key, m]) => {
    const hasVotes = totalVotos(m.votos || {}) > 0 || totalVotos(m.votos_provincial || {}) > 0 || totalVotos(m.votos_distrital || {}) > 0;
    if (m.fromSql || hasVotes || m.brigadista || m.origen) {
      customMesas[key] = m;
    }
  });
  safeSetLocalStorage('vr_mesa_data_custom', customMesas);
  try { localStorage.removeItem('vr_mesa_data'); } catch (_) {}

  try {
    if (typeof DashboardCore !== 'undefined' && typeof DashboardCore.renderAll === 'function') {
      DashboardCore.renderAll();
    }
    if (typeof updateKPIs === 'function') {
      updateKPIs();
    }
  } catch (e) {}

  return {
    ok: true,
    mesas: mesasActualizadas,
    escrutadas: report.mesas_escrutadas || mesasActualizadas,
    totales: report.totales_distrital || report.totales_provincial,
  };
}

async function fetchSqlData(url) {
  const targetEndpoint = (url && url.startsWith('/api')) ? url : '/api/voto-real';
  try {
    const res = await fetch(`${targetEndpoint}${targetEndpoint.includes('?') ? '&' : '?'}action=obtener_reporte`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.success || data.mesas || data.totales_provincial)) {
        return data;
      }
    }
  } catch (e) {
    console.warn("SQL Server fetch warning:", e);
  }
  const res = await fetch('/api/voto-real?action=obtener_reporte');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al conectar con la Base de Datos SQL Server');
  }
  return res.json();
}

async function syncFromSqlServer(url) {
  const endpointUrl = '/api/voto-real';

  const report = await fetchSqlData(endpointUrl);
  const result = applySqlReport(report);
  if (!result.ok) throw new Error(result.message);

  if (typeof syncAsistenciaData === 'function') {
    await syncAsistenciaData(endpointUrl).catch((err) => {
      console.error("Error al sincronizar Asistencia (Coordinadores) en flujo global:", err);
    });
  }

  if (typeof syncPersonerosData === 'function') {
    await syncPersonerosData(endpointUrl).catch((err) => {
      console.error("Error al sincronizar Personeros en flujo global:", err);
    });
  }

  const nowStr = new Date().toLocaleString('es-PE');
  localStorage.setItem('sheet_last_sync', nowStr);

  if (typeof markDashboardDirty === 'function') markDashboardDirty();
  if (typeof DashboardCore !== 'undefined' && typeof DashboardCore.renderAll === 'function') {
    DashboardCore.renderAll();
  }
  if (typeof updateKPIs === 'function') {
    updateKPIs();
  }
  if (typeof markAnalyticsDirty === 'function') markAnalyticsDirty();
  if (typeof markComparisonDirty === 'function') markComparisonDirty();

  const dashView = document.getElementById('view-dashboard');
  if (dashView?.classList.contains('active') && typeof buildDashboard === 'function') buildDashboard();
  if (typeof buildEditDashboard === 'function') {
    const v = document.getElementById('view-config-edit-dashboard');
    if (v?.classList.contains('active')) buildEditDashboard();
  }
  if (typeof buildEditDiagramas === 'function') {
    const v = document.getElementById('view-config-edit-diagramas');
    if (v?.classList.contains('active')) buildEditDiagramas();
  }
  const analyticsView = document.getElementById('view-analytics');
  if (analyticsView?.classList.contains('active') && typeof refreshAnalytics === 'function') refreshAnalytics();
  const compareView = document.getElementById('view-comparacion');
  if (compareView?.classList.contains('active') && typeof refreshComparison === 'function') refreshComparison();
  const asistenciaView = document.getElementById('view-asistencia');
  const aperturaView = document.getElementById('view-apertura');
  if (asistenciaView?.classList.contains('active') && typeof applyAsistenciaFilters === 'function') applyAsistenciaFilters();
  if (aperturaView?.classList.contains('active') && typeof applyPersonerosFilters === 'function') applyPersonerosFilters();

  if (typeof updateKPIs === 'function') updateKPIs();
  if (typeof highlightMapForFilter === 'function') highlightMapForFilter();

  if (typeof LocationFilters !== 'undefined') {
    LocationFilters.init();
  }

  if (typeof Comparison !== 'undefined' && typeof Comparison.init === 'function') {
    Comparison.updateControlsFromState();
    Comparison.renderComparison();
  }

  return { ...result, syncedAt: nowStr, report };
}

// Aliases for compatibility
const syncFromGoogleSheet = syncFromSqlServer;
const fetchSheetData = fetchSqlData;
const applySheetReport = applySqlReport;

function restorePersistedSqlData() {
  try {
    const provs = localStorage.getItem('vr_provincias');
    const dists = localStorage.getItem('vr_lima_distritos');
    const cols = localStorage.getItem('vr_colegios_por_distrito');
    const districts = localStorage.getItem('vr_district_data');
    
    if (provs && dists && cols && districts) {
      PROVINCIAS.length = 0;
      Object.assign(PROVINCIAS, JSON.parse(provs));
      
      LIMA_DISTRITOS.length = 0;
      Object.assign(LIMA_DISTRITOS, JSON.parse(dists));
      
      for (const k in COLEGIOS_POR_DISTRITO) delete COLEGIOS_POR_DISTRITO[k];
      Object.assign(COLEGIOS_POR_DISTRITO, JSON.parse(cols));
      
      for (const k in DISTRICT_DATA) delete DISTRICT_DATA[k];
      Object.assign(DISTRICT_DATA, JSON.parse(districts));
    }

    const mesas = localStorage.getItem('vr_mesa_data_custom') || localStorage.getItem('vr_mesa_data');
    if (mesas) {
      const parsed = JSON.parse(mesas);
      for (const k in MESA_DATA) delete MESA_DATA[k];
      Object.assign(MESA_DATA, parsed);
      rebuildDistrictTotals();
    }
    const report = localStorage.getItem('vr_sheet_report');
    if (report) window.VR_SHEET_REPORT = JSON.parse(report);
  } catch (_) {}
}

const restorePersistedSheetData = restorePersistedSqlData;

restorePersistedSqlData();
