// ── MOTOR DE GRÁFICOS UNIFICADO ──
const ChartEngine = {
  getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      isDark,
      text: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.1)',
      bg: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '#334155' : '#ffffff',
    };
  },

  getPalette(widget) {
    const style = PBI_STYLES[widget.style] || PBI_STYLES.default;
    return widget.colors || style.palette;
  },

  getDistrictVotes(d, widget) {
    const totals = getZeroVotesObj();
    const votoTipo = widget?.votoTipo || 'provincial';
    const keyType = votoTipo === 'distrital' ? 'votos_distrital' : (votoTipo === 'provincial' ? 'votos_provincial' : 'votos');
    
    Object.values(MESA_DATA).forEach(m => {
      if (m.distrito !== d) return;
      if (widget?.origenFilter) {
        if (widget.origenFilter === 'MANUAL') {
          if (m.origen !== 'MANUAL') return;
        } else if (widget.origenFilter === 'IMAGEN') {
          if (m.origen !== 'IMAGEN' && m.origen !== 'OCR') return;
        }
      }
      const v = m[keyType] || m.votos || {};
      PARTY_KEYS.forEach(k => {
        totals[k] += (v[k] || 0);
      });
    });
    return totals;
  },

  getChartData(widget) {
    ensureDistrictData();
    const filter = getFilterContext();
    const totals = lideres(filter, widget?.votoTipo, widget?.origenFilter);
    const f = filter;
    const fields = widget?.dataFields || [];

    let distritos = LIMA_DISTRITOS.slice(0, 10);
    let provinciaLabels = null;
    let mesaData = null;

    if (f.level === 'provincia' && f.provincia) {
      const prov = PROVINCIAS.find(p => p.id === f.provincia);
      distritos = prov ? prov.distritos.slice(0, 10) : distritos;
    } else if (f.level === 'distrito' && f.distrito) {
      distritos = [f.distrito];
    } else if ((f.level === 'colegio' || f.level === 'mesa') && f.distrito) {
      const mesas = Object.values(MESA_DATA).filter(m =>
        m.distrito === f.distrito && (!f.colegio || m.colegio === f.colegio) &&
        (!f.mesa || String(m.mesa) === String(f.mesa))
      ).slice(0, 10);
      if (mesas.length > 1 && (fields.includes('mesas') || fields.length === 0 || f.level === 'colegio')) {
        distritos = mesas.map(m => `Mesa ${m.mesa}`);
        mesaData = mesas;
      } else {
        distritos = [f.distrito];
      }
    }

    if (f.level === 'lima' && (fields.includes('provincias') || (widget?.type === 'groupedBar' && widget?.level === 'provincia'))) {
      provinciaLabels = PROVINCIAS.map(p => p.name);
    }

    return {
      totals,
      distritos,
      provinciaLabels,
      mesaData,
      filter: f,
      grand: totalVotos(totals),
    };
  },

  getProvinciaVoteData(widget) {
    const votoTipo = widget?.votoTipo || 'provincial';
    const keyType = votoTipo === 'distrital' ? 'votos_distrital' : (votoTipo === 'provincial' ? 'votos_provincial' : 'votos');
    
    return PROVINCIAS.map(p => {
      const totals = getZeroVotesObj();
      Object.values(MESA_DATA).forEach(m => {
        const d = DISTRICT_DATA[m.distrito];
        const provName = d ? d.provincia : '';
        if (provName !== p.name) return;
        
        if (widget?.origenFilter) {
          if (widget.origenFilter === 'MANUAL') {
            if (m.origen !== 'MANUAL') return;
          } else if (widget.origenFilter === 'IMAGEN') {
            if (m.origen !== 'IMAGEN' && m.origen !== 'OCR') return;
          }
        }
        
        const v = m[keyType] || m.votos || {};
        PARTY_KEYS.forEach(k => {
          totals[k] += (v[k] || 0);
        });
      });
      return { name: p.name, votos: totals, total: totalVotos(totals) };
    });
  },

  getMesaVotes(m, widget) {
    if (widget?.origenFilter) {
      if (widget.origenFilter === 'MANUAL') {
        if (m.origen !== 'MANUAL') return getZeroVotesObj();
      } else if (widget.origenFilter === 'IMAGEN') {
        if (m.origen !== 'IMAGEN' && m.origen !== 'OCR') return getZeroVotesObj();
      }
    }
    const votoTipo = widget?.votoTipo || 'provincial';
    return votoTipo === 'distrital' ? (m.votos_distrital || m.votos) : (m.votos_provincial || m.votos);
  },

  getMesaStats(widget) {
    const uniqueMesas = new Set();
    const uniqueEscMesas = new Set();
    const filter = getFilterContext();
    const isFiltered = (filter?.level !== 'lima');
    
    Object.values(MESA_DATA).forEach(m => {
      if (widget?.origenFilter) {
        if (widget.origenFilter === 'MANUAL') {
          if (m.origen !== 'MANUAL') return;
        } else if (widget.origenFilter === 'IMAGEN') {
          if (m.origen !== 'IMAGEN' && m.origen !== 'OCR') return;
        }
      }
      
      if (isFiltered && filter) {
        if (filter.level === 'provincia' && filter.provincia) {
          const d = DISTRICT_DATA[m.distrito];
          const p = d ? d.provincia : '';
          const targetProv = PROVINCIAS.find(pr => pr.id === filter.provincia);
          if (!targetProv || targetProv.name !== p) return;
        } else if (filter.level === 'distrito' && filter.distrito) {
          if (m.distrito !== filter.distrito) return;
        } else if (filter.level === 'colegio' && filter.colegio) {
          if (m.distrito !== filter.distrito || m.colegio !== filter.colegio) return;
        } else if (filter.level === 'mesa' && filter.mesa) {
          if (m.distrito !== filter.distrito || m.colegio !== filter.colegio || String(m.mesa) !== String(filter.mesa)) return;
        }
      }
      
      const key = m.distrito + '|' + m.mesa + (widget?.origenFilter ? '|' + m.origen : '');
      uniqueMesas.add(key);
      const hasVotes = totalVotos(m.votos || {}) > 0 || totalVotos(m.votos_provincial || {}) > 0 || totalVotos(m.votos_distrital || {}) > 0;
      if (hasVotes) {
        uniqueEscMesas.add(key);
      }
    });
    
    return { totalMesas: uniqueMesas.size || 1, escMesas: uniqueEscMesas.size };
  },

  render(canvasId, widget, containerEl, context) {
    const ctx = context || widget._ctx || 'dash';
    const chartKey = DashboardCore.getChartKey(widget, ctx);
    DashboardCore.destroyChart(chartKey);
    const canvas = canvasId ? document.getElementById(canvasId) : null;
    if (!canvas && !containerEl) return;

    const type = widget.type;
    if (type === 'kpi') return this.renderKPI(containerEl, widget);
    if (type === 'treemap') return this.renderTreemap(containerEl, widget);
    if (type === 'heatmap') return this.renderHeatmap(containerEl, widget);
    if (type === 'funnel') return this.renderFunnel(containerEl, widget);
    if (type === 'gauge') return this.renderGauge(canvas, widget, chartKey);
    if (type === 'sunburst') return this.renderSunburst(containerEl, widget);
    if (type === 'sankey') return this.renderSankey(containerEl, widget);
    if (type === 'waterfall') return this.renderWaterfall(canvas, widget, chartKey);
    if (!canvas) return;

    const theme = this.getThemeColors();
    const palette = this.getPalette(widget);
    const { totals, distritos, provinciaLabels, mesaData, grand } = this.getChartData(widget);
    
    // Power BI Data Fields / Metrics selection filter
    const activeKeys = (widget && widget.dataFields && widget.dataFields.length > 0)
      ? PARTY_KEYS.filter(k => widget.dataFields.includes(k))
      : PARTY_KEYS;

    const activePalette = activeKeys.map((k, i) => {
      return PARTIES[k]?.color || palette[i % palette.length] || '#cbd5e1';
    });

    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          display: widget.showLegend !== false && !['bar', 'stackedBar', 'waterfall'].includes(type),
          position: widget.legendPosition || 'bottom',
          labels: { color: theme.text, font: { family: 'Segoe UI, Inter, sans-serif', size: 11 }, boxWidth: 12, padding: 10 }
        },
        title: { display: false }
      }
    };

    let chart;
    const scaleOpts = {
      x: { ticks: { color: theme.text, font: { size: 10 } }, grid: { color: theme.grid } },
      y: { ticks: { color: theme.text, font: { size: 10 }, precision: 0, callback: function(v) { return Number.isInteger(v) ? v : ''; } }, grid: { color: theme.grid }, beginAtZero: true }
    };

    switch (type) {
      case 'bar':
        chart = new Chart(canvas, {
          type: 'bar',
          data: { labels: activeKeys, datasets: [{ data: activeKeys.map(k => totals[k]), backgroundColor: activePalette, borderRadius: 6, borderSkipped: false }] },
          options: { ...baseOpts, plugins: { ...baseOpts.plugins, legend: { display: false } }, scales: scaleOpts }
        });
        break;

      case 'hbar':
        chart = new Chart(canvas, {
          type: 'bar',
          data: mesaData ? {
            labels: distritos,
            datasets: activeKeys.map((k, i) => ({
              label: k,
              data: mesaData.map(m => this.getMesaVotes(m, widget)[k] || 0),
              backgroundColor: activePalette[i], borderRadius: 3
            }))
          } : {
            labels: distritos,
            datasets: activeKeys.map((k, i) => ({ label: k, data: distritos.map(d => this.getDistrictVotes(d, widget)[k] || 0), backgroundColor: activePalette[i], borderRadius: 3 }))
          },
          options: { ...baseOpts, indexAxis: 'y', scales: { ...scaleOpts, x: { ...scaleOpts.x, stacked: true }, y: { ...scaleOpts.y, stacked: true } } }
        });
        break;

      case 'stackedBar':
        chart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: distritos.slice(0, 8),
            datasets: activeKeys.map((k, i) => ({ label: k, data: distritos.slice(0, 8).map(d => this.getDistrictVotes(d, widget)[k] || 0), backgroundColor: activePalette[i], borderRadius: 2 }))
          },
          options: { ...baseOpts, scales: { ...scaleOpts, x: { ...scaleOpts.x, stacked: true }, y: { ...scaleOpts.y, stacked: true } } }
        });
        break;

      case 'groupedBar': {
        let labels = distritos.slice(0, 6);
        let datasets;
        if (provinciaLabels) {
          const provData = this.getProvinciaVoteData(widget);
          labels = provinciaLabels.slice(0, 6);
          datasets = activeKeys.map((k, i) => ({
            label: k,
            data: labels.map(name => {
              const pd = provData.find(p => p.name === name);
              return pd ? pd.votos[k] || 0 : 0;
            }),
            backgroundColor: activePalette[i], borderRadius: 4
          }));
        } else if (mesaData?.length) {
          labels = distritos.slice(0, 6);
          datasets = activeKeys.map((k, i) => ({
            label: k,
            data: mesaData.slice(0, 6).map(m => this.getMesaVotes(m, widget)[k] || 0),
            backgroundColor: activePalette[i], borderRadius: 4
          }));
        } else {
          datasets = activeKeys.map((k, i) => ({
            label: k,
            data: labels.map(d => this.getDistrictVotes(d, widget)[k] || 0),
            backgroundColor: activePalette[i], borderRadius: 4
          }));
        }
        chart = new Chart(canvas, {
          type: 'bar',
          data: { labels, datasets },
          options: { ...baseOpts, scales: scaleOpts }
        });
        break;
      }

      case 'line':
        chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels: distritos,
            datasets: activeKeys.map((k, i) => ({
              label: k, data: distritos.map(d => this.getDistrictVotes(d, widget)[k] || 0),
              borderColor: activePalette[i], backgroundColor: activePalette[i] + '22', tension: 0.4, pointRadius: 3, borderWidth: 2, fill: false
            }))
          },
          options: { ...baseOpts, scales: scaleOpts }
        });
        break;

      case 'area':
        chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels: distritos,
            datasets: activeKeys.map((k, i) => ({
              label: k, data: distritos.map(d => this.getDistrictVotes(d, widget)[k] || 0),
              borderColor: activePalette[i], backgroundColor: activePalette[i] + '44', tension: 0.4, fill: true, borderWidth: 2
            }))
          },
          options: { ...baseOpts, scales: scaleOpts }
        });
        break;

      case 'pie':
      case 'doughnut':
        chart = new Chart(canvas, {
          type: type,
          data: { labels: activeKeys, datasets: [{ data: activeKeys.map(k => totals[k]), backgroundColor: activePalette, hoverOffset: 8, borderWidth: 2, borderColor: theme.border }] },
          options: { ...baseOpts, cutout: type === 'doughnut' ? '62%' : 0 }
        });
        break;

      case 'radar':
        chart = new Chart(canvas, {
          type: 'radar',
          data: {
            labels: distritos.slice(0, 8),
            datasets: activeKeys.map((k, i) => ({
              label: k, data: distritos.slice(0, 8).map(d => this.getDistrictVotes(d, widget)[k] || 0),
              borderColor: activePalette[i], backgroundColor: activePalette[i] + '33', pointRadius: 2
            }))
          },
          options: { ...baseOpts, scales: { r: { ticks: { color: theme.text, font: { size: 9 } }, grid: { color: theme.grid }, pointLabels: { color: theme.text, font: { size: 9 } } } } }
        });
        break;

      case 'scatter':
        chart = new Chart(canvas, {
          type: 'scatter',
          data: {
            datasets: PARTY_KEYS.map((k, i) => ({
              label: k,
              data: distritos.map((d, j) => ({ x: j, y: this.getDistrictVotes(d, widget)[k] || 0 })),
              backgroundColor: palette[i], pointRadius: 5
            }))
          },
          options: { ...baseOpts, scales: scaleOpts }
        });
        break;

      case 'bubble':
        chart = new Chart(canvas, {
          type: 'bubble',
          data: {
            datasets: PARTY_KEYS.map((k, i) => ({
              label: k,
              data: distritos.slice(0, 8).map((d, j) => ({
                x: j * 10, y: this.getDistrictVotes(d, widget)[k] || 0, r: Math.sqrt(this.getDistrictVotes(d, widget)[k] || 0) / 15
              })),
              backgroundColor: palette[i] + 'aa'
            }))
          },
          options: { ...baseOpts, scales: scaleOpts }
        });
        break;

      case 'polarArea':
        chart = new Chart(canvas, {
          type: 'polarArea',
          data: { labels: PARTY_KEYS, datasets: [{ data: PARTY_KEYS.map(k => totals[k]), backgroundColor: palette.map(c => c + 'cc') }] },
          options: { ...baseOpts, scales: { r: { ticks: { color: theme.text }, grid: { color: theme.grid } } } }
        });
        break;

      case 'combo':
        chart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: PARTY_KEYS,
            datasets: [
              { type: 'bar', label: 'Votos', data: PARTY_KEYS.map(k => totals[k]), backgroundColor: palette, borderRadius: 4 },
              { type: 'line', label: 'Tendencia', data: PARTY_KEYS.map(k => totals[k] * 0.9 + Math.random() * 500), borderColor: '#f59e0b', borderWidth: 2, fill: false, yAxisID: 'y' }
            ]
          },
          options: { ...baseOpts, scales: scaleOpts }
        });
        break;

      case 'waterfall':
        this.renderWaterfall(canvas, widget, chartKey);
        return;

      case 'gauge':
        this.renderGauge(canvas, widget, chartKey);
        return;

      default:
        chart = new Chart(canvas, {
          type: 'bar',
          data: { labels: PARTY_KEYS, datasets: [{ data: PARTY_KEYS.map(k => totals[k]), backgroundColor: palette, borderRadius: 6 }] },
          options: { ...baseOpts, plugins: { legend: { display: false } }, scales: scaleOpts }
        });
    }

    if (chart) DashboardCore.chartInstances[chartKey] = chart;
  },

  renderKPI(container, widget) {
    const { totals, grand, filter } = this.getChartData(widget);
    const leader = getLeader(totals);
    const { totalMesas, escMesas } = this.getMesaStats(widget);
    const pctEsc = ((escMesas / totalMesas) * 100).toFixed(1);

    container.innerHTML = `
      <div class="kpi-row-main">
        <div class="kpi-card-pro kpi-highlight">
          <div class="kpi-icon" style="background:${PARTIES[leader].color}20;color:${PARTIES[leader].color}">◉</div>
          <div class="kpi-meta">
            <span class="kpi-card-value">${totals[leader].toLocaleString()}</span>
            <span class="kpi-card-label">Votos Líder: ${PARTIES[leader].label}</span>
          </div>
          <span class="kpi-trend up">▲ En vivo</span>
        </div>
        <div class="kpi-card-pro">
          <div class="kpi-icon" style="background:#3b82f620;color:#3b82f6">📊</div>
          <div class="kpi-meta">
            <span class="kpi-card-value">${grand.toLocaleString()}</span>
            <span class="kpi-card-label">Votos totales</span>
          </div>
        </div>
        <div class="kpi-card-pro">
          <div class="kpi-icon" style="background:#10b98120;color:#10b981">✓</div>
          <div class="kpi-meta">
            <span class="kpi-card-value">${escMesas.toLocaleString()} / ${totalMesas.toLocaleString()}</span>
            <span class="kpi-card-label">Mesas escrutadas</span>
          </div>
        </div>
        <div class="kpi-card-pro">
          <div class="kpi-icon" style="background:#8b5cf620;color:#8b5cf6">📍</div>
          <div class="kpi-meta">
            <span class="kpi-card-value">${LocationFilters.getLevelLabel()}</span>
            <span class="kpi-card-label">Nivel de análisis</span>
          </div>
        </div>
      </div>
      <div class="kpi-party-grid">
        ${PARTY_KEYS.map(k => {
          const barWidth = grand > 0 ? ((totals[k] / grand) * 100) : 0;
          return `<div class="kpi-party-card" style="--party-color:${PARTIES[k].color}">
            <span class="kpi-party-pct">${totals[k].toLocaleString()}</span>
            <span class="kpi-party-name">${PARTIES[k].label || k}</span>
            <div class="kpi-party-bar"><div style="width:${barWidth}%"></div></div>
          </div>`;
        }).join('')}
      </div>`;
  },

  renderGauge(canvas, widget, chartKey) {
    const { totalMesas, escMesas } = this.getMesaStats(widget);
    const pct = escMesas / totalMesas;
    const palette = this.getPalette(widget);

    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Escrutadas', 'Pendientes'],
        datasets: [{ data: [escMesas, totalMesas - escMesas], backgroundColor: [palette[0], '#e2e8f0'], borderWidth: 0, circumference: 180, rotation: 270 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: { legend: { display: widget.showLegend, position: 'bottom', labels: { font: { size: 10 } } } }
      },
      plugins: [{
        id: 'gaugeText',
        afterDraw(c) {
          const { ctx, chartArea: { width, height, top } } = c;
          ctx.save();
          ctx.font = 'bold 1.8rem Segoe UI, Inter, sans-serif';
          ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#1e293b';
          ctx.textAlign = 'center';
          ctx.fillText((pct * 100).toFixed(1) + '%', width / 2 + c.chartArea.left, top + height / 2 + 10);
          ctx.font = '0.7rem Segoe UI, Inter, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('Escrutinio', width / 2 + c.chartArea.left, top + height / 2 + 30);
          ctx.restore();
        }
      }]
    });
    DashboardCore.chartInstances[chartKey] = chart;
  },

  renderTreemap(container, widget) {
    const { totals, grand } = this.getChartData(widget);
    const palette = this.getPalette(widget);
    const items = PARTY_KEYS.map((k, i) => ({ key: k, val: totals[k], pct: grand > 0 ? totals[k] / grand : 0, color: palette[i] }));
    items.sort((a, b) => b.val - a.val);

    container.innerHTML = `<div class="treemap-container">${items.map(item => `
      <div class="treemap-cell" style="flex:${item.pct * 100 || 1};background:${item.color}22;border-left:3px solid ${item.color}">
        <span class="treemap-label">${item.key}</span>
        <span class="treemap-value">${item.val.toLocaleString()}</span>
        <span class="treemap-pct">${(item.pct * 100).toFixed(1)}%</span>
      </div>`).join('')}</div>`;
  },

  renderHeatmap(container, widget) {
    const { distritos, provinciaLabels, mesaData, filter } = this.getChartData(widget);
    const palette = this.getPalette(widget);

    let rows = distritos.slice(0, 12);
    let getVal = (row, k) => DISTRICT_DATA[row]?.votos[k] || 0;

    if (provinciaLabels && filter.level === 'lima') {
      const provData = this.getProvinciaVoteData();
      rows = provinciaLabels.slice(0, 8);
      getVal = (name, k) => {
        const pd = provData.find(p => p.name === name);
        return pd ? pd.votos[k] || 0 : 0;
      };
    } else if (mesaData) {
      rows = distritos.slice(0, 8);
      getVal = (label, k) => {
        const idx = distritos.indexOf(label);
        return idx >= 0 ? this.getMesaVotes(mesaData[idx])[k] || 0 : 0;
      };
    }

    const maxVal = Math.max(...rows.flatMap(d => PARTY_KEYS.map(k => getVal(d, k))), 1);

    container.innerHTML = `<div class="heatmap-wrap">
      <div class="heatmap-labels-y">${rows.map(d => `<span>${String(d).substring(0, 8)}</span>`).join('')}</div>
      <div class="heatmap-grid">
        <div class="heatmap-labels-x">${PARTY_KEYS.map(k => `<span>${k}</span>`).join('')}</div>
        ${rows.map(d => `<div class="heatmap-row">${PARTY_KEYS.map((k, i) => {
          const v = getVal(d, k);
          const intensity = maxVal > 0 ? v / maxVal : 0;
          return `<div class="heatmap-cell" style="background:${palette[i]}${Math.round(intensity * 200 + 20).toString(16).padStart(2, '0')}" title="${d} - ${k}: ${v}"></div>`;
        }).join('')}</div>`).join('')}
      </div>
    </div>`;
  },

  renderFunnel(container, widget) {
    const { totals, grand } = this.getChartData(widget);
    const palette = this.getPalette(widget);
    const sorted = PARTY_KEYS.map((k, i) => ({ k, v: totals[k], color: palette[i] })).sort((a, b) => b.v - a.v);

    container.innerHTML = `<div class="funnel-container">${sorted.map((item, i) => {
      const w = 100 - i * 12;
      return `<div class="funnel-step" style="width:${w}%;background:${item.color}">
        <span>${item.k}</span><span>${item.v.toLocaleString()} (${grand > 0 ? ((item.v / grand) * 100).toFixed(1) : 0}%)</span>
      </div>`;
    }).join('')}</div>`;
  },

  renderSunburst(container, widget) {
    const { totals, grand } = this.getChartData(widget);
    const palette = this.getPalette(widget);
    const cx = 120, cy = 120, r = 100;
    let angle = 0;
    const arcs = PARTY_KEYS.map((k, i) => {
      const pct = grand > 0 ? totals[k] / grand : 0;
      const start = angle;
      angle += pct * Math.PI * 2;
      const end = angle;
      const x1 = cx + r * Math.cos(start - Math.PI / 2);
      const y1 = cy + r * Math.sin(start - Math.PI / 2);
      const x2 = cx + r * Math.cos(end - Math.PI / 2);
      const y2 = cy + r * Math.sin(end - Math.PI / 2);
      const large = pct > 0.5 ? 1 : 0;
      return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${palette[i]}" stroke="#fff" stroke-width="1"><title>${k}: ${(pct * 100).toFixed(1)}%</title></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="0 0 240 240" class="sunburst-svg">${arcs}<circle cx="${cx}" cy="${cy}" r="40" fill="var(--surface)"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="var(--text)" font-size="11" font-weight="600">LIMA</text></svg>`;
  },

  renderSankey(container, widget) {
    const { totals } = this.getChartData(widget);
    const palette = this.getPalette(widget);
    const total = totalVotos(totals);

    container.innerHTML = `<div class="sankey-container">
      <div class="sankey-source"><span>Votantes</span><strong>${total.toLocaleString()}</strong></div>
      <div class="sankey-flows">${PARTY_KEYS.map((k, i) => {
        const pct = total > 0 ? (totals[k] / total) * 100 : 0;
        return `<div class="sankey-flow" style="--flow-color:${palette[i]};--flow-width:${Math.max(pct, 5)}%">
          <div class="sankey-bar"></div>
          <span class="sankey-target">${k}: ${totals[k].toLocaleString()}</span>
        </div>`;
      }).join('')}</div>
    </div>`;
  },

  renderWaterfall(canvas, widget, chartKey) {
    const { totals } = this.getChartData(widget);
    const palette = this.getPalette(widget);
    const theme = this.getThemeColors();
    let cumulative = 0;
    const data = PARTY_KEYS.map(k => {
      const v = totals[k];
      const start = cumulative;
      cumulative += v;
      return { start, end: cumulative, val: v };
    });

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: PARTY_KEYS,
        datasets: [
          { label: 'Base', data: data.map(d => d.start), backgroundColor: 'transparent', borderWidth: 0, barPercentage: 0.6 },
          { label: 'Votos', data: data.map(d => d.val), backgroundColor: palette, borderRadius: 4, barPercentage: 0.6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { stacked: true, ticks: { color: theme.text }, grid: { display: false } }, y: { stacked: true, ticks: { color: theme.text }, grid: { color: theme.grid } } },
        plugins: { legend: { display: false } }
      }
    });
    DashboardCore.chartInstances[chartKey] = chart;
  }
};
