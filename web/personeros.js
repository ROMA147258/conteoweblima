/**
 * VOTO REAL – PERSONEROS DASHBOARD (MÓDULO INDEPENDIENTE)
 * Sincroniza ÚNICAMENTE con la hoja "Asistencia" de Google Sheets (action: obtener_asistencia)
 * Gestiona el monitoreo de 1ª Asistencia (Mañana / Apertura) y 2ª Asistencia (Tarde / Cierre).
 */

let personeros1DoughnutChartInstance = null;
let personeros1BarChartInstance = null;
let personeros2DoughnutChartInstance = null;
let personeros2BarChartInstance = null;

// Datos de asistencia de personeros en memoria (sincronizados ÚNICAMENTE con la hoja Asistencia)
window.personerosAsistenciaData = [];
let _currentFilteredPersoneros = [];

/**
 * Inicializar vista de Personeros
 */
async function initPersonerosView() {
  const cached = localStorage.getItem("vr_personeros_asistencia_data");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      window.personerosAsistenciaData = Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      window.personerosAsistenciaData = [];
    }
  } else {
    window.personerosAsistenciaData = [];
  }

  applyPersonerosFilters();
  syncPersonerosData();
}

/**
 * Sincronizar datos de Asistencia con SQL Server (obtener_asistencia)
 */
async function syncPersonerosData(customUrl) {
  try {
    const fetchDirectOrProxy = async (actionName) => {
      try {
        const res = await fetch(`/api/voto-real?action=${actionName}`);
        if (res.ok) {
          const json = await res.json();
          if (json && typeof json === 'object') return json;
        }
      } catch (_) {}
      return null;
    };

    // Sincronizar ÚNICAMENTE la tabla Asistencia (acción: obtener_asistencia)
    const asistenciaRes = await fetchDirectOrProxy('obtener_asistencia');

    const extractArray = (dataObj) => {
      if (!dataObj) return [];
      if (Array.isArray(dataObj)) return dataObj;
      if (Array.isArray(dataObj.asistencia)) return dataObj.asistencia;
      if (Array.isArray(dataObj.data)) return dataObj.data;
      if (Array.isArray(dataObj.rows)) return dataObj.rows;
      if (Array.isArray(dataObj.list)) return dataObj.list;
      return [];
    };

    const rawList = extractArray(asistenciaRes);
    const parsedList = [];

    if (rawList.length > 0) {
      rawList.forEach(item => {
        if (!item || typeof item !== 'object') return;

        const dist = item.distrito || item['Distrito'] || "";
        const normDistrito = typeof normalizeDistrito === "function" ? normalizeDistrito(dist) : dist;

        parsedList.push({
          id: item.id || `P-${Math.random()}`,
          fechaHora: item.fechaHora || item.fecha || item['Fecha/Hora'] || "",
          nombre: item.nombre || item.personeroNombre || item['Nombre'] || "",
          dni: String(item.dni || item.personeroDni || item['DNI'] || "").trim(),
          distrito: normDistrito || dist || "",
          local: item.local || item.colegio || item['Local'] || item['Colegio'] || "",
          mesa: item.mesa || item['Mesa'] || "",
          foto: item.foto || item['Foto'] || "",
          ubicacionGps: item.ubicacionGps || item['Ubicación GPS'] || item['GPS'] || "",
          estadoLlegada: item.estadoLlegada || item['Estado Llegada'] || "",
          confirmacion1: (item.confirmacion1 || item['1ra Confirmación'] || item.confirmacion || item['Confirmación'] || "").toString().toUpperCase().trim(),
          confirmacion2: (item.confirmacion2 || item['2da Confirmación'] || "").toString().toUpperCase().trim(),
          confirmacion: (item.confirmacion || item['Confirmación'] || "").toString().toUpperCase().trim()
        });
      });
    }

    window.personerosAsistenciaData = parsedList;
    try {
      localStorage.setItem("vr_personeros_asistencia_data", JSON.stringify(parsedList));
    } catch (_) {}

    applyPersonerosFilters();

  } catch (err) {
    console.error("Error sincronizando hoja Asistencia (Personeros):", err);
  }
}

/**
 * Aplicar filtros globales y renderizar gráficos y tabla de Personeros
 */
function applyPersonerosFilters() {
  const data = window.personerosAsistenciaData || [];
  const filter = window.VR_FILTER || { level: 'lima' };

  // Filtrar según el nivel de ubicación seleccionado
  const filtered = data.filter(item => {
    if (filter.level === 'provincia' && filter.provincia) {
      const distsInProv = (typeof PROVINCIAS !== 'undefined') ? (PROVINCIAS.find(p => p.id === filter.provincia)?.distritos || []) : [];
      if (!distsInProv.includes(item.distrito)) return false;
    } else if (filter.level === 'distrito' && filter.distrito) {
      if (item.distrito !== filter.distrito) return false;
    } else if (filter.level === 'colegio' && filter.colegio) {
      if (item.distrito !== filter.distrito || item.local !== filter.colegio) return false;
    } else if (filter.level === 'mesa' && filter.mesa) {
      if (item.distrito !== filter.distrito || String(item.mesa) !== String(filter.mesa)) return false;
    }
    return true;
  });

  _currentFilteredPersoneros = filtered;

  updatePersonerosKPIs(filtered);
  renderPersonerosCharts(filtered);
  renderPersonerosTable(filtered);
}

/**
 * Actualizar tarjetas KPI de Personeros
 */
function updatePersonerosKPIs(list) {
  let conf1Count = 0;
  let conf2Count = 0;
  const distSet = new Set();

  list.forEach(item => {
    if (item.distrito) distSet.add(item.distrito);

    const isConf1 = item.confirmacion1 === "CONFIRMADA" || item.confirmacion1 === "SI" || item.confirmacion === "SI" || item.confirmacion === "CONFIRMADA";
    const isConf2 = item.confirmacion2 === "CONFIRMADA" || item.confirmacion2 === "SI";

    if (isConf1) conf1Count++;
    if (isConf2) conf2Count++;
  });

  const kpiTotal = document.getElementById("persKpiTotal");
  const kpiConf1 = document.getElementById("persKpiConf1");
  const kpiConf2 = document.getElementById("persKpiConf2");
  const kpiDists = document.getElementById("persKpiDistritos");

  if (kpiTotal) kpiTotal.textContent = list.length.toLocaleString('es-PE');
  if (kpiConf1) kpiConf1.textContent = conf1Count.toLocaleString('es-PE');
  if (kpiConf2) kpiConf2.textContent = conf2Count.toLocaleString('es-PE');
  if (kpiDists) kpiDists.textContent = distSet.size.toString();
}

/**
 * Renderizar gráficos de 1ª Asistencia (Mañana) y 2ª Asistencia (Tarde)
 */
function renderPersonerosCharts(list) {
  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const colors = {
    text: isDark ? "#f1f5f9" : "#0f172a",
    grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    subtext: isDark ? "#94a3b8" : "#64748b"
  };

  let confirmados1 = 0;
  let confirmados2 = 0;
  const distStats1 = {};
  const distStats2 = {};

  list.forEach(item => {
    const dist = item.distrito || "Otros";

    const isConf1 = item.confirmacion1 === "CONFIRMADA" || item.confirmacion1 === "SI" || item.confirmacion === "SI" || item.confirmacion === "CONFIRMADA";
    const isConf2 = item.confirmacion2 === "CONFIRMADA" || item.confirmacion2 === "SI";

    if (isConf1) {
      confirmados1++;
      distStats1[dist] = (distStats1[dist] || 0) + 1;
    }

    if (isConf2) {
      confirmados2++;
      distStats2[dist] = (distStats2[dist] || 0) + 1;
    }
  });

  // Calcular esperados basados en data de mesas / total de lista
  const activeDistricts = (typeof getActiveDistricts === 'function') ? getActiveDistricts() : [];
  let totalEsperados = 0;

  if (activeDistricts.length > 0 && typeof DISTRICT_DATA !== 'undefined') {
    activeDistricts.forEach(d => {
      totalEsperados += (DISTRICT_DATA[d]?.mesas || 0);
    });
  }
  if (totalEsperados === 0) {
    totalEsperados = Math.max(list.length, 50);
  }

  const faltantes1 = Math.max(0, totalEsperados - confirmados1);
  const faltantes2 = Math.max(0, totalEsperados - confirmados2);

  const pct1 = totalEsperados > 0 ? ((confirmados1 / totalEsperados) * 100).toFixed(1) : "0.0";
  const pct2 = totalEsperados > 0 ? ((confirmados2 / totalEsperados) * 100).toFixed(1) : "0.0";

  // 1. 🌅 PRIMERA ASISTENCIA (DOUGHNUT)
  try {
    const ctx1 = document.getElementById("asistencia1DoughnutChart")?.getContext("2d");
    if (ctx1) {
      if (personeros1DoughnutChartInstance) personeros1DoughnutChartInstance.destroy();
      personeros1DoughnutChartInstance = new Chart(ctx1, {
        type: "doughnut",
        data: {
          labels: [`Confirmados 1ª (${confirmados1})`, `Pendientes 1ª (${faltantes1})`],
          datasets: [{
            data: [confirmados1, faltantes1],
            backgroundColor: ["#10b981", "#ef4444"],
            borderWidth: 3,
            borderColor: isDark ? "#1e293b" : "#ffffff",
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: colors.text,
                padding: 16,
                font: { size: 12, weight: '600', family: 'Inter' }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const val = context.raw || 0;
                  const total = confirmados1 + faltantes1;
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                  return `${context.label}: ${val} (${pct}%)`;
                }
              }
            }
          },
          cutout: "60%"
        }
      });
    }
  } catch (err) { console.warn("Error personeros1DoughnutChart:", err); }

  // 2. 🌅 PRIMERA ASISTENCIA POR DISTRITO (BAR)
  try {
    const ctxBar1 = document.getElementById("asistencia1BarChart")?.getContext("2d");
    if (ctxBar1) {
      if (personeros1BarChartInstance) personeros1BarChartInstance.destroy();
      const sorted1 = Object.entries(distStats1).sort((a, b) => b[1] - a[1]).slice(0, 15);
      const labels1 = sorted1.map(x => x[0]);
      const values1 = sorted1.map(x => x[1]);

      personeros1BarChartInstance = new Chart(ctxBar1, {
        type: "bar",
        data: {
          labels: labels1.length > 0 ? labels1 : ["Sin registros"],
          datasets: [{
            label: "Personeros Confirmados 1ª Asistencia",
            data: values1.length > 0 ? values1 : [0],
            backgroundColor: "rgba(16, 185, 129, 0.85)",
            borderColor: "#10b981",
            borderWidth: 1.5,
            borderRadius: 6,
            maxBarThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: colors.text, font: { size: 11, family: 'Inter' } },
              grid: { color: colors.grid }
            },
            y: {
              ticks: { color: colors.text, font: { size: 11, family: 'Inter' }, precision: 0 },
              grid: { color: colors.grid }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Confirmados: ${ctx.raw} personeros`
              }
            }
          }
        }
      });
    }
  } catch (err) { console.warn("Error personeros1BarChart:", err); }

  // 3. 🌆 SEGUNDA ASISTENCIA (DOUGHNUT)
  try {
    const ctx2 = document.getElementById("asistencia2DoughnutChart")?.getContext("2d");
    if (ctx2) {
      if (personeros2DoughnutChartInstance) personeros2DoughnutChartInstance.destroy();
      personeros2DoughnutChartInstance = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: [`Confirmados 2ª (${confirmados2})`, `Pendientes 2ª (${faltantes2})`],
          datasets: [{
            data: [confirmados2, faltantes2],
            backgroundColor: ["#3b82f6", "#f59e0b"],
            borderWidth: 3,
            borderColor: isDark ? "#1e293b" : "#ffffff",
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: colors.text,
                padding: 16,
                font: { size: 12, weight: '600', family: 'Inter' }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const val = context.raw || 0;
                  const total = confirmados2 + faltantes2;
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                  return `${context.label}: ${val} (${pct}%)`;
                }
              }
            }
          },
          cutout: "60%"
        }
      });
    }
  } catch (err) { console.warn("Error personeros2DoughnutChart:", err); }

  // 4. 🌆 SEGUNDA ASISTENCIA POR DISTRITO (BAR)
  try {
    const ctxBar2 = document.getElementById("asistencia2BarChart")?.getContext("2d");
    if (ctxBar2) {
      if (personeros2BarChartInstance) personeros2BarChartInstance.destroy();
      const sorted2 = Object.entries(distStats2).sort((a, b) => b[1] - a[1]).slice(0, 15);
      const labels2 = sorted2.map(x => x[0]);
      const values2 = sorted2.map(x => x[1]);

      personeros2BarChartInstance = new Chart(ctxBar2, {
        type: "bar",
        data: {
          labels: labels2.length > 0 ? labels2 : ["Sin registros"],
          datasets: [{
            label: "Personeros Confirmados 2ª Asistencia",
            data: values2.length > 0 ? values2 : [0],
            backgroundColor: "rgba(59, 130, 246, 0.85)",
            borderColor: "#3b82f6",
            borderWidth: 1.5,
            borderRadius: 6,
            maxBarThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: colors.text, font: { size: 11, family: 'Inter' } },
              grid: { color: colors.grid }
            },
            y: {
              ticks: { color: colors.text, font: { size: 11, family: 'Inter' }, precision: 0 },
              grid: { color: colors.grid }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Confirmados: ${ctx.raw} personeros`
              }
            }
          }
        }
      });
    }
  } catch (err) { console.warn("Error personeros2BarChart:", err); }
}

/**
 * Renderizar tabla en vivo con los registros de la hoja Asistencia
 */
function renderPersonerosTable(list) {
  const tbody = document.getElementById("personerosTableBody");
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text3);">
          No se encontraron registros de personeros en la hoja Asistencia.
        </td>
      </tr>
    `;
    return;
  }

  const rowsHtml = list.slice(0, 100).map(item => {
    const isConf1 = item.confirmacion1 === "CONFIRMADA" || item.confirmacion1 === "SI" || item.confirmacion === "SI" || item.confirmacion === "CONFIRMADA";
    const isConf2 = item.confirmacion2 === "CONFIRMADA" || item.confirmacion2 === "SI";

    const badge1 = isConf1
      ? `<span class="status-badge success" style="padding:2px 8px; font-size:0.7rem;">✓ Confirmada</span>`
      : `<span class="status-badge warning" style="padding:2px 8px; font-size:0.7rem;">⏳ Pendiente</span>`;

    const badge2 = isConf2
      ? `<span class="status-badge success" style="padding:2px 8px; font-size:0.7rem;">✓ Confirmada</span>`
      : `<span class="status-badge warning" style="padding:2px 8px; font-size:0.7rem;">⏳ Pendiente</span>`;

    return `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding:0.6rem 0.8rem; font-weight:600; color:var(--text);">${item.dni || '---'}</td>
        <td style="padding:0.6rem 0.8rem; font-weight:600; color:var(--text);">${item.nombre || 'Personero Sin Nombre'}</td>
        <td style="padding:0.6rem 0.8rem; color:var(--text2);">${item.distrito || '---'}</td>
        <td style="padding:0.6rem 0.8rem; color:var(--text2);">${item.local || '---'}</td>
        <td style="padding:0.6rem 0.8rem; text-align:center; font-weight:700; color:var(--accent);">${item.mesa || '---'}</td>
        <td style="padding:0.6rem 0.8rem; text-align:center;">${badge1}</td>
        <td style="padding:0.6rem 0.8rem; text-align:center;">${badge2}</td>
        <td style="padding:0.6rem 0.8rem; color:var(--text3); font-size:0.75rem;">${item.fechaHora || '---'}</td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rowsHtml;
}

/**
 * Filtrar la tabla de Personeros por texto
 */
function filterPersonerosTable(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) {
    renderPersonerosTable(_currentFilteredPersoneros);
    return;
  }

  const filtered = _currentFilteredPersoneros.filter(item => {
    return (item.nombre && item.nombre.toLowerCase().includes(q)) ||
           (item.dni && item.dni.includes(q)) ||
           (item.distrito && item.distrito.toLowerCase().includes(q)) ||
           (item.local && item.local.toLowerCase().includes(q)) ||
           (item.mesa && String(item.mesa).includes(q));
  });

  renderPersonerosTable(filtered);
}

// Hacer globales las funciones del módulo Personeros
window.initPersonerosView = initPersonerosView;
window.syncPersonerosData = syncPersonerosData;
window.applyPersonerosFilters = applyPersonerosFilters;
window.filterPersonerosTable = filterPersonerosTable;
