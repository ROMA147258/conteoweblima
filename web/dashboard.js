// ── DASHBOARD PRINCIPAL (solo visualización) ──
let dashboardDirty = true;
let analyticsDirty = true;
let comparisonDirty = true;

function isViewChartId(id) {
  return VIEW_CHART_PREFIXES.some(p => id.startsWith(p));
}

function destroyDashboardCharts() {
  DashboardCore.destroyChartsByContext('dash');
}

function destroyPrefixedCharts(prefix) {
  const ctx = prefix.replace('-', '');
  DashboardCore.destroyChartsByContext(ctx);
}

function markDashboardDirty() { dashboardDirty = true; }
function markAnalyticsDirty() { analyticsDirty = true; }
function markComparisonDirty() { comparisonDirty = true; }

function buildDashboard() {
  const view = document.getElementById('view-dashboard');
  if (!view?.classList.contains('active')) {
    dashboardDirty = true;
    return;
  }
  dashboardDirty = false;

  ensureDistrictData();
  DashboardCore.init();
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;

  destroyDashboardCharts();
  grid.innerHTML = '';

  const widgets = DashboardCore.getVisibleWidgets();
  if (!widgets.length) {
    grid.innerHTML = '<p class="empty-state">No hay diagramas configurados. Use Configuración → Editar Dashboard.</p>';
    updateKPIs();
    return;
  }

  widgets.forEach(w => renderDashboardWidget(grid, w, false, 'dash'));

  updateKPIs();
  updateLiveIndicators();
  updateDashFilterHint();

  requestAnimationFrame(() => DashboardCore.resizeAllCharts());
}

function renderViewCharts(gridId, prefix) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const ctx = prefix.replace('-', '');
  destroyPrefixedCharts(prefix);
  grid.innerHTML = '';
  const layoutKey = prefix === 'an-' ? 'analytics' : prefix === 'cmp-' ? 'comparison' : 'dashboard';
  DashboardCore.getVisibleWidgets(layoutKey).forEach(w => {
    const pw = { ...w, id: prefix + w.id };
    renderDashboardWidget(grid, pw, false, ctx);
  });
}

function updateDashFilterHint() {
  const el = document.getElementById('dashFilterHint');
  if (el) el.textContent = `Mostrando datos de: ${LocationFilters.getLevelLabel()}`;
  const dashLevel = document.getElementById('dashLevelLabel');
  if (dashLevel) dashLevel.textContent = LocationFilters.getLevelLabel();
}

function updateKPIs() {
  ensureDistrictData();
  const totals = lideres(getFilterContext());
  const grand = totalVotos(totals);
  const map = { FP: 'kpiFP', JP: 'kpiJP', SP: 'kpiSP', FR: 'kpiFR', VE: 'kpiVE', MO: 'kpiMO' };
  Object.entries(map).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (totals[k] || 0).toLocaleString();
  });

  const statVotos = document.getElementById('statVotos');
  if (statVotos) statVotos.textContent = grand.toLocaleString();

  const stats = typeof ChartEngine !== 'undefined' ? ChartEngine.getMesaStats({}) : { totalMesas: 1, escMesas: 0 };
  const totalMesas = stats.totalMesas || 1;
  const escMesas = stats.escMesas || 0;
  const statMesas = document.getElementById('statMesasEsc');
  if (statMesas) statMesas.textContent = totalMesas > 0 ? ((escMesas / totalMesas) * 100).toFixed(0) + '%' : '0%';

  updateDashFilterHint();
}

function updateLiveIndicators() {
  const now = new Date();
  const timeEl = document.getElementById('liveTime');
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

setInterval(updateLiveIndicators, 1000);

function refreshActiveDashboardViews() {
  const dash = document.getElementById('view-dashboard');
  if (dash?.classList.contains('active')) buildDashboard();
  const editDash = document.getElementById('view-config-edit-dashboard');
  if (editDash?.classList.contains('active') && typeof buildEditDashboard === 'function') buildEditDashboard();
  const editDiag = document.getElementById('view-config-edit-diagramas');
  if (editDiag?.classList.contains('active') && typeof buildEditDiagramas === 'function') buildEditDiagramas();
  const analytics = document.getElementById('view-analytics');
  if (analytics?.classList.contains('active') && typeof refreshAnalytics === 'function') refreshAnalytics();
  const comparison = document.getElementById('view-comparacion');
  if (comparison?.classList.contains('active') && typeof refreshComparison === 'function') refreshComparison();
}
