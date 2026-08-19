// ── EDITOR DE LAYOUT (espejo del Dashboard) ──
let layoutEditorDirty = false;

function markLayoutEditorDirty() {
  layoutEditorDirty = true;
  updateLayoutSaveStatus();
}

function updateLayoutSaveStatus() {
  const el = document.getElementById('editDashSaveStatus');
  if (!el) return;
  el.textContent = layoutEditorDirty ? '● Cambios sin guardar' : '';
  el.className = 'dash-save-status' + (layoutEditorDirty ? ' unsaved' : '');
}

function buildEditDashboard() {
  const view = document.getElementById('view-config-edit-dashboard');
  if (!view?.classList.contains('active')) return;

  ensureDistrictData();
  DashboardCore.init();
  const grid = document.getElementById('editDashboardGrid');
  if (!grid) return;

  DashboardCore.destroyChartsByContext('ed-dash');
  grid.innerHTML = '';

  DashboardCore.getVisibleWidgets().forEach(w =>
    renderDashboardWidget(grid, w, 'layout', 'ed-dash')
  );

  updateKPIsForEditor('editDash');
  updateLayoutSaveStatus();
  requestAnimationFrame(() => DashboardCore.resizeAllCharts());
}

function updateKPIsForEditor(prefix) {
  ensureDistrictData();
  const totals = lideres(getFilterContext());
  const grand = totalVotos(totals);
  const parties = ['FP', 'JP', 'SP', 'FR', 'VE', 'MO'];

  if (prefix === 'editDash') {
    parties.forEach(k => {
      const el = document.getElementById('editKpi' + k);
      if (el) el.textContent = grand > 0 ? ((totals[k] / grand) * 100).toFixed(1) + '%' : '0%';
    });
  }

  const levelEl = document.getElementById(prefix + 'LevelLabel');
  if (levelEl) levelEl.textContent = LocationFilters.getLevelLabel();
}

function saveEditDashboard() {
  reorderDashboardFromDOM(document.getElementById('editDashboardGrid'));
  DashboardCore.save();
  layoutEditorDirty = false;
  updateLayoutSaveStatus();
  markDashboardDirty();
  markAnalyticsDirty();
  markComparisonDirty();
  buildEditDashboard();
  refreshActiveDashboardViews();
  showToast('Dashboard guardado correctamente', 'success');
}

function restoreEditDashboard() {
  if (!confirm('¿Restaurar diseño predeterminado?')) return;
  DashboardCore.reset();
  layoutEditorDirty = false;
  updateLayoutSaveStatus();
  markDashboardDirty();
  buildEditDashboard();
  refreshActiveDashboardViews();
  showToast('Diseño predeterminado restaurado', 'info');
}
