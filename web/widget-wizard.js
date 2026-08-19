// ── ASISTENTE DE DISEÑO DE DIAGRAMAS POWER BI UNIFICADO ──
let pbiWizardData = {
  type: 'bar',
  level: 'auto',
  votoTipo: 'provincial',
  metrics: [],
  title: '',
  size: 'medium'
};

const PBI_CHART_TYPES = [
  { id: 'bar', label: 'Barras Agrupadas', icon: '📊' },
  { id: 'hbar', label: 'Barras Apiladas (H)', icon: '⚖️' },
  { id: 'stackedBar', label: 'Columnas Apiladas', icon: '🥞' },
  { id: 'groupedBar', label: 'Columnas Agrupadas', icon: '📊' },
  { id: 'line', label: 'Gráfico de Líneas', icon: '📈' },
  { id: 'area', label: 'Gráfico de Área', icon: '📐' },
  { id: 'pie', label: 'Gráfico Circular', icon: '🍕' },
  { id: 'doughnut', label: 'Dona', icon: '🍩' },
  { id: 'kpi', label: 'Tarjeta KPI', icon: '🎯' },
  { id: 'treemap', label: 'Treemap Proporcional', icon: '🌲' },
  { id: 'heatmap', label: 'Mapa de Calor', icon: '🔥' },
  { id: 'funnel', label: 'Embudo de Ventas/Votos', icon: '⏳' },
  { id: 'gauge', label: 'Tacómetro / Medidor', icon: '🌡️' },
  { id: 'radar', label: 'Radar Araña', icon: '🕸️' },
  { id: 'sunburst', label: 'Sunburst Radial', icon: '☀️' }
];

function openAddWidget() {
  // Initialize default data
  pbiWizardData = {
    type: 'bar',
    level: 'auto',
    votoTipo: 'provincial',
    metrics: [...PARTY_KEYS], // Select all by default
    title: '',
    size: 'medium'
  };

  // Set default values in DOM inputs
  const levelEl = document.getElementById('pbiFieldLevel');
  if (levelEl) levelEl.value = 'auto';

  const scopeEl = document.getElementById('pbiFieldScope');
  if (scopeEl) scopeEl.value = 'provincial';

  const origenEl = document.getElementById('pbiFieldOrigen');
  if (origenEl) origenEl.value = '';

  const titleEl = document.getElementById('pbiFieldTitle');
  if (titleEl) titleEl.value = '';

  const sizeEl = document.getElementById('pbiFieldSize');
  if (sizeEl) sizeEl.value = 'medium';

  // Render lists
  renderPbiVisualsGrid();
  renderPbiMetricsList();

  const modal = document.getElementById('addWidgetModal');
  if (modal) modal.style.display = 'flex';
}

function renderPbiVisualsGrid() {
  const el = document.getElementById('pbiVisualsGrid');
  if (!el) return;
  el.innerHTML = PBI_CHART_TYPES.map(c => `
    <button type="button" class="pbi-visual-btn ${pbiWizardData.type === c.id ? 'active' : ''}" 
      onclick="selectPbiVisual('${c.id}')" title="${c.label}">
      <span class="pbi-visual-btn-icon">${c.icon}</span>
      <span style="font-size:0.68rem;font-weight:600;text-align:center;line-height:1.1">${c.label}</span>
    </button>
  `).join('');
}

function selectPbiVisual(type) {
  pbiWizardData.type = type;
  renderPbiVisualsGrid();
  suggestPbiTitle();
}

function renderPbiMetricsList() {
  const el = document.getElementById('pbiMetricsList');
  if (!el) return;
  el.innerHTML = PARTY_KEYS.map(k => {
    const isChecked = pbiWizardData.metrics.includes(k);
    const color = PARTIES[k]?.color || '#cbd5e1';
    const labelName = PARTIES[k]?.name || k;
    return `
      <label class="pbi-metric-item">
        <input type="checkbox" value="${k}" ${isChecked ? 'checked' : ''} onchange="togglePbiMetric('${k}')" />
        <span class="legend-dot" style="background:${color};width:8px;height:8px;border-radius:50%;display:inline-block"></span>
        <span>${k} (${labelName})</span>
      </label>
    `;
  }).join('');
}

function togglePbiMetric(k) {
  const idx = pbiWizardData.metrics.indexOf(k);
  if (idx >= 0) {
    pbiWizardData.metrics.splice(idx, 1);
  } else {
    pbiWizardData.metrics.push(k);
  }
  suggestPbiTitle();
}

function pbiSelectAllMetrics(isSelected) {
  pbiWizardData.metrics = isSelected ? [...PARTY_KEYS] : [];
  renderPbiMetricsList();
  suggestPbiTitle();
}

function suggestPbiTitle() {
  const titleEl = document.getElementById('pbiFieldTitle');
  if (!titleEl) return;
  
  // Only suggest if empty or already matches a suggestion
  const currentVal = titleEl.value.trim();
  const levelSelect = document.getElementById('pbiFieldLevel');
  const levelText = levelSelect ? levelSelect.options[levelSelect.selectedIndex].text.replace(/[🗺️📍🏫🗳️⚡]/g, '').trim() : 'General';
  const typeText = PBI_CHART_TYPES.find(c => c.id === pbiWizardData.type)?.label || 'Diagrama';
  
  const autoTitle = `${typeText} - ${levelText}`;
  titleEl.value = autoTitle;
}

// Add event listener to auto-suggest title when level changes
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pbiFieldLevel')?.addEventListener('change', suggestPbiTitle);
});

function confirmPbiWidgetUnified() {
  const titleEl = document.getElementById('pbiFieldTitle');
  const title = titleEl?.value.trim() || 'Nuevo diagrama';
  
  const level = document.getElementById('pbiFieldLevel')?.value || 'auto';
  const size = document.getElementById('pbiFieldSize')?.value || 'medium';
  const votoTipo = document.getElementById('pbiFieldScope')?.value || 'provincial';
  
  const selectedMetrics = pbiWizardData.metrics;
  
  if (selectedMetrics.length === 0) {
    showToast('Seleccione al menos un valor / métrica para el diagrama', 'warning');
    return;
  }

  const origenFilter = document.getElementById('pbiFieldOrigen')?.value || '';

  const widgetConfig = {
    title,
    subtitle: selectedMetrics.map(k => k).join(' · '),
    type: pbiWizardData.type,
    level,
    size,
    style: 'default',
    showLegend: !['kpi', 'treemap'].includes(pbiWizardData.type),
    showLabels: true,
    votoTipo,
    origenFilter,
    dataFields: [...selectedMetrics]
  };

  const configActive = document.getElementById('view-configuracion')?.classList.contains('active');

  if (configActive) {
    // Add to modal config layout context
    DashboardCore.addWidget(widgetConfig, _cfgActiveLayout);
    _cfgMarkDiagDirty();
    _cfgBuildDiagramas();
  } else {
    // Add to standalone dashboard layout
    DashboardCore.addWidget(widgetConfig, 'dashboard');
    if (typeof markDiagramEditorDirty === 'function') markDiagramEditorDirty();
    if (typeof buildEditDiagramas === 'function') buildEditDiagramas();
  }

  closeAddWidget();
  showToast('Diagrama creado (pulse Guardar para persistir los cambios)', 'success');
}

function closeAddWidget() {
  const m = document.getElementById('addWidgetModal');
  if (m) m.style.display = 'none';
}

function closeModalOutside(e) {
  if (e.target.id === 'addWidgetModal') closeAddWidget();
}
