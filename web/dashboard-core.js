// ── DASHBOARD CORE – Fuente única de verdad ──
const CHART_TYPES = {
  bar: { label: 'Barras Verticales', icon: 'bar' },
  hbar: { label: 'Barras Horizontales', icon: 'hbar' },
  stackedBar: { label: 'Barras Apiladas', icon: 'stacked' },
  groupedBar: { label: 'Barras Agrupadas', icon: 'grouped' },
  line: { label: 'Líneas', icon: 'line' },
  area: { label: 'Áreas', icon: 'area' },
  pie: { label: 'Pastel', icon: 'pie' },
  doughnut: { label: 'Dona', icon: 'doughnut' },
  treemap: { label: 'Treemap', icon: 'treemap' },
  heatmap: { label: 'Heatmap', icon: 'heatmap' },
  radar: { label: 'Radar', icon: 'radar' },
  scatter: { label: 'Dispersión', icon: 'scatter' },
  bubble: { label: 'Burbujas', icon: 'bubble' },
  funnel: { label: 'Embudo', icon: 'funnel' },
  gauge: { label: 'Gauge', icon: 'gauge' },
  kpi: { label: 'KPI Cards', icon: 'kpi' },
  sunburst: { label: 'Sunburst', icon: 'sunburst' },
  sankey: { label: 'Sankey', icon: 'sankey' },
  waterfall: { label: 'Waterfall', icon: 'waterfall' },
  combo: { label: 'Combo', icon: 'combo' },
  polarArea: { label: 'Polar', icon: 'polar' },
};

const PBI_STYLES = {
  default: { name: 'Power BI Default', palette: PARTY_COLORS, bg: 'transparent', gridAlpha: 0.06 },
  colorful: { name: 'Colorido', palette: ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#744EC2'], bg: 'transparent', gridAlpha: 0.08 },
  executive: { name: 'Ejecutivo', palette: ['#1B365D', '#2E5984', '#4A7BA7', '#6B9BC3', '#8BB8D9', '#A8D0E6'], bg: 'transparent', gridAlpha: 0.05 },
  dark: { name: 'Oscuro Pro', palette: ['#00BCF2', '#00188F', '#E81123', '#FFB900', '#107C10', '#5C2D91'], bg: 'transparent', gridAlpha: 0.1 },
  onpe: { name: 'Electoral ONPE', palette: PARTY_COLORS, bg: 'transparent', gridAlpha: 0.06 },
};

const DEFAULT_DASHBOARD_WIDGETS = [
  { id: 'w-metro-manual', title: 'Alcaldía Metropolitana (Manual)', subtitle: 'Votos provinciales', type: 'bar', level: 'auto', size: 'large', visible: true, order: 0, colors: null, style: 'default', showLegend: false, showLabels: true, votoTipo: 'provincial', origenFilter: 'MANUAL' },
  { id: 'w-dist-manual', title: 'Alcaldía Distrital (Manual)', subtitle: 'Votos distritales', type: 'bar', level: 'auto', size: 'large', visible: true, order: 1, colors: null, style: 'default', showLegend: false, showLabels: true, votoTipo: 'distrital', origenFilter: 'MANUAL' },
  { id: 'w-metro-ocr', title: 'Alcaldía Metropolitana (OCR)', subtitle: 'Votos provinciales', type: 'bar', level: 'auto', size: 'large', visible: true, order: 2, colors: null, style: 'default', showLegend: false, showLabels: true, votoTipo: 'provincial', origenFilter: 'IMAGEN' },
  { id: 'w-dist-ocr', title: 'Alcaldía Distrital (OCR)', subtitle: 'Votos distritales', type: 'bar', level: 'auto', size: 'large', visible: true, order: 3, colors: null, style: 'default', showLegend: false, showLabels: true, votoTipo: 'distrital', origenFilter: 'IMAGEN' },
  { id: 'w-total-consolidado', title: 'Resultado LimaMetropolitana', subtitle: '', type: 'bar', level: 'auto', size: 'full', visible: true, order: 4, colors: null, style: 'executive', showLegend: false, showLabels: true, votoTipo: 'total_consolidado', origenFilter: '' },
];

const DEFAULT_ANALYTICS_WIDGETS = [
  { id: 'w-linea', title: 'Tendencia Electoral', subtitle: 'Evolución por zona', type: 'line', level: 'auto', size: 'full', visible: true, order: 0, colors: null, style: 'default', showLegend: true, showLabels: false }
];

const DEFAULT_COMPARISON_WIDGETS = [
  { id: 'w-radar', title: 'Perfil Multidimensional', subtitle: 'Análisis comparativo', type: 'radar', level: 'auto', size: 'full', visible: true, order: 0, colors: null, style: 'default', showLegend: true, showLabels: true }
];

const FILTER_META = {
  auto: { icon: '⚡', label: 'Automático' },
  lima: { icon: '🏙️', label: 'Lima' },
  provincia: { icon: '🗺️', label: 'Provincia' },
  distrito: { icon: '📍', label: 'Distrito' },
  colegio: { icon: '🏫', label: 'Colegio' },
  mesa: { icon: '🗳️', label: 'Mesa' },
};

const CHART_ICONS = {
  bar: '📊', hbar: '📶', stackedBar: '📚', groupedBar: '📋', line: '📈', area: '🏔️',
  pie: '🥧', doughnut: '🍩', treemap: '🗂️', heatmap: '🔥', radar: '🎯', scatter: '✨',
  bubble: '🫧', funnel: '🔻', gauge: '⏱️', kpi: '🔢', sunburst: '☀️', sankey: '🔀',
  waterfall: '💧', combo: '🔗', polarArea: '🌀',
};

function getWidgetFilterIcons(w) {
  const icons = [];
  const level = w.level || 'auto';
  icons.push({ icon: FILTER_META[level]?.icon || '⚡', title: `Nivel: ${FILTER_META[level]?.label || level}` });
  icons.push({ icon: CHART_ICONS[w.type] || '📊', title: `Tipo: ${CHART_TYPES[w.type]?.label || w.type}` });
  if (w.style && w.style !== 'default') icons.push({ icon: '🎨', title: `Estilo: ${PBI_STYLES[w.style]?.name || w.style}` });
  if (w.size) icons.push({ icon: w.size === 'full' ? '⬛' : w.size === 'large' ? '▬' : w.size === 'small' ? '▪' : '◾', title: `Tamaño: ${w.size}` });
  if (w.origenFilter) icons.push({ icon: '📥', title: `Registro: ${w.origenFilter}` });
  if (w.showLegend !== false) icons.push({ icon: '📑', title: 'Leyenda activa' });
  if (w.showLabels !== false) icons.push({ icon: '🏷️', title: 'Etiquetas activas' });
  return icons;
}

const DashboardCore = {
  layouts: {
    dashboard: [],
    analytics: [],
    comparison: []
  },
  widgets: [], // Deprecated alias for layouts.dashboard, kept for safety
  chartInstances: {},

  init() {
    this.load();
    this.ensureWidgets();
  },

  load() {
    try {
      const savedDash = localStorage.getItem('vr_dashboard_layout');
      if (savedDash) {
        const parsed = JSON.parse(savedDash);
        const hasLegacy = parsed.some(w => ['w-kpi-main', 'w-total', 'w-dona', 'w-distrito', 'w-gauge'].includes(w.id));
        if (hasLegacy) {
          localStorage.removeItem('vr_dashboard_layout');
        } else {
          this.layouts.dashboard = parsed;
        }
      }
    } catch (_) {}
    try {
      const savedAnaly = localStorage.getItem('vr_analytics_layout');
      if (savedAnaly) {
        this.layouts.analytics = JSON.parse(savedAnaly).filter(w => !['w-heatmap', 'w-stacked', 'w-funnel'].includes(w.id));
      }
    } catch (_) {}
    try {
      const savedComp = localStorage.getItem('vr_comparison_layout');
      if (savedComp) {
        this.layouts.comparison = JSON.parse(savedComp)
          .filter(w => !['w-pie', 'w-treemap', 'w-provincias'].includes(w.id))
          .map(w => w.id === 'w-radar' ? { ...w, size: 'full' } : w);
      }
    } catch (_) {}
    this.widgets = this.layouts.dashboard;
  },

  ensureWidgets() {
    const checkLayout = (layoutKey, defaultList) => {
      if (!this.layouts[layoutKey] || !this.layouts[layoutKey].length) {
        this.layouts[layoutKey] = JSON.parse(JSON.stringify(defaultList));
        return;
      }
      const defaults = JSON.parse(JSON.stringify(defaultList));
      const byId = Object.fromEntries(this.layouts[layoutKey].map(w => [w.id, w]));
      defaults.forEach(def => {
        if (!byId[def.id]) this.layouts[layoutKey].push({ ...def });
        else {
          const w = byId[def.id];
          if (w.visible === undefined) w.visible = true;
          if (w.order === undefined) w.order = def.order;
          if (w.id === 'w-total-consolidado') {
            w.title = 'Resultado LimaMetropolitana';
            w.subtitle = '';
          }
        }
      });
      this.layouts[layoutKey].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    };

    checkLayout('dashboard', DEFAULT_DASHBOARD_WIDGETS);
    checkLayout('analytics', DEFAULT_ANALYTICS_WIDGETS);
    checkLayout('comparison', DEFAULT_COMPARISON_WIDGETS);
    this.widgets = this.layouts.dashboard;
  },

  getChartKey(widget, context) {
    const baseId = widget._baseId || widget.id.replace(/^(an-|cmp-)/, '');
    return `${context || widget._ctx || 'dash'}:${baseId}`;
  },

  save(layoutKey) {
    this.widgets = this.layouts.dashboard;
    if (layoutKey) {
      localStorage.setItem(`vr_${layoutKey}_layout`, JSON.stringify(this.layouts[layoutKey]));
      if (layoutKey === 'dashboard') {
        localStorage.setItem('vr_dashboard_layout', JSON.stringify(this.layouts.dashboard));
      }
      if (typeof saveConfig === 'function') {
        const partial = {};
        partial[`${layoutKey}Layout`] = this.layouts[layoutKey];
        saveConfig(partial);
      }
    } else {
      localStorage.setItem('vr_dashboard_layout', JSON.stringify(this.layouts.dashboard));
      localStorage.setItem('vr_analytics_layout', JSON.stringify(this.layouts.analytics));
      localStorage.setItem('vr_comparison_layout', JSON.stringify(this.layouts.comparison));
      if (typeof saveConfig === 'function') {
        saveConfig({
          dashboardLayout: this.layouts.dashboard,
          analyticsLayout: this.layouts.analytics,
          comparisonLayout: this.layouts.comparison
        });
      }
    }
    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.add('Diagramas guardados', `Layout: ${layoutKey || 'todos'}`);
    }
  },

  reset(layoutKey) {
    if (layoutKey === 'dashboard') {
      this.layouts.dashboard = JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS));
    } else if (layoutKey === 'analytics') {
      this.layouts.analytics = JSON.parse(JSON.stringify(DEFAULT_ANALYTICS_WIDGETS));
    } else if (layoutKey === 'comparison') {
      this.layouts.comparison = JSON.parse(JSON.stringify(DEFAULT_COMPARISON_WIDGETS));
    } else {
      this.layouts.dashboard = JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS));
      this.layouts.analytics = JSON.parse(JSON.stringify(DEFAULT_ANALYTICS_WIDGETS));
      this.layouts.comparison = JSON.parse(JSON.stringify(DEFAULT_COMPARISON_WIDGETS));
    }
    this.widgets = this.layouts.dashboard;
    this.save(layoutKey);
  },

  getVisibleWidgets(layoutKey = 'dashboard') {
    const list = this.layouts[layoutKey] || this.layouts.dashboard;
    return [...list]
      .filter(w => w.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  getWidget(id, layoutKey) {
    if (layoutKey) {
      return (this.layouts[layoutKey] || []).find(w => w.id === id);
    }
    for (const key of Object.keys(this.layouts)) {
      const found = this.layouts[key].find(w => w.id === id);
      if (found) return found;
    }
    return null;
  },

  updateWidget(id, updates, layoutKey) {
    const w = this.getWidget(id, layoutKey);
    if (w) Object.assign(w, updates);
  },

  addWidget(widget, layoutKey) {
    widget.id = widget.id || 'w-' + Date.now();
    const lKey = layoutKey || (typeof _cfgActiveLayout !== 'undefined' ? _cfgActiveLayout : 'dashboard');
    const list = this.layouts[lKey] || this.layouts.dashboard;
    widget.order = list.length;
    widget.visible = widget.visible !== false;
    list.push(widget);
  },

  removeWidget(id, layoutKey) {
    if (layoutKey) {
      this.layouts[layoutKey] = (this.layouts[layoutKey] || []).filter(w => w.id !== id);
    } else {
      Object.keys(this.layouts).forEach(key => {
        this.layouts[key] = this.layouts[key].filter(w => w.id !== id);
      });
    }
    this.widgets = this.layouts.dashboard;
    Object.keys(this.chartInstances).forEach(key => {
      if (key.endsWith(':' + id) || key === id) this.destroyChart(key);
    });
  },

  getSizeClass(size) {
    return { small: 'widget-sm', medium: 'widget-md', large: 'widget-lg', full: 'widget-full' }[size] || 'widget-md';
  },

  destroyChart(key) {
    if (this.chartInstances[key]) {
      if (typeof this.chartInstances[key].destroy === 'function') this.chartInstances[key].destroy();
      delete this.chartInstances[key];
    }
  },

  destroyChartsByContext(context) {
    Object.keys(this.chartInstances).forEach(key => {
      if (key.startsWith(context + ':')) this.destroyChart(key);
    });
  },

  destroyAll() {
    Object.keys(this.chartInstances).forEach(key => this.destroyChart(key));
  },

  resizeAllCharts() {
    Object.values(this.chartInstances).forEach(c => {
      if (c && typeof c.resize === 'function') c.resize();
    });
  }
};

function ensureDistrictData() {
  if (Object.keys(DISTRICT_DATA).length > 0) return;
  LIMA_DISTRITOS.forEach(d => {
    if (!DISTRICT_DATA[d]) {
      DISTRICT_DATA[d] = {
        votos: randomVotos(1),
        mesas: 12,
        mesasEsc: 10,
        colegios: [`I.E. ${d}`],
        provincia: 'Lima Metropolitana',
      };
    }
  });
}
