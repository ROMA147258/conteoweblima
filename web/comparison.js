// ── PANEL DE COMPARACIÓN (Filtros Duales Independientes) ──
const Comparison = {
  filterA: {
    level: 'distrito',
    location: '',
    votoTipo: 'todos',
    origenFilter: ''
  },
  filterB: {
    level: 'distrito',
    location: '',
    votoTipo: 'todos',
    origenFilter: ''
  },
  compareChartInstance: null,

  init() {
    this.syncWithGlobalFilter();
    this.updateControlsFromState();
    this.renderComparison();
  },

  syncWithGlobalFilter() {
    const f = getFilterContext();
    if (f.level === 'mesa') {
      this.filterA.level = 'mesa';
      this.filterA.location = f.mesa || '';
      this.filterB.level = 'mesa';
    } else if (f.level === 'colegio') {
      this.filterA.level = 'colegio';
      this.filterA.location = f.colegio || '';
      this.filterB.level = 'colegio';
    } else if (f.level === 'distrito') {
      this.filterA.level = 'distrito';
      this.filterA.location = f.distrito || 'Ate';
      this.filterB.level = 'distrito';
      this.filterB.location = (f.distrito === 'San Juan de Lurigancho') ? 'Ate' : 'San Juan de Lurigancho';
    } else if (f.level === 'provincia') {
      this.filterA.level = 'provincia';
      this.filterA.location = f.provincia || 'Lima Metropolitana';
      this.filterB.level = 'provincia';
      this.filterB.location = 'Barranca';
    } else {
      this.filterA.level = 'distrito';
      this.filterA.location = 'Ate';
      this.filterB.level = 'distrito';
      this.filterB.location = 'San Juan de Lurigancho';
    }
  },

  applyPreset(presetName) {
    const f = getFilterContext();
    if (presetName === 'distritos') {
      this.filterA = { level: 'distrito', location: 'Ate', votoTipo: 'todos', origenFilter: '' };
      this.filterB = { level: 'distrito', location: 'San Juan de Lurigancho', votoTipo: 'todos', origenFilter: '' };
    } else if (presetName === 'colegios') {
      const dist = f.distrito || 'Ate';
      const cols = COLEGIOS_POR_DISTRITO[dist] || COLEGIOS_REALES[dist] || [];
      this.filterA = { level: 'colegio', location: cols[0] || '', votoTipo: 'todos', origenFilter: '' };
      this.filterB = { level: 'colegio', location: cols[1] || cols[0] || '', votoTipo: 'todos', origenFilter: '' };
    } else if (presetName === 'manualVsOcr') {
      const loc = f.distrito || f.colegio || 'Ate';
      const lev = f.level === 'colegio' ? 'colegio' : (f.level === 'provincia' ? 'provincia' : 'distrito');
      this.filterA = { level: lev, location: loc, votoTipo: 'todos', origenFilter: 'MANUAL' };
      this.filterB = { level: lev, location: loc, votoTipo: 'todos', origenFilter: 'IMAGEN' };
    } else if (presetName === 'provVsDist') {
      const loc = f.distrito || f.provincia || 'Ate';
      const lev = f.level === 'provincia' ? 'provincia' : 'distrito';
      this.filterA = { level: lev, location: loc, votoTipo: 'provincial', origenFilter: '' };
      this.filterB = { level: lev, location: loc, votoTipo: 'distrital', origenFilter: '' };
    }
    this.updateControlsFromState();
    this.renderComparison();
  },

  updateControlsFromState() {
    ['A', 'B'].forEach(side => {
      const f = side === 'A' ? this.filterA : this.filterB;
      const levelEl = document.getElementById('cmpLevel' + side);
      if (levelEl) levelEl.value = f.level;
      this.populateLocationSelect(side);
      const locEl = document.getElementById('cmpLocation' + side);
      if (locEl && f.location) locEl.value = f.location;
      const scopeEl = document.getElementById('cmpScope' + side);
      if (scopeEl) scopeEl.value = f.votoTipo || 'todos';
      const origEl = document.getElementById('cmpOrigen' + side);
      if (origEl) origEl.value = f.origenFilter || '';
    });
  },

  populateLocationSelect(side) {
    const f = side === 'A' ? this.filterA : this.filterB;
    const sel = document.getElementById('cmpLocation' + side);
    if (!sel) return;
    sel.innerHTML = '';

    if (f.level === 'lima') {
      sel.innerHTML = '<option value="LIMA">Lima (Toda la región)</option>';
      f.location = 'LIMA';
      return;
    }

    let opts = [];
    if (f.level === 'provincia') {
      opts = PROVINCIAS.map(p => ({ value: p.name, label: p.name }));
    } else if (f.level === 'distrito') {
      opts = LIMA_DISTRITOS.map(d => ({ value: d, label: d }));
    } else if (f.level === 'colegio') {
      const globalDist = getFilterContext().distrito;
      const setCols = new Set();
      Object.values(COLEGIOS_POR_DISTRITO).flat().forEach(c => setCols.add(c));
      Object.values(MESA_DATA).forEach(m => {
        if ((!globalDist || m.distrito === globalDist) && m.colegio) setCols.add(m.colegio);
      });
      opts = [...setCols].sort().map(c => ({ value: c, label: c }));
    } else if (f.level === 'mesa') {
      const globalDist = getFilterContext().distrito;
      const mesas = Object.values(MESA_DATA).filter(m => !globalDist || m.distrito === globalDist);
      opts = mesas.slice(0, 80).map(m => ({ value: m.mesa, label: `${m.distrito} · Mesa ${m.mesa}` }));
    }

    if (!opts.length) {
      sel.innerHTML = '<option value="">Sin opciones</option>';
      return;
    }

    opts.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      sel.appendChild(opt);
    });

    if (!f.location || !opts.some(o => o.value === f.location)) {
      f.location = opts[0]?.value || '';
    }
    sel.value = f.location;
  },

  onLevelChange(side, level) {
    const f = side === 'A' ? this.filterA : this.filterB;
    f.level = level;
    f.location = '';
    this.populateLocationSelect(side);
    this.renderComparison();
  },

  onLocationChange(side, val) {
    const f = side === 'A' ? this.filterA : this.filterB;
    f.location = val;
    this.renderComparison();
  },

  onScopeChange(side, scope) {
    const f = side === 'A' ? this.filterA : this.filterB;
    f.votoTipo = scope;
    this.renderComparison();
  },

  onOrigenChange(side, origen) {
    const f = side === 'A' ? this.filterA : this.filterB;
    f.origenFilter = origen;
    this.renderComparison();
  },

  getVotosForSideFilter(sf) {
    const filterObj = { level: sf.level };
    if (sf.level === 'provincia') {
      const p = PROVINCIAS.find(prov => prov.name === sf.location);
      filterObj.provincia = p ? p.id : '';
    } else if (sf.level === 'distrito') {
      filterObj.distrito = sf.location;
    } else if (sf.level === 'colegio') {
      filterObj.colegio = sf.location;
      const foundMesa = Object.values(MESA_DATA).find(m => m.colegio === sf.location);
      if (foundMesa) filterObj.distrito = foundMesa.distrito;
    } else if (sf.level === 'mesa') {
      filterObj.mesa = sf.location;
      const foundMesa = Object.values(MESA_DATA).find(m => String(m.mesa) === String(sf.location));
      if (foundMesa) {
        filterObj.distrito = foundMesa.distrito;
        filterObj.colegio = foundMesa.colegio;
      }
    }

    return lideres(filterObj, sf.votoTipo, sf.origenFilter);
  },

  getSideLabel(sf, defaultName) {
    const parts = [];
    parts.push(sf.location || defaultName);
    if (sf.votoTipo && sf.votoTipo !== 'todos') {
      parts.push(sf.votoTipo === 'provincial' ? 'Provincial' : 'Distrital');
    }
    if (sf.origenFilter) {
      parts.push(sf.origenFilter === 'MANUAL' ? 'Manual' : 'OCR');
    }
    return parts.join(' · ');
  },

  renderComparison() {
    const el = document.getElementById('compareResults');
    if (!el) return;
    comparisonDirty = false;

    // Actualizar títulos de las tarjetas de filtro
    const labelA = this.getSideLabel(this.filterA, 'Lado A');
    const labelB = this.getSideLabel(this.filterB, 'Lado B');
    const titleA = document.getElementById('compareTitleA');
    if (titleA) titleA.textContent = labelA;
    const titleB = document.getElementById('compareTitleB');
    if (titleB) titleB.textContent = labelB;

    if (this.compareChartInstance) {
      this.compareChartInstance.destroy();
      this.compareChartInstance = null;
    }

    const votosA = this.getVotosForSideFilter(this.filterA);
    const votosB = this.getVotosForSideFilter(this.filterB);

    const totalA = totalVotos(votosA);
    const totalB = totalVotos(votosB);
    const diff = Math.abs(totalA - totalB);
    const pctDiff = Math.max(totalA, totalB) > 0 ? ((diff / Math.max(totalA, totalB)) * 100).toFixed(1) : '0.0';
    const leaderA = getLeader(votosA);
    const leaderB = getLeader(votosB);

    el.innerHTML = `
      <div class="compare-summary-cards">
        <div class="cmp-summary-card card-a">
          <span class="cmp-sum-tag tag-a">LADO A</span>
          <h4 class="cmp-sum-title">${labelA}</h4>
          <div class="cmp-sum-val">${totalA.toLocaleString()} <small>votos</small></div>
          <div class="cmp-sum-leader">🏆 Líder: <strong>${PARTIES[leaderA]?.label || leaderA}</strong> (${getPct(votosA, leaderA)}%)</div>
        </div>

        <div class="cmp-summary-card card-diff">
          <span class="cmp-sum-tag diff">DIFERENCIA</span>
          <h4 class="cmp-sum-title">Brecha Absoluta</h4>
          <div class="cmp-sum-val highlight">${diff.toLocaleString()} <small>votos</small></div>
          <div class="cmp-sum-leader">Variación: <strong>${pctDiff}%</strong></div>
        </div>

        <div class="cmp-summary-card card-b">
          <span class="cmp-sum-tag tag-b">LADO B</span>
          <h4 class="cmp-sum-title">${labelB}</h4>
          <div class="cmp-sum-val">${totalB.toLocaleString()} <small>votos</small></div>
          <div class="cmp-sum-leader">🏆 Líder: <strong>${PARTIES[leaderB]?.label || leaderB}</strong> (${getPct(votosB, leaderB)}%)</div>
        </div>
      </div>

      <div class="compare-chart-wrap">
        <canvas id="compareChart"></canvas>
      </div>

      <div class="compare-table-wrap">
        <table class="compare-table-pro">
          <thead>
            <tr>
              <th>Partido</th>
              <th>${labelA} (A)</th>
              <th>${labelB} (B)</th>
              <th>Diferencia (A - B)</th>
              <th>Comparativa Visual</th>
            </tr>
          </thead>
          <tbody>
            ${PARTY_KEYS.map(k => {
              const valA = votosA[k] || 0;
              const valB = votosB[k] || 0;
              const dVal = valA - valB;
              const maxVal = Math.max(valA, valB, 1);
              const pctBarA = ((valA / maxVal) * 100).toFixed(1);
              const pctBarB = ((valB / maxVal) * 100).toFixed(1);
              const color = PARTIES[k]?.color || '#94a3b8';
              return `
                <tr>
                  <td>
                    <span class="cmp-party-dot" style="background:${color}"></span>
                    <strong>${PARTIES[k]?.label || k}</strong>
                  </td>
                  <td><strong style="color:var(--accent,#3b82f6)">${valA.toLocaleString()}</strong></td>
                  <td><strong style="color:#8b5cf6">${valB.toLocaleString()}</strong></td>
                  <td class="${dVal >= 0 ? 'diff-pos' : 'diff-neg'}">${dVal > 0 ? '+' : ''}${dVal.toLocaleString()}</td>
                  <td class="cmp-bar-td">
                    <div class="cmp-dual-bar">
                      <div class="cmp-bar-a" style="width:${pctBarA}%; background:var(--accent,#3b82f6)" title="A: ${valA.toLocaleString()}"></div>
                      <div class="cmp-bar-b" style="width:${pctBarB}%; background:#8b5cf6" title="B: ${valB.toLocaleString()}"></div>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    requestAnimationFrame(() => this.renderCompareChart(labelA, votosA, labelB, votosB));
  },

  renderCompareChart(labelA, votosA, labelB, votosB) {
    const canvas = document.getElementById('compareChart');
    if (!canvas) return;
    const theme = ChartEngine.getThemeColors();

    this.compareChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: PARTY_KEYS.map(k => PARTIES[k]?.label || k),
        datasets: [
          {
            label: labelA + ' (Lado A)',
            data: PARTY_KEYS.map(k => votosA[k] || 0),
            backgroundColor: '#3b82f6',
            borderRadius: 4
          },
          {
            label: labelB + ' (Lado B)',
            data: PARTY_KEYS.map(k => votosB[k] || 0),
            backgroundColor: '#8b5cf6',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: theme.text, font: { family: 'Segoe UI, Inter, sans-serif', size: 11 } }
          }
        },
        scales: {
          x: { ticks: { color: theme.text, font: { size: 10 } }, grid: { color: theme.grid } },
          y: { ticks: { color: theme.text }, grid: { color: theme.grid } }
        }
      }
    });
  }
};

function refreshComparison() {
  if (typeof Comparison !== 'undefined') {
    Comparison.updateControlsFromState();
    Comparison.renderComparison();
  }
}
