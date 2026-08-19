// ── VISTA SINCRONIZACIÓN (SQL Server BD: conteo) ──

function loadSheetConfigUI() {
  const urlEl = document.getElementById('configSheetUrl');
  if (urlEl) urlEl.value = '/api/voto-real';
  const lastSync = localStorage.getItem('sheet_last_sync');
  const syncEl = document.getElementById('configSheetLastSync');
  if (syncEl && lastSync) syncEl.textContent = lastSync;
  renderSheetDataPreview();
}

function renderSheetDataPreview() {
  const el = document.getElementById('sheetDataPreview');
  if (!el) return;
  const report = window.VR_SHEET_REPORT;
  if (!report || !report.mesas?.length) {
    el.innerHTML = '<p class="empty-state" style="padding:1rem;font-size:0.82rem">Sin datos sincronizados desde la Base de Datos SQL Server.</p>';
    return;
  }
  const tp = report.totales_provincial || {};
  const td = report.totales_distrital || {};
  const rows = report.mesas.slice(0, 8).map(m => `
    <tr>
      <td>${m.ubicacion || '—'}</td>
      <td>Mesa ${m.mesa}</td>
      <td>${m.brigadista || '—'}</td>
      <td>${(m.votos_distrital?.total || m.votos_provincial?.total || 0).toLocaleString()} votos</td>
    </tr>`).join('');
  el.innerHTML = `
    <div class="sheet-preview-summary">
      <div class="sheet-stat"><strong>${report.mesas_escrutadas || report.mesas.length}</strong><span>Mesas</span></div>
      <div class="sheet-stat"><strong>${(td.total || tp.total || 0).toLocaleString()}</strong><span>Votos totales</span></div>
      <div class="sheet-stat"><strong>FP ${(td.FP || tp.FP || 0).toLocaleString()}</strong><span>Fuerza Popular</span></div>
      <div class="sheet-stat"><strong>JP ${(td.JP || tp.JP || 0).toLocaleString()}</strong><span>Juntos por el Perú</span></div>
    </div>
    <table class="sheet-preview-table">
      <thead><tr><th>Distrito</th><th>Mesa</th><th>Brigadista</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${report.mesas.length > 8 ? `<p style="font-size:0.72rem;color:var(--text3);margin-top:0.5rem">+ ${report.mesas.length - 8} mesas más...</p>` : ''}`;
}

async function syncConfigSheet() {
  const status = document.getElementById('configSheetStatus');
  if (status) { status.textContent = '⏳ Sincronizando...'; status.className = 'status-badge warning'; }
  try {
    const result = await syncFromGoogleSheet('/api/voto-real');
    if (status) { status.textContent = '✓ Conectado'; status.className = 'status-badge success'; }
    const syncEl = document.getElementById('configSheetLastSync');
    if (syncEl) syncEl.textContent = result.syncedAt;
    renderSheetDataPreview();
    showToast(`${result.mesas} mesas cargadas desde SQL Server`, 'success');
    ActivityLog.add('SQL Server sincronizado', `${result.mesas} mesas`);
  } catch (err) {
    if (status) { status.textContent = '✗ Error'; status.className = 'status-badge error'; }
    showToast(err.message || 'Error al conectar con SQL Server', 'error');
  }
}
