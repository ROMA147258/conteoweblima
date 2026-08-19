// ══════════════════════════════════════════════════════════
//  SETTINGS MODAL – Configuración
//  Tabs: Sincronización | Editar Diagramas
// ══════════════════════════════════════════════════════════

const DEFAULT_SQL_API_URL = '/api/voto-real';

let _cfgDiagDirty = false;
let _cfgCurrentTab = 'sync';
let _cfgActiveLayout = 'dashboard';

// ── OPEN / CLOSE ──────────────────────────────────────────

function openSettingsModal() {
  const urlEl = document.getElementById('cfgSheetUrl');
  if (urlEl) {
    urlEl.value = '/api/voto-real';
  }

  // Restore last-sync timestamp
  const ts = localStorage.getItem('sheet_last_sync');
  const tsEl = document.getElementById('cfgSyncTime');
  if (tsEl) tsEl.textContent = ts || 'Nunca';

  // Restore status if already synced
  if (ts) {
    const st = document.getElementById('cfgSyncStatus');
    if (st) { st.textContent = '✓ Conectado'; st.className = 'status-badge success'; }
  }

  // Switch view to configuracion
  switchView('configuracion');

  // Always start on sync tab; build diag only when visited
  switchCfgTab(_cfgCurrentTab);
}

function closeSettingsModal() {
  switchView('dashboard');
}

// ── TAB SWITCHING ─────────────────────────────────────────

function switchCfgTab(tab) {
  _cfgCurrentTab = tab;

  document.querySelectorAll('.cfg-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.cfg-panel').forEach(p => p.classList.remove('active'));

  const tabEl = document.getElementById('cfgTab-' + tab);
  if (tabEl) tabEl.classList.add('active');

  if (tab === 'sync') {
    const panelEl = document.getElementById('cfgPanel-sync');
    if (panelEl) panelEl.classList.add('active');
  } else {
    const panelEl = document.getElementById('cfgPanel-diag');
    if (panelEl) panelEl.classList.add('active');

    if (tab === 'diag-dash') _cfgActiveLayout = 'dashboard';
    else if (tab === 'diag-analy') _cfgActiveLayout = 'analytics';
    else if (tab === 'diag-comp') _cfgActiveLayout = 'comparison';
    else if (tab === 'diag-asist') _cfgActiveLayout = 'asistencia';

    if (_cfgActiveLayout === 'asistencia') {
      _cfgBuildAsistencia();
    } else {
      _cfgBuildDiagramas();
    }
  }
}

// ══════════════════════════════════════════════════════════
//  SINCRONIZACIÓN TAB (SQL SERVER)
// ══════════════════════════════════════════════════════════

async function cfgSyncNow() {
  const statusEl = document.getElementById('cfgSyncStatus');
  const timeEl   = document.getElementById('cfgSyncTime');

  if (statusEl) { statusEl.textContent = '⏳ Sincronizando…'; statusEl.className = 'status-badge warning'; }

  try {
    const result = await syncFromSqlServer('/api/voto-real');
    const syncedTime = (result && result.syncedAt) ? result.syncedAt : new Date().toLocaleString('es-PE');

    if (statusEl) { statusEl.textContent = '✓ Conectado'; statusEl.className = 'status-badge success'; }
    if (timeEl) timeEl.textContent = syncedTime;

    _cfgRenderDataPreview();
    const mesasCount = (result && result.mesas !== undefined) ? result.mesas : 'Múltiples';
    showToast('¡Base de Datos SQL Server sincronizada exitosamente!', 'success');
    ActivityLog.add('SQL Server sincronizado', `${mesasCount} mesas / coordinadores`);
  } catch (err) {
    if (statusEl) { statusEl.textContent = '✗ Error'; statusEl.className = 'status-badge error'; }
    showToast(err.message || 'Error al conectar con SQL Server', 'error');
  }
}

function _cfgRenderDataPreview() {
  const el = document.getElementById('cfgDataPreview');
  if (!el) return;
  const report = window.VR_SHEET_REPORT;
  if (!report || !report.mesas?.length) {
    el.innerHTML = '<p style="font-size:.78rem;color:var(--text3);margin-top:.5rem">Sin datos sincronizados aún.</p>';
    return;
  }
  const tp = report.totales_provincial || {};
  const td = report.totales_distrital  || {};
  el.innerHTML = `
    <div class="cfg-preview-stats">
      <div class="cfg-pstat"><strong>${report.mesas_escrutadas || report.mesas.length}</strong><span>Mesas</span></div>
      <div class="cfg-pstat"><strong>${((td.total || tp.total || 0)).toLocaleString()}</strong><span>Votos</span></div>
      <div class="cfg-pstat"><strong>FP ${(td.FP || tp.FP || 0).toLocaleString()}</strong><span>Fuerza Popular</span></div>
      <div class="cfg-pstat"><strong>JP ${(td.JP || tp.JP || 0).toLocaleString()}</strong><span>Juntos por el Perú</span></div>
    </div>`;
}

// ══════════════════════════════════════════════════════════
//  EDITAR DIAGRAMAS TAB  (espejo del Dashboard)
// ══════════════════════════════════════════════════════════

function _cfgMarkDiagDirty() {
  _cfgDiagDirty = true;
  const el = document.getElementById('cfgDiagSaveStatus');
  if (el) { el.textContent = '● Cambios sin guardar'; el.className = 'dash-save-status unsaved'; }
}

function _cfgBuildDiagramas() {
  ensureDistrictData();

  const grid = document.getElementById('cfgDiagramasGrid');
  if (!grid) return;

  DashboardCore.destroyChartsByContext('cfg-diag');
  grid.innerHTML = '';

  DashboardCore.getVisibleWidgets(_cfgActiveLayout).forEach(w =>
    renderDashboardWidget(grid, w, 'diagram', 'cfg-diag')
  );

  _cfgUpdateKpiBar();

  const saveStatus = document.getElementById('cfgDiagSaveStatus');
  if (saveStatus && !_cfgDiagDirty) { saveStatus.textContent = ''; saveStatus.className = 'dash-save-status'; }

  requestAnimationFrame(() => DashboardCore.resizeAllCharts());
}

/**
 * Construye el panel de Asistencia dentro del modal de configuración.
 * Muestra los diagramas de Coordinadores y Personeros (espejo de la vista Asistencia).
 */
function _cfgBuildAsistencia() {
  const grid = document.getElementById('cfgDiagramasGrid');
  if (!grid) return;

  // Destruir charts previos del contexto
  DashboardCore.destroyChartsByContext('cfg-diag');
  grid.innerHTML = '';

  // Mostrar barra de KPIs de asistencia
  _cfgUpdateAsistenciaKpiBar();

  const data = window.combinedAsistenciaData || [];
  if (data.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:span 12; padding: 2rem; text-align:center; color:var(--text3); font-size:0.85rem;">
        ⚠️ No hay datos de asistencia sincronizados aún.<br>
        <span style="font-size:0.75rem;">Sincronice datos desde la pestaña <strong>Sincronización</strong> primero.</span>
      </div>`;
    return;
  }

  // Tarjetas con resumen de cada coordinador (espejo del panel de asistencia)
  const coordGroups = {};
  data.filter(i => i.tipo === 'coordinador').forEach(exp => {
    if (!exp.personeroDni) return;
    const key = `${exp.coordinadorNombre}|${exp.local}`;
    if (!coordGroups[key]) {
      coordGroups[key] = { coordinadorNombre: exp.coordinadorNombre, local: exp.local, distrito: exp.distrito, total: 0, confirmados: 0, pendientes: [] };
    }
    coordGroups[key].total++;
    const conf = String(exp.confirmacion || '').toUpperCase();
    if (conf === 'SI' || conf.startsWith('HTTP')) {
      coordGroups[key].confirmados++;
    } else {
      coordGroups[key].pendientes.push(exp.personeroNombre || exp.personeroDni);
    }
  });

  const groups = Object.values(coordGroups);
  const totalCoords = data.filter(i => i.tipo === 'coordinador').length;
  const confirmados = data.filter(i => i.tipo === 'coordinador' && (String(i.confirmacion||'').toUpperCase()==='SI' || String(i.confirmacion||'').toUpperCase().startsWith('HTTP'))).length;
  const pendientes = totalCoords - confirmados;

  // Resumen global
  grid.innerHTML = `
    <div style="grid-column:span 12; background:var(--bg3); border:1px solid var(--border); border-radius:var(--radius); padding:1rem; margin-bottom:0.5rem;">
      <div style="font-size:0.8rem; font-weight:700; color:var(--text); margin-bottom:0.75rem;">📊 Resumen General de Asistencia</div>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem;">
        <div style="text-align:center; background:var(--surface); border-radius:var(--radius-sm); padding:0.65rem; border-left:3px solid var(--accent);">
          <div style="font-size:1.4rem; font-weight:800; color:var(--accent);">${totalCoords}</div>
          <div style="font-size:0.68rem; color:var(--text3); font-weight:600;">TOTAL REGISTROS</div>
        </div>
        <div style="text-align:center; background:var(--surface); border-radius:var(--radius-sm); padding:0.65rem; border-left:3px solid #10b981;">
          <div style="font-size:1.4rem; font-weight:800; color:#10b981;">${confirmados}</div>
          <div style="font-size:0.68rem; color:var(--text3); font-weight:600;">CONFIRMADOS ✅</div>
        </div>
        <div style="text-align:center; background:var(--surface); border-radius:var(--radius-sm); padding:0.65rem; border-left:3px solid #ef4444;">
          <div style="font-size:1.4rem; font-weight:800; color:#ef4444;">${pendientes}</div>
          <div style="font-size:0.68rem; color:var(--text3); font-weight:600;">⏳ PENDIENTES</div>
        </div>
      </div>
      <div style="margin-top:0.75rem; height:6px; background:rgba(239,68,68,0.15); border-radius:3px; overflow:hidden;">
        <div style="height:100%; width:${totalCoords>0?Math.round((confirmados/totalCoords)*100):0}%; background:linear-gradient(90deg,#10b981,#3fb7e2); transition:width 0.5s ease;"></div>
      </div>
      <div style="font-size:0.7rem; color:var(--text3); margin-top:0.3rem; text-align:right;">${totalCoords>0?Math.round((confirmados/totalCoords)*100):0}% completado</div>
    </div>
    ${groups.map(g => {
      const pct = g.total > 0 ? Math.round((g.confirmados/g.total)*100) : 0;
      const statusColor = g.confirmados === g.total ? '#10b981' : (g.pendientes.length > 0 ? '#ef4444' : '#f59e0b');
      return `
        <div style="grid-column:span 4; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:0.75rem; border-top:3px solid ${statusColor};">
          <div style="font-size:0.75rem; font-weight:700; color:var(--text); margin-bottom:0.2rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${g.coordinadorNombre}">${g.coordinadorNombre}</div>
          <div style="font-size:0.65rem; color:var(--text3); margin-bottom:0.5rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${g.local} · ${g.distrito}</div>
          <div style="display:flex; gap:0.4rem; margin-bottom:0.4rem;">
            <span style="flex:1; text-align:center; background:rgba(16,185,129,0.1); border-radius:4px; padding:0.3rem; font-size:0.8rem; font-weight:800; color:#10b981;">${g.confirmados}</span>
            <span style="display:flex;align-items:center;color:var(--text3);font-size:0.8rem;">/ ${g.total}</span>
            <span style="flex:1; text-align:center; background:${g.pendientes.length>0?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.05)'}; border-radius:4px; padding:0.3rem; font-size:0.8rem; font-weight:800; color:${g.pendientes.length>0?'#ef4444':'#10b981'};">${g.pendientes.length}</span>
          </div>
          <div style="height:4px; background:var(--bg3); border-radius:2px; overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:${statusColor}; border-radius:2px;"></div>
          </div>
          ${g.pendientes.length > 0 ? `<div style="margin-top:0.35rem; font-size:0.62rem; color:#ef4444;">⏳ ${g.pendientes.slice(0,2).join(', ')}${g.pendientes.length>2?' +'+( g.pendientes.length-2)+' más':''}</div>` : ''}
        </div>`;
    }).join('')}
  `;

  const saveStatus = document.getElementById('cfgDiagSaveStatus');
  if (saveStatus) { saveStatus.textContent = 'Vista de sólo lectura'; saveStatus.className = 'dash-save-status'; }
}

function _cfgUpdateAsistenciaKpiBar() {
  const kpiEl = document.getElementById('cfgEditorKpis');
  if (!kpiEl) return;
  const data = window.combinedAsistenciaData || [];
  const total = data.filter(i => i.tipo === 'coordinador').length;
  const conf = data.filter(i => i.tipo === 'coordinador' && (String(i.confirmacion||'').toUpperCase()==='SI'||String(i.confirmacion||'').toUpperCase().startsWith('HTTP'))).length;
  const pers = data.filter(i => i.tipo === 'personero').length;
  kpiEl.innerHTML = [
    `<div class="stat-pill" style="border-left:3px solid var(--accent);">Coords <strong>${total}</strong></div>`,
    `<div class="stat-pill" style="border-left:3px solid #10b981;">Confirmados <strong>${conf}</strong></div>`,
    `<div class="stat-pill" style="border-left:3px solid #ef4444;">Pendientes <strong>${total-conf}</strong></div>`,
    `<div class="stat-pill" style="border-left:3px solid #6b46c1;">Personeros <strong>${pers}</strong></div>`,
  ].join('');
}

function _cfgUpdateKpiBar() {
  const kpiEl = document.getElementById('cfgEditorKpis');
  if (!kpiEl) return;
  const totals = lideres(getFilterContext());
  const grand  = totalVotos(totals);
  kpiEl.innerHTML = PARTY_KEYS.map(k => {
    const c = PARTIES[k]?.color || '#cbd5e1';
    const pct = grand > 0 ? (((totals[k] || 0) / grand) * 100).toFixed(1) + '%' : '0%';
    return `<div class="stat-pill party-pill" style="--c:${c}">${k} <strong>${pct}</strong></div>`;
  }).join('');
}

function cfgSaveDiagramas() {
  reorderDashboardFromDOM(document.getElementById('cfgDiagramasGrid'));
  DashboardCore.save(_cfgActiveLayout);
  _cfgDiagDirty = false;
  const el = document.getElementById('cfgDiagSaveStatus');
  if (el) { el.textContent = '✓ Guardado'; el.className = 'dash-save-status saved'; }
  if (typeof markDashboardDirty === 'function') markDashboardDirty();
  if (typeof markAnalyticsDirty === 'function') markAnalyticsDirty();
  if (typeof markComparisonDirty === 'function') markComparisonDirty();
  _cfgBuildDiagramas();
  refreshActiveDashboardViews();
  showToast('Diagramas guardados y Dashboard actualizado', 'success');
}

function cfgRestoreDiagramas() {
  if (!confirm('¿Restaurar todos los diagramas predeterminados de esta sección?')) return;
  DashboardCore.reset(_cfgActiveLayout);
  _cfgDiagDirty = false;
  if (typeof markDashboardDirty === 'function') markDashboardDirty();
  if (typeof markAnalyticsDirty === 'function') markAnalyticsDirty();
  if (typeof markComparisonDirty === 'function') markComparisonDirty();
  _cfgBuildDiagramas();
  refreshActiveDashboardViews();
  showToast('Diagramas restaurados', 'info');
}

// Save widget directly from toolbar save button
function saveWidgetDirectly(id) {
  reorderDashboardFromDOM(document.getElementById('cfgDiagramasGrid'));
  DashboardCore.save(_cfgActiveLayout);
  _cfgDiagDirty = false;
  const el = document.getElementById('cfgDiagSaveStatus');
  if (el) { el.textContent = '✓ Guardado'; el.className = 'dash-save-status saved'; }
  if (typeof markDashboardDirty === 'function') markDashboardDirty();
  if (typeof markAnalyticsDirty === 'function') markAnalyticsDirty();
  if (typeof markComparisonDirty === 'function') markComparisonDirty();
  _cfgBuildDiagramas();
  refreshActiveDashboardViews();
  showToast('Diagrama guardado correctamente', 'success');
}

// Intercept add-widget confirmation so it updates the modal grid too
function cfgOpenAddWidget() {
  window._cfgWidgetPending = true;
  openAddWidget();
}

// End of settings-modal.js
