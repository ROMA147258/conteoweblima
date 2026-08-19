// ── MAPA ──
let leafletMap = null;
let tileLayer = null;
let districtLayers = {};
let highlightLayer = null;
let currentStyle = 'light';

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

const DISTRICT_COORDS = {
  // Lima Metropolitana
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
  // Barranca
  'Barranca': [-10.7533, -77.7606], 'Paramonga': [-10.6728, -77.8203], 'Pativilca': [-10.6975, -77.7842], 'Supe': [-10.7981, -77.7428], 'Supe Puerto': [-10.8039, -77.7511],
  // Cajatambo
  'Cajatambo': [-10.4739, -76.9847], 'Copa': [-10.4131, -77.0181], 'Gorgor': [-10.5147, -77.1064], 'Huancapón': [-10.5050, -77.1528], 'Manás': [-10.5283, -77.2025],
  // Canta
  'Canta': [-11.4722, -76.6231], 'Arahuay': [-11.6247, -76.6664], 'Lachaqui': [-11.5542, -76.6192], 'Santa Rosa de Quives': [-11.6881, -76.8419],
  // Cañete
  'San Vicente de Cañete': [-13.0758, -76.3853], 'Asia': [-12.7847, -76.5519], 'Cerro Azul': [-13.0247, -76.4789], 'Imperial': [-13.0603, -76.3533], 'Lunahuana': [-12.9642, -76.1364], 'Mala': [-12.6575, -76.6308], 'Nuevo Imperial': [-13.0750, -76.3164], 'Quilmana': [-12.9514, -76.3814],
  // Huaral
  'Huaral': [-11.4947, -77.2078], 'Aucallama': [-11.5647, -77.1722], 'Chancay': [-11.5714, -77.2708], 'Ihuari': [-11.2014, -76.9014], 'Sumbilca': [-11.4114, -76.8122],
  // Huarochirí
  'Matucana': [-11.8433, -76.3989], 'Antioquia': [-12.0792, -76.5058], 'Callahuanca': [-11.8314, -76.6186], 'Ricardo Palma': [-11.9214, -76.6547], 'Santa Eulalia': [-11.9014, -76.6631], 'San Bartolomé': [-11.9125, -76.5283],
  // Huaura
  'Huacho': [-11.1089, -77.6083], 'Ambar': [-11.0028, -77.2725], 'Hualmay': [-11.0964, -77.6042], 'Huaura': [-11.0714, -77.5992], 'Sayán': [-11.1342, -77.1914], 'Vegueta': [-11.0225, -77.6431],
  // Oyón
  'Oyón': [-10.6694, -76.7725], 'Andajes': [-10.7933, -76.8828], 'Caujul': [-10.8242, -76.9208], 'Pachangara': [-10.8114, -76.8528],
  // Yauyos
  'Yauyos': [-12.4608, -75.9225], 'Alis': [-12.2814, -75.7914], 'Catahuasi': [-12.8108, -75.8903], 'Huancaya': [-12.2014, -75.7986], 'Laraos': [-12.3514, -75.7986], 'Tomas': [-12.2414, -75.7414]
};

function initMap() {
  if (leafletMap) return;
  leafletMap = L.map('leafletMap', { zoomControl: false, attributionControl: false }).setView([-12.05, -77.03], 10);
  L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);
  setMapStyle(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  addDistrictMarkers();
}

function setMapStyle(style) {
  currentStyle = style;
  document.querySelectorAll('.style-btn, .style-btn-mini').forEach(b => b.classList.remove('active'));
  const btnMap = { dark: 'styleOscuro', light: 'styleClaro', satellite: 'styleSat', streets: 'styleCalle' };
  document.getElementById(btnMap[style])?.classList.add('active');
  if (tileLayer) leafletMap.removeLayer(tileLayer);
  tileLayer = L.tileLayer(TILE_URLS[style], { maxZoom: 19 }).addTo(leafletMap);
}

function getPartyLeader(votos) {
  if (!votos) return PARTY_KEYS[0];
  return PARTY_KEYS.reduce((a, b) => (votos[a] || 0) > (votos[b] || 0) ? a : b);
}

function addDistrictMarkers() {
  Object.values(districtLayers).forEach(layer => {
    if (leafletMap && leafletMap.hasLayer(layer)) {
      leafletMap.removeLayer(layer);
    }
  });
  districtLayers = {};

  LIMA_DISTRITOS.forEach(d => {
    const coords = DISTRICT_COORDS[d];
    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) {
      return;
    }

    const data = DISTRICT_DATA[d];
    const leader = data ? getPartyLeader(data.votos) : PARTY_KEYS[0];
    const color = data ? PARTIES[leader].color : '#94a3b8';
    const total = data ? totalVotos(data.votos) : 0;
    const pct = total > 0 ? ((data.votos[leader] / total) * 100).toFixed(1) : '0.0';

    const circle = L.circleMarker(coords, {
      radius: 10 + Math.min(total / 8000, 6),
      fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85,
    }).addTo(leafletMap);

    circle.bindTooltip(`<strong>${d}</strong><br>${leader}: ${pct}%`, { direction: 'top' });
    circle.on('click', () => {
      if (typeof LocationFilters !== 'undefined' && LocationFilters.setFromMapDistrict) {
        LocationFilters.setFromMapDistrict(d);
      } else {
        showDistrictOverlay(d);
      }
    });
    districtLayers[d] = circle;
  });
}

let colegioLayers = {};
let currentOverlayTab = 'colegios';
let currentOverlayFilter = '';

function getColegiosDataForDistrito(distrito) {
  const colegioNames = (typeof COLEGIOS_POR_DISTRITO !== 'undefined' && COLEGIOS_POR_DISTRITO[distrito] && COLEGIOS_POR_DISTRITO[distrito].length > 0) ? COLEGIOS_POR_DISTRITO[distrito] :
                       (typeof COLEGIOS_REALES !== 'undefined' && COLEGIOS_REALES[distrito] && COLEGIOS_REALES[distrito].length > 0) ? COLEGIOS_REALES[distrito] :
                       (typeof colegiosForDistrito === 'function' ? colegiosForDistrito(distrito, 'lima-metropolitana') : [`Colegio ${distrito}`]);

  const uniqueCols = Array.from(new Set(colegioNames));
  const mesasInDist = (typeof MESA_DATA !== 'undefined') ? Object.values(MESA_DATA).filter(m => m.distrito === distrito) : [];

  return uniqueCols.map((colName, idx) => {
    const mesasOfCol = mesasInDist.filter(m => m.colegio === colName);
    let totalMesas = mesasOfCol.length;
    let escrutadas = 0;
    let votosObj = {};
    PARTY_KEYS.forEach(k => { votosObj[k] = 0; });

    if (totalMesas > 0) {
      mesasOfCol.forEach(m => {
        const v = m.votos_distrital || m.votos || {};
        let sum = 0;
        PARTY_KEYS.forEach(k => {
          const count = Number(v[k]) || 0;
          votosObj[k] += count;
          sum += count;
        });
        if (sum > 0 || m.estado === 'escrutada') escrutadas++;
      });
    } else {
      const distData = DISTRICT_DATA[distrito];
      const distTotalMesas = distData?.mesas || 12;
      const numCols = Math.max(uniqueCols.length, 1);
      totalMesas = Math.ceil(distTotalMesas / numCols);
      escrutadas = Math.ceil((distData?.mesasEsc || 0) / numCols);
      PARTY_KEYS.forEach(k => {
        votosObj[k] = Math.round((distData?.votos?.[k] || 0) / numCols);
      });
    }

    const totalVotosCol = totalVotos(votosObj);
    const leader = getPartyLeader(votosObj);
    const leaderColor = PARTIES[leader]?.color || '#94a3b8';
    const leaderPct = totalVotosCol > 0 ? ((votosObj[leader] / totalVotosCol) * 100).toFixed(1) : '0.0';

    return {
      name: colName,
      distrito: distrito,
      totalMesas: totalMesas || 1,
      escrutadas: escrutadas,
      votos: votosObj,
      totalVotos: totalVotosCol,
      leader: leader,
      leaderColor: leaderColor,
      leaderPct: leaderPct,
      index: idx
    };
  });
}

function getColegioCoords(distrito, colIndex, totalCols) {
  const center = DISTRICT_COORDS[distrito] || [-12.05, -77.03];
  if (totalCols <= 1) return center;

  const angle = colIndex * (2 * Math.PI / totalCols) + 0.4;
  const radius = 0.005 + (colIndex % 3) * 0.004;
  const lat = center[0] + radius * Math.cos(angle);
  const lng = center[1] + radius * Math.sin(angle) * 1.25;
  return [lat, lng];
}

function clearColegioMarkers() {
  Object.values(colegioLayers).forEach(item => {
    if (leafletMap && item.marker && leafletMap.hasLayer(item.marker)) {
      leafletMap.removeLayer(item.marker);
    }
  });
  colegioLayers = {};
}

function renderColegioMarkers(distrito) {
  clearColegioMarkers();
  if (!leafletMap) return;

  const colegios = getColegiosDataForDistrito(distrito);

  colegios.forEach((col, idx) => {
    const coords = getColegioCoords(distrito, idx, colegios.length);

    const htmlIcon = L.divIcon({
      className: 'colegio-map-marker-container',
      html: `
        <div class="colegio-marker-pin" id="col-pin-${idx}" style="border-color:${col.leaderColor}">
          <span class="colegio-marker-icon">🏫</span>
          <span class="colegio-marker-badge" style="background:${col.leaderColor}">${col.leader}</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker(coords, { icon: htmlIcon }).addTo(leafletMap);

    const tooltipContent = `
      <div style="font-family:var(--font);padding:2px;">
        <div style="font-weight:700;font-size:0.8rem;color:var(--text);">🏫 ${col.name}</div>
        <div style="font-size:0.68rem;color:var(--text3);margin-top:1px;">📍 Distrito: ${col.distrito}</div>
        <div style="display:flex;gap:6px;margin-top:5px;font-size:0.7rem;">
          <span>📋 <strong>${col.escrutadas}/${col.totalMesas}</strong> mesas</span>
          <span>🗳️ <strong>${col.totalVotos.toLocaleString()}</strong> votos</span>
        </div>
        <div style="margin-top:3px;font-size:0.7rem;">
          🏆 Ganador: <strong style="color:${col.leaderColor}">${col.leader} (${col.leaderPct}%)</strong>
        </div>
      </div>
    `;

    marker.bindTooltip(tooltipContent, { direction: 'top', className: 'colegio-tooltip' });

    marker.on('click', () => {
      focusColegio(distrito, col.name);
    });

    colegioLayers[col.name] = { marker, coords, col };
  });
}

function focusColegio(distrito, colName) {
  const item = colegioLayers[colName];
  if (item && leafletMap) {
    leafletMap.flyTo(item.coords, 15, { duration: 0.8 });
    
    document.querySelectorAll('.colegio-marker-pin').forEach(el => el.classList.remove('active'));
    const idx = item.col.index;
    const pinEl = document.getElementById(`col-pin-${idx}`);
    if (pinEl) pinEl.classList.add('active');
  }

  showDistrictOverlay(distrito, 'colegios', colName);
}

function setOverlayTab(tab, distrito) {
  currentOverlayTab = tab;
  renderOverlayContent(distrito);
}

function filterOverlayColegios(query, distrito) {
  currentOverlayFilter = query.toLowerCase().trim();
  renderOverlayContent(distrito);
}

function renderOverlayContent(distrito) {
  const container = document.getElementById('overlayContent');
  if (!container) return;

  const data = DISTRICT_DATA[distrito];
  if (!data) return;
  const totalDist = totalVotos(data.votos);
  const colegios = getColegiosDataForDistrito(distrito);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#e8eaf0' : '#1e293b';
  const subColor = isDark ? '#94a3b8' : '#64748b';

  const tabsHtml = `
    <div class="overlay-tabs">
      <button class="overlay-tab-btn ${currentOverlayTab === 'colegios' ? 'active' : ''}" onclick="setOverlayTab('colegios', '${distrito.replace(/'/g, "\\'")}')">
        🏫 Colegios (${colegios.length})
      </button>
      <button class="overlay-tab-btn ${currentOverlayTab === 'votos' ? 'active' : ''}" onclick="setOverlayTab('votos', '${distrito.replace(/'/g, "\\'")}')">
        📊 Votos Distrito
      </button>
    </div>
  `;

  if (currentOverlayTab === 'colegios') {
    const filteredCols = colegios.filter(c => !currentOverlayFilter || c.name.toLowerCase().includes(currentOverlayFilter));
    
    const searchHtml = `
      <input type="text" class="overlay-search" value="${currentOverlayFilter}" placeholder="🔍 Buscar colegio o local..." oninput="filterOverlayColegios(this.value, '${distrito.replace(/'/g, "\\'")}')">
    `;

    const colegiosCardsHtml = filteredCols.length === 0 
      ? `<div style="font-size:0.75rem;color:var(--text3);text-align:center;padding:1rem;">No se encontraron colegios con "${currentOverlayFilter}".</div>`
      : filteredCols.map(c => {
          const isFocused = (window._focusedColegioName === c.name);
          return `
            <div class="colegio-card ${isFocused ? 'active' : ''}" id="col-card-${c.index}">
              <div class="colegio-card-title">
                <span>🏫</span>
                <span style="flex:1;">${c.name}</span>
              </div>
              <div class="colegio-card-stats">
                <span>📋 Mesas: <strong>${c.escrutadas}/${c.totalMesas}</strong></span>
                <span>🗳️ Votos: <strong>${c.totalVotos.toLocaleString()}</strong></span>
                <span>🏆 Líder: <strong style="color:${c.leaderColor}">${c.leader} (${c.leaderPct}%)</strong></span>
              </div>
              <div style="height:4px;background:var(--border-light);border-radius:2px;overflow:hidden;margin-bottom:0.4rem;">
                <div style="width:${c.leaderPct}%;height:100%;background:${c.leaderColor};border-radius:2px;"></div>
              </div>
              <div style="display:flex;justify-content:flex-end;">
                <button class="colegio-card-action" onclick="focusColegio('${distrito.replace(/'/g, "\\'")}', '${c.name.replace(/'/g, "\\'")}')">
                  📍 Ubicar en mapa
                </button>
              </div>
            </div>
          `;
        }).join('');

    container.innerHTML = tabsHtml + searchHtml + colegiosCardsHtml;
  } else {
    const rows = PARTY_KEYS.map(k => {
      const pct = totalDist > 0 ? ((data.votos[k] / totalDist) * 100).toFixed(1) : '0.0';
      return `<div style="margin:.4rem 0">
        <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:.2rem">
          <span style="color:${PARTIES[k].color};font-weight:600">${k}</span>
          <span style="color:${textColor}">${data.votos[k].toLocaleString()} (${pct}%)</span>
        </div>
        <div style="height:5px;background:var(--border);border-radius:3px">
          <div style="width:${pct}%;height:100%;background:${PARTIES[k].color};border-radius:3px;transition:width 0.5s"></div>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = tabsHtml + `
      <div style="font-size:.72rem;color:${subColor};margin-bottom:.5rem">Mesas: ${data.mesasEsc}/${data.mesas} escrutadas · ${data.provincia}</div>
      ${rows}
      <div style="margin-top:.75rem;font-size:.72rem;color:${subColor}">Total Votos: ${totalDist.toLocaleString()}</div>
    `;
  }

  if (window._focusedColegioName) {
    const colObj = colegios.find(c => c.name === window._focusedColegioName);
    if (colObj) {
      setTimeout(() => {
        const el = document.getElementById(`col-card-${colObj.index}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }
}

function showDistrictOverlay(distrito, tab = 'colegios', focusedColegio = null) {
  const data = DISTRICT_DATA[distrito];
  if (!data) return;

  window._focusedColegioName = focusedColegio || null;
  currentOverlayTab = tab;
  currentOverlayFilter = '';

  const subtitleEl = document.getElementById('overlaySubtitle');
  if (subtitleEl) {
    subtitleEl.textContent = `${data.provincia} · ${data.mesasEsc}/${data.mesas} mesas escrutadas`;
  }

  document.getElementById('overlayTitle').textContent = `📍 ${distrito}`;
  renderOverlayContent(distrito);

  document.getElementById('mapOverlay').style.display = 'flex';
}

function closeMapOverlay() {
  document.getElementById('mapOverlay').style.display = 'none';
  window._focusedColegioName = null;
  document.querySelectorAll('.colegio-marker-pin').forEach(el => el.classList.remove('active'));
}

function getActiveDistricts() {
  const f = window.VR_FILTER || { level: 'lima' };
  if (f.distrito) return [f.distrito];
  if (f.level === 'provincia' && f.provincia) {
    const p = PROVINCIAS.find(prov => prov.id === f.provincia);
    return p ? p.distritos : [];
  }
  return LIMA_DISTRITOS;
}

function highlightMapForFilter() {
  if (!leafletMap) return;

  if (Object.keys(districtLayers).length === 0) {
    addDistrictMarkers();
  }

  // Actualizar panel de estadísticas
  updateMapStatsBar();

  const active = getActiveDistricts();
  const isFiltered = (window.VR_FILTER?.level !== 'lima');

  Object.entries(districtLayers).forEach(([name, layer]) => {
    const isActive = !isFiltered || active.includes(name);
    const data = DISTRICT_DATA[name];
    
    const leader = data ? getPartyLeader(data.votos) : PARTY_KEYS[0];
    const color = data ? PARTIES[leader].color : '#94a3b8';
    const total = data ? totalVotos(data.votos) : 0;
    const pct = total > 0 ? ((data.votos[leader] / total) * 100).toFixed(1) : '0.0';

    layer.setStyle({
      fillColor: color,
      fillOpacity: isActive ? 0.9 : 0.12,
      opacity: isActive ? 1 : 0.25,
      weight: isActive ? (active.length === 1 && active[0] === name ? 4 : 2.5) : 1,
      radius: isActive ? (10 + Math.min(total / 8000, 6)) * (active.length === 1 && active[0] === name ? 1.4 : 1) : 6,
    });
    layer.setTooltipContent(`<strong>${name}</strong><br>${leader}: ${pct}%`);
    if (isActive) layer.bringToFront();
  });

  if (highlightLayer) {
    leafletMap.removeLayer(highlightLayer);
    highlightLayer = null;
  }

  if (isFiltered && active.length > 0) {
    const f = window.VR_FILTER || { level: 'lima' };
    const coords = active.map(d => DISTRICT_COORDS[d]).filter(c => c && !isNaN(c[0]) && !isNaN(c[1]));
    if (coords.length === 1) {
      const zoom = f.mesa ? 15 : f.colegio ? 14 : 13;
      leafletMap.flyTo(coords[0], zoom, { duration: 1 });
      if (f.level === 'distrito' || f.level === 'colegio' || f.level === 'mesa') {
        renderColegioMarkers(active[0]);
        showDistrictOverlay(active[0], 'colegios', f.colegio || null);
      }
      const hint = document.getElementById('mapZoomHint');
      if (hint) hint.style.opacity = '0';
    } else if (coords.length > 1) {
      const bounds = L.latLngBounds(coords);
      leafletMap.flyToBounds(bounds.pad(0.15), { duration: 1.2, maxZoom: 12 });
      clearColegioMarkers();
      closeMapOverlay();
      const hint = document.getElementById('mapZoomHint');
      if (hint) hint.style.opacity = '0';
    }
  } else {
    leafletMap.flyTo([-12.05, -77.03], 10, { duration: 1 });
    clearColegioMarkers();
    closeMapOverlay();
    const hint = document.getElementById('mapZoomHint');
    if (hint) hint.style.opacity = '1';
  }
}

function resetMapView() {
  if (!leafletMap) return;
  leafletMap.flyTo([-12.05, -77.03], 10, { duration: 1 });
  closeMapOverlay();
}

function populateDistritoSelect() { /* handled by LocationFilters */ }

// ── ACTUALIZAR PANEL DE ESTADÍSTICAS ENCIMA DEL MAPA ──

function updateMapStatsBar() {
  const f = window.VR_FILTER || { level: 'lima' };
  const activeDistricts = getActiveDistricts();

  // Calcular totales para los distritos activos
  let totalMesas = 0, totalEscrut = 0, totalVotos = 0;
  const partyTotals = {};
  PARTY_KEYS.forEach(k => partyTotals[k] = 0);

  activeDistricts.forEach(d => {
    const data = DISTRICT_DATA[d];
    if (!data) return;
    totalMesas += (data.mesas || 0);
    totalEscrut += (data.mesasEsc || 0);
    const tv = Object.values(data.votos || {}).reduce((a, b) => a + b, 0);
    totalVotos += tv;
    PARTY_KEYS.forEach(k => { partyTotals[k] = (partyTotals[k] || 0) + (data.votos?.[k] || 0); });
  });

  const avancePct = totalMesas > 0 ? Math.round((totalEscrut / totalMesas) * 100) : 0;

  // — Partido líder —
  const leader = totalVotos > 0 ? PARTY_KEYS.reduce((a, b) => (partyTotals[a] || 0) > (partyTotals[b] || 0) ? a : b) : null;
  const leaderColor = leader ? (PARTIES[leader]?.color || '#94a3b8') : '#94a3b8';
  const leaderPct = leader && totalVotos > 0 ? ((partyTotals[leader] / totalVotos) * 100).toFixed(1) : '0';
  const leaderName = leader ? (PARTIES[leader]?.name || leader) : '—';

  const leaderCard = document.getElementById('mapLeaderCard');
  if (leaderCard) leaderCard.style.borderLeftColor = leaderColor;
  const leaderNameEl = document.getElementById('mapLeaderName');
  if (leaderNameEl) { leaderNameEl.textContent = leader || 'Sin datos'; leaderNameEl.style.color = leaderColor; }
  const leaderPctEl = document.getElementById('mapLeaderPct');
  if (leaderPctEl) leaderPctEl.textContent = leader ? `${leaderName} · ${leaderPct}%` : '—';

  // — Mini barras de distribución —
  const barsList = document.getElementById('mapPartyBarsList');
  if (barsList) {
    barsList.innerHTML = PARTY_KEYS.map(k => {
      const votes = partyTotals[k] || 0;
      const pct = totalVotos > 0 ? ((votes / totalVotos) * 100).toFixed(1) : '0.0';
      const color = PARTIES[k]?.color || '#94a3b8';
      return `<div class="map-party-bar-item">
        <span class="map-party-bar-key" style="color:${color}">${k}</span>
        <div class="map-party-bar-track">
          <div class="map-party-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <span class="map-party-bar-pct">${pct}%</span>
      </div>`;
    }).join('');
  }

  // — Leyenda con porcentajes —
  PARTY_KEYS.forEach(k => {
    const el = document.getElementById('legPct' + k);
    if (!el) return;
    const pct = totalVotos > 0 ? ((partyTotals[k] || 0) / totalVotos * 100).toFixed(1) : '0.0';
    el.textContent = pct + '%';
  });

  // — Avance —
  const avancePctEl = document.getElementById('mapAvancePct');
  if (avancePctEl) avancePctEl.textContent = avancePct + '%';
  const avanceFill = document.getElementById('mapAvanceFill');
  if (avanceFill) avanceFill.style.width = avancePct + '%';
  const avanceSub = document.getElementById('mapAvanceSub');
  if (avanceSub) avanceSub.textContent = `${totalEscrut} de ${totalMesas} mesas`;

  // — Zona activa —
  const zona = LocationFilters?.getLevelLabel?.() || 'Lima (todas)';
  const zonaSub = `Nivel: ${f.level || 'general'} · ${activeDistricts.length} distrito(s)`;
  const zonaEl = document.getElementById('mapZonaActiva');
  if (zonaEl) zonaEl.textContent = zona;
  const zonaSubEl = document.getElementById('mapZonaSub');
  if (zonaSubEl) zonaSubEl.textContent = zonaSub;

  // — Header KPIs —
  const statMesas = document.getElementById('statMesasEsc');
  if (statMesas) statMesas.textContent = `${totalEscrut}/${totalMesas}`;
  const statVotosEl = document.getElementById('statVotos');
  if (statVotosEl) statVotosEl.textContent = totalVotos.toLocaleString();
  const statDistEl = document.getElementById('statDistritos');
  if (statDistEl) statDistEl.textContent = activeDistricts.length;

  // — Subtítulo —
  const subtitle = document.getElementById('mapSubtitle');
  if (subtitle) subtitle.textContent = `Visualización geográfica · ${zona}`;

  // — Top distritos (por votos) —
  const topList = document.getElementById('mapTopDistrictsList');
  if (topList) {
    const ranked = activeDistricts
      .map(d => ({ name: d, total: Object.values(DISTRICT_DATA[d]?.votos || {}).reduce((a,b)=>a+b,0) }))
      .filter(x => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    if (ranked.length === 0) {
      topList.innerHTML = '<span style="color:var(--text3);font-size:0.65rem;">Sin datos disponibles</span>';
    } else {
      topList.innerHTML = ranked.map((x, i) => `
        <div style="display:flex;align-items:center;gap:0.35rem;padding:0.15rem 0;border-bottom:1px solid var(--border-light);">
          <span style="font-size:0.62rem;font-weight:800;color:var(--accent);width:12px;">${i+1}</span>
          <span style="flex:1;font-size:0.65rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x.name}</span>
          <span style="font-size:0.62rem;color:var(--text3);">${x.total.toLocaleString()}</span>
        </div>`).join('');
    }
  }
}
