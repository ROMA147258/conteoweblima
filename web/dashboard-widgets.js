// ── RENDERIZADO COMPARTIDO DE WIDGETS (Dashboard + Editores) ──

function renderWidgetFilterIcons(w) {
  return getWidgetFilterIcons(w).map(f =>
    `<span class="widget-filter-icon" title="${f.title}">${f.icon}</span>`
  ).join('');
}

function renderDashboardWidget(container, w, editMode, renderContext) {
  const ctx = renderContext || (editMode === 'layout' ? 'ed-dash' : editMode === 'diagram' ? 'ed-diag' : 'dash');
  const renderW = { ...w, _baseId: w.id.replace(/^(an-|cmp-)/, ''), _ctx: ctx };

  const div = document.createElement('div');
  div.className = `dash-widget ${DashboardCore.getSizeClass(w.size)} animate-in${editMode ? ' editor-mode dash-draggable' : ''}`;
  div.id = `${ctx}-w-${w.id}`;
  div.dataset.widgetId = w.id;
  if (editMode) div.draggable = false;

  const filterIcons = renderWidgetFilterIcons(w);
  const typeLabel = CHART_TYPES[w.type]?.label || w.type;
  let toolbar = '';

  if (editMode === 'layout') {
    toolbar = `
      <div class="editor-widget-toolbar">
        <div class="ew-drag-handle" title="Arrastrar para mover">⠿</div>
        <div class="widget-filter-icons">${filterIcons}</div>
      </div>`;
  } else if (editMode === 'diagram') {
    const scopeOptions = [
      { v: 'provincial', l: 'Prov' },
      { v: 'distrital', l: 'Dist' }
    ].map(o => `<option value="${o.v}" ${w.votoTipo === o.v ? 'selected' : ''}>${o.l}</option>`).join('');

    const sizeOptions = [
      { v: 'small', l: 'Peq' },
      { v: 'medium', l: 'Med' },
      { v: 'large', l: 'Grd' },
      { v: 'full', l: 'Comp' }
    ].map(o => `<option value="${o.v}" ${w.size === o.v ? 'selected' : ''}>${o.l}</option>`).join('');

    const origenOptions = [
      { v: '', l: 'Todo' },
      { v: 'MANUAL', l: 'Man' },
      { v: 'IMAGEN', l: 'OCR' }
    ].map(o => `<option value="${o.v}" ${w.origenFilter === o.v ? 'selected' : ''}>${o.l}</option>`).join('');

    const popularTypes = [
      { t: 'bar', label: 'Columnas' },
      { t: 'hbar', label: 'Horiz.' },
      { t: 'stackedBar', label: 'Apiladas' },
      { t: 'groupedBar', label: 'Agrupadas' },
      { t: 'line', label: 'Líneas' },
      { t: 'area', label: 'Área' },
      { t: 'pie', label: 'Pastel' },
      { t: 'doughnut', label: 'Dona' },
      { t: 'treemap', label: 'Treemap' },
      { t: 'heatmap', label: 'Heatmap' },
      { t: 'radar', label: 'Radar' },
      { t: 'gauge', label: 'Gauge' },
      { t: 'kpi', label: 'KPI' },
      { t: 'sankey', label: 'Sankey' },
      { t: 'funnel', label: 'Embudo' }
    ];

    const typeIconsHtml = popularTypes.map(p => {
      const activeClass = w.type === p.t ? 'active' : '';
      const emoji = CHART_ICONS[p.t] || '📊';
      return `<button type="button" class="ew-icon-btn ${activeClass}" onclick="changeWidgetType('${w.id}', '${p.t}')" title="${p.label}">${emoji}</button>`;
    }).join('');

    toolbar = `
      <div class="editor-widget-toolbar">
        <div class="ew-drag-handle" title="Arrastrar para mover">⠿</div>
        <div class="ew-chart-icons-list">
          ${typeIconsHtml}
        </div>
        <div class="ew-actions-group">
          <select class="ew-size-select-mini" onchange="changeWidgetScope('${w.id}', this.value)" title="Ámbito">${scopeOptions}</select>
          <select class="ew-size-select-mini" onchange="changeWidgetOrigen('${w.id}', this.value)" title="Registro">${origenOptions}</select>
          <select class="ew-size-select-mini" onchange="changeWidgetSize('${w.id}', this.value)" title="Tamaño">${sizeOptions}</select>
          <button type="button" class="ew-ctrl del" onclick="removeDiagramWidget('${w.id}')" title="Eliminar">🗑️</button>
        </div>
      </div>`;
  } else {
    toolbar = '';
  }

  const bodyId = `${ctx}-body-${w.id}`;
  const chartId = `${ctx}-chart-${w.id}`;
  const customTypes = ['treemap', 'heatmap', 'funnel', 'sunburst', 'sankey'];
  const chartData = ChartEngine.getChartData(renderW);
  const totalVotesFormatted = (chartData.grand || 0).toLocaleString();

  if (w.type === 'kpi') {
    div.classList.add('widget-full');
    div.innerHTML = `${toolbar}<div class="widget-body" id="${bodyId}"></div>`;
    container.appendChild(div);
    ChartEngine.render(null, renderW, document.getElementById(bodyId), ctx);
  } else if (customTypes.includes(w.type)) {
    div.innerHTML = `${toolbar}
      <div class="widget-header">
        <div>
          <div class="widget-title">${w.title}</div>
          <div class="widget-subtitle">${w.subtitle || LocationFilters.getLevelLabel()}</div>
        </div>
        <div class="widget-header-right" style="display:flex; align-items:center; gap:0.5rem;">
          <span class="widget-total-badge" style="font-weight:700; background:rgba(59,130,246,0.15); color:var(--accent,#3b82f6); padding:0.25rem 0.6rem; border-radius:12px; font-size:0.8rem;">Total: ${totalVotesFormatted}</span>
          <span class="widget-badge">${typeLabel}</span>
        </div>
      </div>
      <div class="widget-chart widget-custom" id="${bodyId}"></div>`;
    container.appendChild(div);
    ChartEngine.render(null, renderW, document.getElementById(bodyId), ctx);
  } else {
    div.innerHTML = `${toolbar}
      <div class="widget-header">
        <div>
          <div class="widget-title">${w.title}</div>
          <div class="widget-subtitle">${w.subtitle || LocationFilters.getLevelLabel()}</div>
        </div>
        <div class="widget-header-right" style="display:flex; align-items:center; gap:0.5rem;">
          <span class="widget-total-badge" style="font-weight:700; background:rgba(59,130,246,0.15); color:var(--accent,#3b82f6); padding:0.25rem 0.6rem; border-radius:12px; font-size:0.8rem;">Total: ${totalVotesFormatted}</span>
          <span class="widget-badge">${typeLabel}</span>
        </div>
      </div>
      <div class="widget-chart"><canvas id="${chartId}"></canvas></div>`;
    container.appendChild(div);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ChartEngine.render(chartId, renderW, null, ctx));
    });
  }

  if (editMode) bindEditorDragEvents(div, container, editMode);
}

function bindEditorDragEvents(div, container, editMode) {
  div.draggable = false;
  const handle = div.querySelector('.ew-drag-handle');
  if (handle) {
    handle.addEventListener('mousedown', () => {
      div.draggable = true;
    });
    handle.addEventListener('mouseup', () => {
      div.draggable = false;
    });
  }

  div.addEventListener('dragstart', () => {
    window._dashDragSrc = div;
    div.classList.add('dragging');
  });
  div.addEventListener('dragend', () => {
    div.classList.remove('dragging');
    div.draggable = false;
  });
  div.addEventListener('dragover', e => e.preventDefault());
  div.addEventListener('drop', e => {
    e.preventDefault();
    const src = window._dashDragSrc;
    if (src && src !== div) {
      const kids = [...container.children];
      const si = kids.indexOf(src), di = kids.indexOf(div);
      if (si < di) container.insertBefore(src, div.nextSibling);
      else container.insertBefore(src, div);
      reorderDashboardFromDOM(container);
      const context = (typeof window.getActiveEditorContext === 'function') ? window.getActiveEditorContext() : null;
      if (context) {
        context.markDirty();
      } else {
        if (editMode === 'layout') markLayoutEditorDirty();
        else markDiagramEditorDirty();
      }
    }
  });
}

function reorderDashboardFromDOM(grid) {
  const g = grid || document.getElementById('editDashboardGrid') ||
    document.getElementById('editDiagramasGrid') ||
    document.getElementById('dashboardGrid');
  if (!g) return;
  [...g.children].forEach((el, i) => {
    const wid = el.dataset.widgetId;
    const w = DashboardCore.getWidget(wid);
    if (w) w.order = i;
  });
}

function renderDashboardHeaderKPIs() {
  updateKPIs();
}
