// ── EDITOR DE DIAGRAMAS (configuración de gráficos) ──
let diagramEditorDirty = false;

function markDiagramEditorDirty() {
  diagramEditorDirty = true;
  updateDiagramSaveStatus();
}

function updateDiagramSaveStatus() {
  const el = document.getElementById('editDiagSaveStatus');
  if (!el) return;
  el.textContent = diagramEditorDirty ? '● Cambios sin guardar' : '';
  el.className = 'dash-save-status' + (diagramEditorDirty ? ' unsaved' : '');
}

function buildEditDiagramas() {
  const view = document.getElementById('view-config-edit-diagramas');
  if (!view?.classList.contains('active')) return;

  ensureDistrictData();
  const grid = document.getElementById('editDiagramasGrid');
  if (!grid) return;

  DashboardCore.destroyChartsByContext('ed-diag');
  grid.innerHTML = '';

  DashboardCore.getVisibleWidgets().forEach(w =>
    renderDashboardWidget(grid, w, 'diagram', 'ed-diag')
  );

  updateKPIsForEditor('editDiag');
  updateDiagramSaveStatus();
  requestAnimationFrame(() => DashboardCore.resizeAllCharts());
}

function saveEditDiagramas() {
  reorderDashboardFromDOM(document.getElementById('editDiagramasGrid'));
  DashboardCore.save();
  diagramEditorDirty = false;
  updateDiagramSaveStatus();
  markDashboardDirty();
  markAnalyticsDirty();
  markComparisonDirty();
  buildEditDiagramas();
  refreshActiveDashboardViews();
  showToast('Diagramas guardados correctamente', 'success');
}

// ── UNIFIED WIDGET EDITOR ACTIONS (Shared between Settings Modal and Standalone Editor) ──

window.getActiveEditorContext = function () {
  const configActive = document.getElementById('view-configuracion')?.classList.contains('active');
  
  if (configActive) {
    return {
      layoutKey: typeof _cfgActiveLayout !== 'undefined' ? _cfgActiveLayout : 'dashboard',
      markDirty: () => {
        if (typeof _cfgMarkDiagDirty === 'function') _cfgMarkDiagDirty();
      },
      rebuild: () => {
        if (typeof _cfgBuildDiagramas === 'function') _cfgBuildDiagramas();
      }
    };
  } else {
    return {
      layoutKey: 'dashboard',
      markDirty: () => {
        markDiagramEditorDirty();
      },
      rebuild: () => {
        buildEditDiagramas();
      }
    };
  }
};

window.changeWidgetType = function (id, type) {
  if (!CHART_TYPES[type]) return;
  const context = window.getActiveEditorContext();
  DashboardCore.updateWidget(id, { type }, context.layoutKey);
  context.markDirty();
  context.rebuild();
};

let widgetIdToDelete = null;

window.removeDiagramWidget = function (id) {
  widgetIdToDelete = id;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.style.display = 'flex';
};

window.closeDeleteModal = function () {
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.style.display = 'none';
  widgetIdToDelete = null;
};

window.confirmDeleteWidget = function () {
  if (widgetIdToDelete) {
    const context = window.getActiveEditorContext();
    DashboardCore.removeWidget(widgetIdToDelete, context.layoutKey);
    context.markDirty();
    context.rebuild();
  }
  window.closeDeleteModal();
};

window.cloneWidget = function (id) {
  const context = window.getActiveEditorContext();
  const w = DashboardCore.getWidget(id, context.layoutKey);
  if (!w) return;
  const newId = 'widget_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const cloned = JSON.parse(JSON.stringify(w));
  cloned.id = newId;
  cloned.title = cloned.title + ' (Copia)';
  DashboardCore.addWidget(cloned, context.layoutKey);
  context.markDirty();
  context.rebuild();
  showToast('Diagrama duplicado', 'success');
};

window.changeWidgetScope = function (id, scope) {
  const context = window.getActiveEditorContext();
  DashboardCore.updateWidget(id, { votoTipo: scope }, context.layoutKey);
  context.markDirty();
  context.rebuild();
};

window.changeWidgetSize = function (id, size) {
  const context = window.getActiveEditorContext();
  DashboardCore.updateWidget(id, { size }, context.layoutKey);
  context.markDirty();
  context.rebuild();
};

window.changeWidgetOrigen = function (id, origen) {
  const context = window.getActiveEditorContext();
  DashboardCore.updateWidget(id, { origenFilter: origen }, context.layoutKey);
  context.markDirty();
  context.rebuild();
};

window.editWidgetTitle = function (id) {
  const context = window.getActiveEditorContext();
  const w = DashboardCore.getWidget(id, context.layoutKey);
  if (!w) return;
  const t = prompt('Título:', w.title);
  if (t?.trim()) {
    w.title = t.trim();
    context.markDirty();
    context.rebuild();
  }
};

function restoreEditDiagramas() {
  if (!confirm('¿Restaurar diagramas predeterminados?')) return;
  DashboardCore.reset();
  diagramEditorDirty = false;
  updateDiagramSaveStatus();
  markDashboardDirty();
  buildEditDiagramas();
  refreshActiveDashboardViews();
  showToast('Diagramas restaurados', 'info');
}
