// ── EDITOR DE DIAGRAMAS EN TIEMPO REAL ──
const DiagramEditor = {
  currentWidget: null,
  previewChart: null,

  init() {
    this.renderWidgetList();
    this.bindEvents();
  },

  bindEvents() {
    ['diagramTitle', 'diagramSubtitle', 'diagramType', 'diagramStyle', 'diagramSize', 'diagramLegendPos', 'diagramColors'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const ev = el.type === 'text' ? 'input' : 'change';
        el.addEventListener(ev, () => this.updatePreview());
      }
    });
    ['diagramShowLegend', 'diagramShowLabels'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => this.updatePreview());
    });
  },

  renderWidgetList() {
    const list = document.getElementById('diagramWidgetList');
    if (!list) return;
    DashboardCore.init();

    list.innerHTML = DashboardCore.widgets.map(w => `
      <button class="diagram-list-item ${this.currentWidget?.id === w.id ? 'active' : ''}" onclick="DiagramEditor.selectWidget('${w.id}')">
        <span class="diagram-list-icon">${(CHART_TYPES[w.type]?.label || w.type).substring(0, 2)}</span>
        <div class="diagram-list-info">
          <strong>${w.title}</strong>
          <span>${CHART_TYPES[w.type]?.label || w.type}</span>
        </div>
      </button>`).join('');
  },

  selectWidget(id) {
    this.currentWidget = { ...DashboardCore.getWidget(id) };
    if (!this.currentWidget) return;
    this.populateForm();
    this.renderWidgetList();
    this.updatePreview();
  },

  populateForm() {
    const w = this.currentWidget;
    if (!w) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    setVal('diagramTitle', w.title);
    setVal('diagramSubtitle', w.subtitle || '');
    setVal('diagramType', w.type);
    setVal('diagramStyle', w.style || 'default');
    setVal('diagramSize', w.size || 'medium');
    setVal('diagramLegendPos', w.legendPosition || 'bottom');
    setCheck('diagramShowLegend', w.showLegend !== false);
    setCheck('diagramShowLabels', w.showLabels !== false);
    setVal('diagramColors', (w.colors || []).join(', '));
  },

  updatePreview() {
    if (!this.currentWidget) return;
    const w = this.currentWidget;

    w.title = document.getElementById('diagramTitle')?.value || w.title;
    w.subtitle = document.getElementById('diagramSubtitle')?.value || '';
    w.type = document.getElementById('diagramType')?.value || w.type;
    w.style = document.getElementById('diagramStyle')?.value || 'default';
    w.size = document.getElementById('diagramSize')?.value || 'medium';
    w.legendPosition = document.getElementById('diagramLegendPos')?.value || 'bottom';
    w.showLegend = document.getElementById('diagramShowLegend')?.checked ?? true;
    w.showLabels = document.getElementById('diagramShowLabels')?.checked ?? true;

    const colors = document.getElementById('diagramColors')?.value;
    if (colors?.trim()) {
      w.colors = colors.split(',').map(c => c.trim()).filter(Boolean);
    } else {
      w.colors = null;
    }

    const preview = document.getElementById('diagramPreview');
    if (!preview) return;

    if (this.previewChart) { this.previewChart.destroy?.(); this.previewChart = null; }

    preview.innerHTML = w.type === 'kpi' || ['treemap','heatmap','funnel','sunburst','sankey'].includes(w.type)
      ? `<div id="diagramPreviewBody" class="widget-chart" style="height:280px"></div>`
      : `<div class="widget-chart" style="height:280px"><canvas id="diagramPreviewCanvas"></canvas></div>`;

    requestAnimationFrame(() => {
      if (w.type === 'kpi' || ['treemap','heatmap','funnel','sunburst','sankey'].includes(w.type)) {
        ChartEngine.render(null, w, document.getElementById('diagramPreviewBody'));
      } else {
        ChartEngine.render('diagramPreviewCanvas', w);
        this.previewChart = DashboardCore.chartInstances[w.id];
      }
    });
  },

  save() {
    if (!this.currentWidget) { showToast('Seleccione un diagrama primero', 'warning'); return; }
    DashboardCore.updateWidget(this.currentWidget.id, this.currentWidget);
    DashboardCore.save();
    this.renderWidgetList();
    if (typeof buildDashboard === 'function') buildDashboard();
    if (typeof updateDashSaveIndicator === 'function') updateDashSaveIndicator(true);
    showToast('Diagrama guardado exitosamente', 'success');
    ActivityLog.add('Diagrama configurado', this.currentWidget.title);
  },

  restore() {
    if (!this.currentWidget) return;
    const def = DEFAULT_WIDGETS.find(w => w.id === this.currentWidget.id);
    if (def) {
      this.currentWidget = { ...def };
      this.populateForm();
      this.updatePreview();
      showToast('Diseño del diagrama restaurado', 'info');
    } else {
      showToast('No hay diseño por defecto para este widget', 'warning');
    }
  }
};

function initDiagramEditor() { DiagramEditor.init(); }
