// ── FILTROS JERÁRQUICOS ONPE ──
window.VR_FILTER = { level: 'lima', departamento: 'LIMA' };

const VIEW_CHART_PREFIXES = ['an-', 'cmp-'];

/** Vistas donde el filtro actualiza datos sin ir al mapa */
const FILTER_DATA_VIEWS = ['dashboard', 'comparacion', 'config-edit-dashboard', 'config-edit-diagramas', 'asistencia'];

const LocationFilters = {
  _skipMapNav: false,

  init() {
    this.populateProvincias();
    this.clearSelect('filtDistrito');
    this.clearSelect('filtColegio');
    this.clearSelect('filtMesa');
    this.bindEvents();
    this.restoreFromStorage();
    this.updateBreadcrumb();
    this.updateFilterModeHint();
  },

  getActiveView() {
    const views = ['dashboard', 'mapa', 'comparacion', 'config-sincronizacion', 'config-edit-dashboard', 'config-edit-diagramas', 'asistencia'];
    for (const v of views) {
      const el = document.getElementById('view-' + v);
      if (el?.classList.contains('active')) return v;
    }
    return 'dashboard';
  },

  shouldNavigateToMap() {
    return this.getActiveView() === 'mapa';
  },

  bindEvents() {
    ['filtDepartamento', 'filtProvincia', 'filtDistrito', 'filtColegio', 'filtMesa'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => this.onFilterChange(id));
    });
  },

  saveToStorage() {
    try {
      localStorage.setItem('vr_filter', JSON.stringify({
        dep: document.getElementById('filtDepartamento')?.value || 'lima',
        prov: document.getElementById('filtProvincia')?.value || '',
        dist: document.getElementById('filtDistrito')?.value || '',
        col: document.getElementById('filtColegio')?.value || '',
        mesa: document.getElementById('filtMesa')?.value || '',
      }));
    } catch (_) { /* quota */ }
  },

  restoreFromStorage() {
    try {
      const raw = localStorage.getItem('vr_filter');
      if (!raw) return;
      const saved = JSON.parse(raw);
      const depEl = document.getElementById('filtDepartamento');
      if (depEl && saved.dep) depEl.value = saved.dep;
      if (saved.prov) {
        const provEl = document.getElementById('filtProvincia');
        if (provEl) {
          provEl.value = saved.prov;
          this.populateDistritos(provEl.value);
        }
      }
      if (saved.dist) {
        const distEl = document.getElementById('filtDistrito');
        if (distEl) {
          distEl.value = saved.dist;
          this.populateColegios(distEl.value);
        }
      }
      if (saved.col) {
        const colEl = document.getElementById('filtColegio');
        if (colEl) {
          colEl.value = saved.col;
          this.populateMesas(document.getElementById('filtDistrito')?.value || '', colEl.value);
        }
      }
      if (saved.mesa) {
        const mesaEl = document.getElementById('filtMesa');
        if (mesaEl) mesaEl.value = saved.mesa;
      }
      this.updateFilterState(
        document.getElementById('filtDepartamento')?.value || 'lima',
        document.getElementById('filtProvincia')?.value || '',
        document.getElementById('filtDistrito')?.value || '',
        document.getElementById('filtColegio')?.value || '',
        document.getElementById('filtMesa')?.value || ''
      );
    } catch (_) { /* corrupt */ }
  },

  populateProvincias() {
    const sel = document.getElementById('filtProvincia');
    if (!sel) return;
    sel.innerHTML = '<option value="">Todas las provincias</option>';
    PROVINCIAS.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = p.name;
      sel.appendChild(o);
    });
  },

  onFilterChange(changedId) {
    if (changedId === 'filtDepartamento') {
      const dep = document.getElementById('filtDepartamento')?.value || '';
      if (!dep) {
        document.getElementById('filtProvincia').value = '';
        this.clearSelect('filtDistrito');
        this.clearSelect('filtColegio');
        this.clearSelect('filtMesa');
      }
    } else if (changedId === 'filtProvincia') {
      const prov = document.getElementById('filtProvincia')?.value || '';
      this.populateDistritos(prov);
      this.clearSelect('filtColegio');
      this.clearSelect('filtMesa');
    } else if (changedId === 'filtDistrito') {
      const dist = document.getElementById('filtDistrito')?.value || '';
      this.populateColegios(dist);
      this.clearSelect('filtMesa');
    } else if (changedId === 'filtColegio') {
      const dist = document.getElementById('filtDistrito')?.value || '';
      const col = document.getElementById('filtColegio')?.value || '';
      this.populateMesas(dist, col);
    }

    const dep = document.getElementById('filtDepartamento')?.value || 'lima';
    const prov = document.getElementById('filtProvincia')?.value || '';
    const dist = document.getElementById('filtDistrito')?.value || '';
    const col = document.getElementById('filtColegio')?.value || '';
    const mesa = document.getElementById('filtMesa')?.value || '';

    this.updateFilterState(dep, prov, dist, col, mesa);
    this.updateBreadcrumb();
    this.updateFilterModeHint();
    this.saveToStorage();
    this.notifyChange();

    if (!this._skipMapNav && this.shouldNavigateToMap() &&
        ['filtProvincia', 'filtDistrito', 'filtColegio', 'filtMesa'].includes(changedId)) {
      const f = window.VR_FILTER;
      if (f.level !== 'lima' && typeof highlightMapForFilter === 'function') {
        highlightMapForFilter();
      }
    }
  },

  updateFilterModeHint() {
    // Hint eliminado por solicitud del usuario
  },

  setFromMapDistrict(distrito) {
    const prov = PROVINCIAS.find(p => p.distritos.includes(distrito));
    this._skipMapNav = true;
    const provEl = document.getElementById('filtProvincia');
    if (prov && provEl) {
      provEl.value = prov.id;
      this.populateDistritos(prov.id);
    }
    const distEl = document.getElementById('filtDistrito');
    if (distEl) distEl.value = distrito;
    this.populateColegios(distrito);
    this.clearSelect('filtMesa');
    const dep = document.getElementById('filtDepartamento')?.value || 'lima';
    this.updateFilterState(dep, prov?.id || '', distrito, '', '');
    this.updateBreadcrumb();
    this.updateFilterModeHint();
    this.saveToStorage();
    this.notifyChange();
    this._skipMapNav = false;
    highlightMapForFilter();
    showDistrictOverlay(distrito);
  },

  populateDistritos(provinciaId) {
    const sel = document.getElementById('filtDistrito');
    if (!sel) return;
    sel.innerHTML = '<option value="">Todos los distritos</option>';

    let distritos = [];
    if (provinciaId) {
      const p = PROVINCIAS.find(prov => prov.id === provinciaId);
      if (p) distritos = p.distritos;
    } else {
      distritos = LIMA_DISTRITOS;
    }

    distritos.forEach(d => {
      const o = document.createElement('option');
      o.value = d; o.textContent = d;
      sel.appendChild(o);
    });
  },

  populateColegios(distrito) {
    const sel = document.getElementById('filtColegio');
    if (!sel) return;
    sel.innerHTML = '<option value="">Todos los colegios</option>';
    if (!distrito) return;

    const colegios = new Set(COLEGIOS_POR_DISTRITO[distrito] || []);
    Object.values(MESA_DATA).forEach(m => {
      if (m.distrito === distrito && m.colegio) colegios.add(m.colegio);
    });

    [...colegios].sort().forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
  },

  populateMesas(distrito, colegio) {
    const sel = document.getElementById('filtMesa');
    if (!sel) return;
    sel.innerHTML = '<option value="">Todas las mesas</option>';
    if (!distrito) return;

    const matching = Object.values(MESA_DATA).filter(m => {
      return m.distrito === distrito && (!colegio || m.colegio === colegio);
    });

    matching.sort((a, b) => {
      const na = parseInt(a.mesa) || 0;
      const nb = parseInt(b.mesa) || 0;
      return na - nb;
    });

    matching.forEach(m => {
      const o = document.createElement('option');
      o.value = m.mesa;
      o.textContent = `Mesa ${m.mesa}`;
      sel.appendChild(o);
    });
  },

  clearSelect(id) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const firstOpt = sel.options[0];
    sel.innerHTML = '';
    if (firstOpt) sel.appendChild(firstOpt);
    else sel.innerHTML = '<option value="">Todos</option>';
    sel.selectedIndex = 0;
  },

  updateFilterState(dep, prov, dist, col, mesa) {
    if (mesa && col && dist) {
      window.VR_FILTER = { level: 'mesa', departamento: dep, provincia: prov, distrito: dist, colegio: col, mesa: mesa };
    } else if (col && dist) {
      window.VR_FILTER = { level: 'colegio', departamento: dep, provincia: prov, distrito: dist, colegio: col };
    } else if (dist) {
      window.VR_FILTER = { level: 'distrito', departamento: dep, provincia: prov, distrito: dist };
    } else if (prov) {
      window.VR_FILTER = { level: 'provincia', departamento: dep, provincia: prov };
    } else if (dep) {
      window.VR_FILTER = { level: 'lima', departamento: dep };
    } else {
      window.VR_FILTER = { level: 'lima', departamento: 'LIMA' };
    }
  },

  updateBreadcrumb() {
    const el = document.getElementById('filterBreadcrumb');
    if (!el) return;
    const f = window.VR_FILTER;
    const parts = [`<span class="bc-item active">${f.departamento || 'LIMA'}</span>`];
    if (f.provincia) {
      const p = PROVINCIAS.find(prov => prov.id === f.provincia);
      const name = p ? p.name : f.provincia;
      parts.push(`<span class="bc-sep">›</span><span class="bc-item">${name}</span>`);
    }
    if (f.distrito) parts.push(`<span class="bc-sep">›</span><span class="bc-item">${f.distrito}</span>`);
    if (f.colegio) parts.push(`<span class="bc-sep">›</span><span class="bc-item">${f.colegio}</span>`);
    if (f.mesa) parts.push(`<span class="bc-sep">›</span><span class="bc-item">Mesa ${f.mesa}</span>`);
    el.innerHTML = parts.join('');
  },

  reset() {
    const depEl = document.getElementById('filtDepartamento');
    if (depEl) depEl.selectedIndex = 0;

    ['filtProvincia', 'filtDistrito', 'filtColegio', 'filtMesa'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.selectedIndex = 0;
    });

    this.populateDistritos('');
    this.clearSelect('filtColegio');
    this.clearSelect('filtMesa');
    window.VR_FILTER = { level: 'lima', departamento: 'LIMA' };
    this.saveToStorage();
    this.updateBreadcrumb();
    this.updateFilterModeHint();
    this.notifyChange();
  },

  notifyChange() {
    markDashboardDirty();
    if (typeof markAnalyticsDirty === 'function') markAnalyticsDirty();
    markComparisonDirty();

    if (typeof updateKPIs === 'function') updateKPIs();

    const dashView = document.getElementById('view-dashboard');
    if (dashView?.classList.contains('active') && typeof buildDashboard === 'function') {
      buildDashboard();
    }

    const compareView = document.getElementById('view-comparacion');
    if (compareView?.classList.contains('active') && typeof refreshComparison === 'function') {
      refreshComparison();
    }

    const asistView = document.getElementById('view-asistencia');
    const apertView = document.getElementById('view-apertura');
    if ((asistView?.classList.contains('active') || apertView?.classList.contains('active')) && typeof applyAsistenciaFilters === 'function') {
      applyAsistenciaFilters();
    }

    const editorDash = document.getElementById('view-config-edit-dashboard');
    if (editorDash?.classList.contains('active') && typeof buildEditDashboard === 'function') {
      buildEditDashboard();
    }

    const editorDiag = document.getElementById('view-config-edit-diagramas');
    if (editorDiag?.classList.contains('active') && typeof buildEditDiagramas === 'function') {
      buildEditDiagramas();
    }

    const modalActive = document.getElementById('settingsModal')?.style.display === 'flex';
    if (modalActive && typeof _cfgBuildDiagramas === 'function') {
      _cfgBuildDiagramas();
    }

    if (typeof highlightMapForFilter === 'function') {
      highlightMapForFilter();
    }

    ActivityLog.add('Filtro actualizado', window.VR_FILTER.level);
  },

  getLevelLabel() {
    const f = window.VR_FILTER;
    if (f.level === 'provincia' && f.provincia) {
      const p = PROVINCIAS.find(prov => prov.id === f.provincia);
      return p ? p.name : 'Provincia';
    }
    if (f.level === 'distrito' && f.distrito) return f.distrito;
    if (f.level === 'colegio' && f.colegio) return f.colegio;
    if (f.level === 'mesa' && f.mesa) return `Mesa ${f.mesa}`;
    const labels = { lima: 'Lima (todas)', provincia: 'Provincia', distrito: 'Distrito', colegio: 'Colegio', mesa: 'Mesa' };
    return labels[f.level] || 'General';
  }
};

function populateDistritoSelect() { LocationFilters.init(); }
function onProvinciaChange() { LocationFilters.onFilterChange('filtProvincia'); }
function onDistritoChange() { LocationFilters.onFilterChange('filtDistrito'); }
function onColegioChange() { LocationFilters.onFilterChange('filtColegio'); }
function resetMapFilters() { LocationFilters.reset(); }

/* ══════════════════════════════════════════════
   FILTROS CON BUSCADOR — lógica de dropdowns
   ══════════════════════════════════════════════ */

const PARTIDO_CONFIG = {
  '': { label: 'Todos los partidos', color: null },
  'FP': { label: 'FP — Fuerza Popular', color: '#c41e3a' },
  'JP': { label: 'JP — Juntos por el Perú', color: '#e07b39' },
  'SP': { label: 'SP — Somos Perú', color: '#1a8a7d' },
  'FR': { label: 'FR — FREPAP', color: '#2c5282' },
  'VE': { label: 'VE — Partido Verde', color: '#38a169' },
  'MO': { label: 'MO — Partido Morado', color: '#6b46c1' },
};

// Cierra todos los dropdowns abiertos
function closeAllFiltDropdowns(except) {
  ['provincia','distrito','colegio','mesa','partido'].forEach(name => {
    if (name === except) return;
    const fd = document.getElementById('fd-' + name);
    if (fd) fd.classList.remove('open');
  });
}

// Toggle apertura de un dropdown con buscador
function toggleFiltDropdown(name) {
  const fd = document.getElementById('fd-' + name);
  if (!fd) return;
  const isOpen = fd.classList.contains('open');
  closeAllFiltDropdowns(name);
  if (!isOpen) {
    fd.classList.add('open');
    const inp = document.getElementById('fsi-' + name);
    if (inp) { inp.value = ''; filterFiltOptions(name); inp.focus(); }
  } else {
    fd.classList.remove('open');
  }
}

// Filtrar opciones según el texto del input de búsqueda
function filterFiltOptions(name) {
  const inp = document.getElementById('fsi-' + name);
  const list = document.getElementById('fol-' + name);
  if (!inp || !list) return;
  const q = inp.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const items = list.querySelectorAll('li[data-value]');
  let visible = 0;
  items.forEach(li => {
    const txt = (li.dataset.label || li.textContent).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const show = txt.includes(q);
    li.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  // Mostrar/ocultar mensaje "sin resultados"
  let emptyLi = list.querySelector('.filt-empty');
  if (!emptyLi) { emptyLi = document.createElement('li'); emptyLi.className = 'filt-empty'; emptyLi.textContent = 'Sin resultados'; list.appendChild(emptyLi); }
  emptyLi.style.display = visible === 0 ? '' : 'none';
}

// Poblar la lista de opciones de un dropdown
function populateFiltList(name, options, currentValue) {
  const list = document.getElementById('fol-' + name);
  if (!list) return;
  list.innerHTML = '';
  options.forEach(opt => {
    const li = document.createElement('li');
    li.dataset.value = opt.value;
    li.dataset.label = opt.label;
    if (opt.color) {
      const dot = document.createElement('span');
      dot.className = 'filt-partido-dot';
      dot.style.background = opt.color;
      li.appendChild(dot);
    }
    li.appendChild(document.createTextNode(opt.label));
    if (String(opt.value) === String(currentValue)) li.classList.add('selected');
    li.onclick = () => selectFiltOption(name, opt.value, opt.label);
    list.appendChild(li);
  });
  // Vacío placeholder
  const emptyLi = document.createElement('li');
  emptyLi.className = 'filt-empty';
  emptyLi.textContent = 'Sin resultados';
  emptyLi.style.display = 'none';
  list.appendChild(emptyLi);
}

// Seleccionar una opción de un dropdown
function selectFiltOption(name, value, label) {
  // Actualizar texto del toggle
  const textEl = document.getElementById('fst-' + name);
  if (textEl) textEl.textContent = label || value || defaultFiltLabel(name);

  // Sincronizar con el <select> oculto
  const sel = document.getElementById('filt' + name.charAt(0).toUpperCase() + name.slice(1));
  if (sel) {
    // Aseguramos que la opción exista
    let opt = Array.from(sel.options).find(o => String(o.value) === String(value));
    if (!opt) { opt = new Option(label, value); sel.appendChild(opt); }
    sel.value = value;
  }

  // Marcar seleccionado visualmente
  const list = document.getElementById('fol-' + name);
  if (list) list.querySelectorAll('li').forEach(li => {
    li.classList.toggle('selected', String(li.dataset.value) === String(value));
  });

  // Cerrar el dropdown
  const fd = document.getElementById('fd-' + name);
  if (fd) fd.classList.remove('open');

  // Disparar el cambio en el filtro global
  if (name === 'partido') {
    window.VR_FILTER_PARTIDO = value || '';
    LocationFilters.notifyChange();
  } else {
    LocationFilters.onFilterChange('filt' + name.charAt(0).toUpperCase() + name.slice(1));
  }
}

function defaultFiltLabel(name) {
  const map = { provincia:'Todas las provincias', distrito:'Todos los distritos', colegio:'Todos los colegios', mesa:'Todas las mesas', partido:'Todos los partidos' };
  return map[name] || 'Todos';
}

// Sincronizar los dropdowns con búsqueda al popular las opciones originales
const _origPopulateProvincias = LocationFilters.populateProvincias.bind(LocationFilters);
LocationFilters.populateProvincias = function() {
  _origPopulateProvincias();
  const opts = [{ value:'', label:'Todas las provincias', color:null },
    ...PROVINCIAS.map(p => ({ value: p.id, label: p.name, color: null }))];
  const cur = document.getElementById('filtProvincia')?.value || '';
  populateFiltList('provincia', opts, cur);
  const textEl = document.getElementById('fst-provincia');
  if (textEl) {
    const found = opts.find(o => o.value === cur);
    textEl.textContent = found ? found.label : 'Todas las provincias';
  }
};

const _origPopulateDistritos = LocationFilters.populateDistritos.bind(LocationFilters);
LocationFilters.populateDistritos = function(provinciaId) {
  _origPopulateDistritos(provinciaId);
  const sel = document.getElementById('filtDistrito');
  const opts = sel ? Array.from(sel.options).map(o => ({ value: o.value, label: o.textContent, color: null })) : [];
  const cur = sel?.value || '';
  populateFiltList('distrito', opts, cur);
  const textEl = document.getElementById('fst-distrito');
  if (textEl) { const f = opts.find(o => o.value === cur); textEl.textContent = f ? f.label : 'Todos los distritos'; }
};

const _origPopulateColegios = LocationFilters.populateColegios.bind(LocationFilters);
LocationFilters.populateColegios = function(distrito) {
  _origPopulateColegios(distrito);
  const sel = document.getElementById('filtColegio');
  const opts = sel ? Array.from(sel.options).map(o => ({ value: o.value, label: o.textContent, color: null })) : [];
  const cur = sel?.value || '';
  populateFiltList('colegio', opts, cur);
  const textEl = document.getElementById('fst-colegio');
  if (textEl) { const f = opts.find(o => o.value === cur); textEl.textContent = f ? f.label : 'Todos los colegios'; }
};

const _origPopulateMesas = LocationFilters.populateMesas.bind(LocationFilters);
LocationFilters.populateMesas = function(distrito, colegio) {
  _origPopulateMesas(distrito, colegio);
  const sel = document.getElementById('filtMesa');
  const opts = sel ? Array.from(sel.options).map(o => ({ value: o.value, label: o.textContent, color: null })) : [];
  const cur = sel?.value || '';
  populateFiltList('mesa', opts, cur);
  const textEl = document.getElementById('fst-mesa');
  if (textEl) { const f = opts.find(o => o.value === cur); textEl.textContent = f ? f.label : 'Todas las mesas'; }
};

// Inicializar filtro de Partidos
function initPartidoFilter() {
  const opts = Object.entries(PARTIDO_CONFIG).map(([k,v]) => ({ value: k, label: v.label, color: v.color }));
  populateFiltList('partido', opts, window.VR_FILTER_PARTIDO || '');
  const textEl = document.getElementById('fst-partido');
  if (textEl) textEl.textContent = 'Todos los partidos';
}

// Botón Reiniciar — limpia filtros sin recargar
function reiniciarFiltros() {
  LocationFilters.reset();
  window.VR_FILTER_PARTIDO = '';
  // Resetear dropdowns con buscador
  ['provincia','distrito','colegio','mesa'].forEach(name => {
    const textEl = document.getElementById('fst-' + name);
    if (textEl) textEl.textContent = defaultFiltLabel(name);
    const list = document.getElementById('fol-' + name);
    if (list) list.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    const inp = document.getElementById('fsi-' + name);
    if (inp) inp.value = '';
  });
  const partText = document.getElementById('fst-partido');
  if (partText) partText.textContent = 'Todos los partidos';
  const partList = document.getElementById('fol-partido');
  if (partList) partList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
  const firstPart = partList?.querySelector('li[data-value=""]');
  if (firstPart) firstPart.classList.add('selected');

  // Disparar sincronización manual al presionar el botón Reiniciar
  if (typeof syncAsistenciaData === 'function') {
    syncAsistenciaData(null, true);
  }
}

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('.filt-dropdown')) closeAllFiltDropdowns(null);
});

// Inicializar filtro de partidos cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPartidoFilter);
} else {
  setTimeout(initPartidoFilter, 0);
}

// Exponer VR_FILTER_PARTIDO en window
window.VR_FILTER_PARTIDO = '';
