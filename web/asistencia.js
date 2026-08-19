/**
 * VOTO REAL – ASISTENCIA & COORDINADORES DASHBOARD CORE
 * Gestiona el panel de asistencia, diagramas e integración con el filtro global de la aplicación.
 */

let coordDoughnutChartInstance = null;
let coordBarChartInstance = null;
let asist1DoughnutChartInstance = null;
let asist1BarChartInstance = null;
let asist2DoughnutChartInstance = null;
let asist2BarChartInstance = null;

// Datos combinados en memoria (dinámicos desde Google Sheets)
window.combinedAsistenciaData = [];

/**
 * Inicialización de la vista
 */
async function initAsistenciaView() {
  await loadAsistenciaViewTemplate();
  
  const cached = localStorage.getItem("vr_combined_asistencia_data");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      window.combinedAsistenciaData = Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      window.combinedAsistenciaData = [];
    }
  } else {
    window.combinedAsistenciaData = [];
  }

  applyAsistenciaFilters();
  syncAsistenciaData();
}

async function loadAsistenciaViewTemplate() {
  const container = document.getElementById("view-asistencia");
  if (container && (!document.getElementById("asistenciaAlertsPanel") || !container.children || container.children.length === 0)) {
    try {
      const res = await fetch("asistencia.html");
      if (res.ok) {
        const html = await res.text();
        container.innerHTML = html;
      }
    } catch (e) {
      console.warn("Could not load asistencia.html template:", e);
    }
  }
}

/**
 * Sincronizar datos de Google Sheets (Asistencia y Coordinadores)
 */
async function syncAsistenciaData(customUrl) {
  const tableBody = document.getElementById("asistenciaTableBody");
  if ((!window.combinedAsistenciaData || window.combinedAsistenciaData.length === 0) && tableBody) {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            <span class="live-dot" style="display:inline-block; margin-right: 0.5rem;"></span>
            Sincronizando datos de asistencia y coordinadores con SQL Server (BD: conteo)...
          </td>
        </tr>
      `;
    }
  }

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

    const [coordData, usuariosData] = await Promise.all([
      fetchDirectOrProxy('obtener_coordinadores'),
      fetchDirectOrProxy('obtener_usuarios')
    ]);

    const extractArray = (dataObj, key) => {
      if (!dataObj) return [];
      if (Array.isArray(dataObj)) return dataObj;
      if (Array.isArray(dataObj[key])) return dataObj[key];
      if (Array.isArray(dataObj.coordinadores)) return dataObj.coordinadores;
      if (Array.isArray(dataObj.usuarios)) return dataObj.usuarios;
      if (Array.isArray(dataObj.data)) return dataObj.data;
      if (Array.isArray(dataObj.rows)) return dataObj.rows;
      if (Array.isArray(dataObj.list)) return dataObj.list;
      if (dataObj.report && Array.isArray(dataObj.report[key])) return dataObj.report[key];
      return [];
    };

    const coordList = extractArray(coordData, 'coordinadores');
    const usuariosList = extractArray(usuariosData, 'usuarios');

    if (usuariosList.length > 0) {
      window.VR_USUARIOS_DATA = usuariosList;
      if (typeof safeSetLocalStorage === 'function') {
        safeSetLocalStorage("vr_usuarios_data", window.VR_USUARIOS_DATA);
      } else {
        try { localStorage.setItem("vr_usuarios_data", JSON.stringify(window.VR_USUARIOS_DATA)); } catch (_) {}
      }
    } else {
      try {
        const cached = localStorage.getItem("vr_usuarios_data");
        if (cached) window.VR_USUARIOS_DATA = JSON.parse(cached);
      } catch (_) {}
    }

    console.log("syncAsistenciaData - Registros Hoja Coordinadores:", coordList.length);

    const merged = [];

    // Mapear Coordinadores exclusivamente desde la hoja "Coordinadores"
    if (coordList.length > 0) {
      coordList.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const dist = item.distrito || item.ubicacion || item['Distrito'] || "";
        const normDistrito = typeof normalizeDistrito === "function" ? normalizeDistrito(dist) : dist;
        const cName = item.coordinadorNombre || item.coordinador || item['Coordinador Nombre'] || item['Coordinador'] || "";
        const pName = item.personeroNombre || item.nombre || item['Personero Nombre'] || item['Personero'] || item.personero || "";
        const pDni = item.personeroDni || item.dni || item['Personero DNI'] || item['DNI'] || "";
        const loc = item.local || item.colegio || item['Local'] || item['Colegio'] || "";
        const cDni = item.coordinadorDni || item['Coordinador DNI'] || "";
        const conf = item.confirmacion || item['Confirmacion'] || item['Confirmación'] || item.estado || "";
        const fHora = item.fechaHora || item.fecha || item['Fecha/Hora'] || item['Fecha'] || "";
        const mesa = item.mesa || item['Mesa'] || "";

        merged.push({
          id: item.id || `C-${Math.random()}`,
          tipo: "coordinador",
          fechaHora: fHora,
          personeroNombre: pName,
          personeroDni: String(pDni).trim(),
          distrito: normDistrito || dist || "",
          local: loc || "",
          coordinadorNombre: cName || (loc ? `Coordinador - ${loc}` : "Coordinador"),
          coordinadorDni: String(cDni).trim(),
          mesa: mesa,
          confirmacion: conf
        });
      });
    }

    const newDataHash = JSON.stringify(merged) + "_" + JSON.stringify(window.VR_USUARIOS_DATA || []);
    if (window._lastAsistenciaDataHash === newDataHash && document.getElementById("asistenciaAlertsGrid")?.children.length > 0) {
      // Data idéntica: omitir re-renderizado para evitar recargas constantes de gráficos y pantalla
      return;
    }
    window._lastAsistenciaDataHash = newDataHash;

    window.combinedAsistenciaData = merged;
    if (typeof safeSetLocalStorage === 'function') {
      safeSetLocalStorage("vr_combined_asistencia_data", window.combinedAsistenciaData);
    } else {
      try { localStorage.setItem("vr_combined_asistencia_data", JSON.stringify(window.combinedAsistenciaData)); } catch (_) {}
    }

    // Loggear actividad
    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.add("Asistencia sincronizada", `Sincronizados ${window.combinedAsistenciaData.length} registros (exclusivo Hoja Coordinadores)`);
    }

    // Aplicar filtros e inyectar al DOM sólo cuando haya cambios reales
    applyAsistenciaFilters();
  } catch (error) {
    console.error("Error de sincronización con Google Sheets:", error);
    applyAsistenciaFilters();
  }
}

/**
 * Obtener datos combinados filtrados según el filtro global de la aplicación (VR_FILTER)
 */
function getFilteredAsistenciaData() {
  const data = window.combinedAsistenciaData || [];
  const filter = window.VR_FILTER || { level: 'lima' };
  
  // Limpiador de texto robusto (remueve acentos, espacios extra y caracteres especiales)
  const cleanStr = s => String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve marcas diacríticas/acentos
    .replace(/[^a-z0-9]/g, "") // Conserva solo letras y números
    .trim();

  const filtered = data.filter(item => {
    // 1. Filtrar por provincia
    if (filter.level === 'provincia' && filter.provincia) {
      const provObj = PROVINCIAS.find(p => p.id === filter.provincia);
      if (!provObj || !provObj.distritos.some(d => cleanStr(d) === cleanStr(item.distrito))) {
        return false;
      }
    }
    
    // 2. Filtrar por distrito
    if (filter.level === 'distrito' && filter.distrito) {
      if (cleanStr(item.distrito) !== cleanStr(filter.distrito)) {
        return false;
      }
    }

    // 3. Filtrar por colegio
    if (filter.level === 'colegio' && filter.colegio) {
      if (cleanStr(item.local) !== cleanStr(filter.colegio)) {
        return false;
      }
    }

    // 4. Filtrar por mesa
    if (filter.level === 'mesa' && filter.mesa) {
      if (item.tipo === "personero") {
        const assignedMesa = String(item.coordinadorNombre || "").replace(/\D/g, "");
        if (assignedMesa && assignedMesa !== String(filter.mesa)) {
          return false;
        }
      }
    }

    return true;
  });

  console.log("applyAsistenciaFilters - VR_FILTER actual:", filter);
  console.log("applyAsistenciaFilters - Registros antes de filtrar:", data.length);
  console.log("applyAsistenciaFilters - Registros después de filtrar:", filtered.length);
  
  if (filtered.length === 0 && data.length > 0) {
    return data;
  }

  return filtered;
}

/**
 * Obtener cantidad total de mesas de la estructura electoral según filtro
 */
function getElectoralMesasCount(filter) {
  const clean = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
  const uniqueMesas = new Set();
  const report = window.VR_SHEET_REPORT;
  
  const processItem = (dist, col, mesa) => {
    if (!mesa) return;
    
    if (filter) {
      if (filter.level === 'provincia' && filter.provincia) {
        if (typeof PROVINCIAS !== 'undefined') {
          const provObj = PROVINCIAS.find(p => p.id === filter.provincia);
          if (!provObj || !provObj.distritos.some(d => clean(d) === clean(dist))) {
            return;
          }
        }
      }
      
      if (filter.distrito) {
        if (clean(dist) !== clean(filter.distrito)) {
          return;
        }
      }
      
      if (filter.colegio) {
        if (clean(col) !== clean(filter.colegio)) {
          return;
        }
      }
      
      if (filter.mesa) {
        if (String(mesa).trim() !== String(filter.mesa).trim()) {
          return;
        }
      }
    }
    
    uniqueMesas.add(`${dist}|${col}|${mesa}`);
  };

  if (report && Array.isArray(report.mesas_estructura)) {
    report.mesas_estructura.forEach(item => {
      processItem(item.distrito, item.colegio, item.mesa);
    });
  }
  
  if (uniqueMesas.size === 0 && typeof MESA_DATA !== 'undefined') {
    Object.values(MESA_DATA).forEach(m => {
      processItem(m.distrito, m.colegio, m.mesa);
    });
  }
  
  return uniqueMesas.size;
}

/**
 * Renderizar alertas de inasistencia (corte a las 7:00 AM)
 */
function renderAsistenciaAlerts(data) {
  const container = document.getElementById("asistenciaAlertsPanel") || document.getElementById("aperturaAlertsPanel");
  if (!container) return;

  const now = new Date();
  const currentHour = now.getHours();
  // Alerta activa a partir de las 7:00 AM
  const isPast7Am = currentHour >= 7;

  const coordGroups = {};
  const cleanStr = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

  if (!data || data.length === 0) {
    if (window.combinedAsistenciaData && window.combinedAsistenciaData.length > 0) {
      data = window.combinedAsistenciaData;
    }
  }

  // 1. Mapear todas las confirmaciones recibidas de Coordinadores y Asistencia
  const confirmationsByDni = {};
  const allSources = [...(data || []), ...(window.personerosAsistenciaData || [])];
  allSources.forEach(item => {
    let persDni = String(item.personeroDni || item.personeroDNI || item.dni || "").trim();
    if (!persDni) persDni = String(item.id || item.personeroNombre || item.nombre || "").trim();
    if (!persDni) return;
    const confStr = String(item.confirmacion || item.confirmacion1 || "").trim();
    const isConf = confStr.toUpperCase() === "SI" || confStr.toUpperCase() === "CONFIRMADA" || confStr.toUpperCase().startsWith("HTTP");
    let fotoUrl = item.foto || item.foto_url || "";
    if (confStr.startsWith("http://") || confStr.startsWith("https://")) fotoUrl = confStr;

    if (!confirmationsByDni[persDni] || isConf) {
      confirmationsByDni[persDni] = {
        hasAttended: isConf,
        fotoUrl: fotoUrl || (confirmationsByDni[persDni] ? confirmationsByDni[persDni].fotoUrl : "")
      };
    }
  });

  // Helper para añadir a grupo con resolución de Nombre Real de Coordinador
  const getOrCreateGroup = (rawCoordName, localName, distName) => {
    let coordName = String(rawCoordName || "").trim();
    if (!coordName || coordName.startsWith("(") || coordName.toLowerCase().startsWith("sin coord")) {
      const fullUsers = window.VR_USUARIOS_DATA || [];
      const matchCoord = fullUsers.find(u => {
        const uRol = String(u.rol || "").toLowerCase();
        return uRol === "coordinador" && (cleanStr(u.colegio || u.local) === cleanStr(localName) || cleanStr(u.ubicacion || u.distrito) === cleanStr(distName));
      });
      if (matchCoord && matchCoord.nombre) {
        coordName = matchCoord.nombre;
      } else {
        coordName = `Coordinador - ${localName || distName || "General"}`;
      }
    }

    const key = `${coordName}|${localName || "Sin Local"}`;
    if (!coordGroups[key]) {
      coordGroups[key] = {
        coordinadorNombre: coordName,
        local: localName || "Sin Local",
        distrito: distName || "",
        expectedPersoneros: [],
        attendedCount: 0,
        attendedPersoneros: [],
        missingPersoneros: [],
        processedDnis: new Set()
      };
    }
    return coordGroups[key];
  };

  // 2. Procesar entradas de la hoja / tabla Coordinadores
  (data || []).forEach(exp => {
    let persDni = String(exp.personeroDni || exp.personeroDNI || exp.dni || "").trim();
    if (!persDni) persDni = String(exp.id || exp.personeroNombre || exp.nombre || Math.random()).trim();
    const local = exp.local || exp.colegio || "Sin Local";
    const distrito = typeof normalizeDistrito === "function" ? normalizeDistrito(exp.distrito || exp.ubicacion) : (exp.distrito || exp.ubicacion);
    const coordName = exp.coordinadorNombre || exp.coordinador || `Coordinador - ${local}`;

    const group = getOrCreateGroup(coordName, local, distrito);
    if (group.processedDnis.has(persDni)) return;
    group.processedDnis.add(persDni);

    const conf = confirmationsByDni[persDni] || {};
    const confCoord = String(exp.confirmacion || "").trim();
    const hasAttended = conf.hasAttended || confCoord.toUpperCase() === "SI" || confCoord.toUpperCase() === "CONFIRMADA" || confCoord.toUpperCase().startsWith("HTTP");
    let fotoUrl = conf.fotoUrl;
    if (!fotoUrl && (confCoord.startsWith("http://") || confCoord.startsWith("https://"))) {
      fotoUrl = confCoord;
    }

    const personeroInfo = {
      nombre: exp.personeroNombre || exp.nombre || "Personero",
      dni: persDni,
      mesa: exp.mesa || "",
      fotoUrl: fotoUrl || ""
    };

    group.expectedPersoneros.push(personeroInfo);
    if (hasAttended) {
      group.attendedCount++;
      group.attendedPersoneros.push(personeroInfo);
    } else {
      group.missingPersoneros.push(personeroInfo);
    }
  });

  // 3. Complementar con el padrón de Usuarios para que todos los personeros del mismo colegio aparezcan bajo su coordinador
  const fullUsers = window.VR_USUARIOS_DATA || [];
  fullUsers.forEach(u => {
    const rol = String(u.rol || "").toLowerCase();
    if (rol === "coordinador" || rol === "admin") return;
    const persDni = String(u.dni || "").trim();
    if (!persDni) return;
    const local = u.colegio || u.local || "Sin Local";
    const distrito = typeof normalizeDistrito === "function" ? normalizeDistrito(u.ubicacion || u.distrito) : (u.ubicacion || u.distrito);

    const matchCoord = fullUsers.find(c => {
      const cRol = String(c.rol || "").toLowerCase();
      return cRol === "coordinador" && (cleanStr(c.colegio || c.local) === cleanStr(local) || (cleanStr(c.ubicacion || c.distrito) === cleanStr(distrito) && (!c.colegio || !c.local)));
    });

    const coordName = matchCoord ? matchCoord.nombre : `Coordinador - ${local}`;
    const group = getOrCreateGroup(coordName, local, distrito);

    if (group.processedDnis.has(persDni)) return;
    group.processedDnis.add(persDni);

    const conf = confirmationsByDni[persDni] || {};
    const personeroInfo = {
      nombre: u.nombre || "Personero",
      dni: persDni,
      mesa: u.mesa || "",
      fotoUrl: conf.fotoUrl || ""
    };

    group.expectedPersoneros.push(personeroInfo);
    if (conf.hasAttended) {
      group.attendedCount++;
      group.attendedPersoneros.push(personeroInfo);
    } else {
      group.missingPersoneros.push(personeroInfo);
    }
  });

  // Convertir a array de grupos exclusivamente procesados desde la hoja Coordinadores
  let groupsArray = Object.values(coordGroups).filter(g => g.expectedPersoneros.length > 0 || g.coordinadorNombre);

  if (groupsArray.length === 0) {
    container.innerHTML = `
      <div class="asistencia-alerts-container">
        <div class="asistencia-alerts-header">
          <div class="asistencia-alerts-title">
            <span>📢 Control de Apertura de Mesas</span>
          </div>
        </div>
        <div style="padding: 2rem; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); margin-top: 0.5rem;">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📋</span>
          <strong style="color: var(--text);">Esperando confirmaciones de la hoja "Coordinadores"...</strong>
          <p style="font-size: 0.82rem; color: var(--text2); margin-top: 0.5rem;">Aún no se han recibido registros en la hoja "Coordinadores" de Google Sheets. El sistema continuará sincronizando automáticamente.</p>
        </div>
      </div>
    `;
    return;
  }

  // Ordenar para que los que tienen ausencias aparezcan primero
  const sortedGroups = groupsArray.sort((a, b) => {
    const aHasAbsence = a.missingPersoneros.length > 0 ? 1 : 0;
    const bHasAbsence = b.missingPersoneros.length > 0 ? 1 : 0;
    return bHasAbsence - aHasAbsence; // 1s (absences) first, 0s last
  });

  // Calcular totales globales
  const globalTotal = getElectoralMesasCount(window.VR_FILTER || { level: 'lima' }) || groupsArray.reduce((acc, curr) => acc + curr.expectedPersoneros.length, 0);
  const globalPresent = groupsArray.reduce((acc, curr) => acc + curr.attendedCount, 0);
  const globalMissing = Math.max(0, globalTotal - globalPresent);

  const globalPresentPct = globalTotal > 0 ? Math.round((globalPresent / globalTotal) * 100) : 0;
  const globalMissingPct = globalTotal > 0 ? 100 - globalPresentPct : 0;

  // Hay ausencias en general?
  const anyAbsence = groupsArray.some(g => g.missingPersoneros.length > 0);

  const timeBadgeClass = isPast7Am ? "warning" : "info";
  const timeBadgeText = isPast7Am 
    ? `⚠️ ALERTA: Pasadas las 07:00 AM` 
    : `⏱️ Monitoreo Previo (Corte 07:00 AM)`;

  const cardsHtml = sortedGroups.map(g => {
    // El total real de mesas de este colegio en la estructura electoral
    const total = getElectoralMesasCount({ distrito: g.distrito, colegio: g.local }) || g.expectedPersoneros.length;
    const present = g.attendedCount;
    const missing = Math.max(0, total - present);
    const presentPct = total > 0 ? Math.round((present / total) * 100) : 0;
    const missingPct = total > 0 ? 100 - presentPct : 0;

    let cardStatusClass = "success-status";
    if (missing > 0) {
      cardStatusClass = isPast7Am ? "critical" : "warning-status";
    }

    const attendedListHtml = g.attendedPersoneros.length > 0
      ? g.attendedPersoneros.map(m => `
          <div class="asistencia-alert-present-item" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.73rem; padding: 2px 0;">
            <div>
              <strong style="color: #10b981; font-size: 0.74rem;">${m.nombre}</strong> <span style="color: var(--text2); font-size: 0.7rem;">(DNI: ${m.dni}${m.mesa ? ' · Mesa ' + m.mesa : ''})</span>
            </div>
            ${m.fotoUrl ? `<a href="${m.fotoUrl}" target="_blank" style="color: #3fb7e2; text-decoration: none; font-size: 0.68rem; font-weight: 600; display: inline-flex; align-items: center; gap: 2px;">🖼️ Ver Foto</a>` : ''}
          </div>
        `).join("")
      : `<div style="font-size: 0.7rem; color: var(--text3); font-style: italic; padding-left: 0.25rem;">Ninguno asistió aún</div>`;

    const registeredDnis = new Set(g.attendedPersoneros.map(p => String(p.dni).trim()).concat(g.missingPersoneros.map(p => String(p.dni).trim())).filter(Boolean));

    let missingListHtml = g.missingPersoneros.length > 0
      ? g.missingPersoneros.map(m => `
          <div class="asistencia-alert-missing-item" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.73rem; padding: 2px 0;">
            <div>
              <strong style="color: #ef4444; font-size: 0.74rem;">${m.nombre}</strong> <span style="color: #ef4444; font-size: 0.7rem; opacity: 0.9;">(DNI: ${m.dni}${m.mesa ? ' · Mesa ' + m.mesa : ''})</span>
            </div>
            <span style="color: #ef4444; font-size: 0.68rem; font-weight: 600;">⏳ Faltante</span>
          </div>
        `).join("")
      : "";

    // Buscar en la nómina (Usuarios) ÚNICAMENTE los personeros asignados a ESTE colegio y coordinador exacto
    const allUsuarios = window.VR_USUARIOS_DATA || [];
    const cleanStr = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

    const missingSlots = Math.max(0, missing - g.missingPersoneros.length);

    const unregisteredUsuarios = allUsuarios.filter(u => {
      if (!u.nombre || !u.dni) return false;

      // EXCLUIR estrictamente a cualquier usuario que sea Coordinador o Admin
      const uNameLower = String(u.nombre).toLowerCase().trim();
      if (uNameLower.startsWith("coord") || uNameLower.includes("coordinador")) return false;
      const uRol = String(u.rol || "").toLowerCase();
      if (uRol === 'coordinador' || uRol === 'superadministrador' || uRol === 'admin') return false;

      const persDni = String(u.dni).trim();
      if (registeredDnis.has(persDni)) return false;
      
      const matchCoord = u.coordinadorNombre ? cleanStr(u.coordinadorNombre) === cleanStr(g.coordinadorNombre) : false;
      const matchLocal = (u.colegio || u.local) ? cleanStr(u.colegio || u.local) === cleanStr(g.local) : false;
      const matchDistrito = (u.ubicacion || u.distrito) ? cleanStr(u.ubicacion || u.distrito) === cleanStr(g.distrito) : true;

      if (matchCoord) return true;
      if (matchLocal && matchDistrito) return true;
      return false;
    }).slice(0, missingSlots);

    if (unregisteredUsuarios.length > 0) {
      if (missingListHtml) missingListHtml += `<div style="margin-top: 2px; border-top: 1px dashed rgba(239, 68, 68, 0.15); padding-top: 2px;"></div>`;
      missingListHtml += unregisteredUsuarios.map(u => `
        <div class="asistencia-alert-missing-item" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.73rem; padding: 2px 0;">
          <div>
            <strong style="color: #ef4444; font-size: 0.74rem;">${u.nombre}</strong> <span style="color: #ef4444; font-size: 0.7rem; opacity: 0.9;">(DNI: ${u.dni}${u.mesa ? ' · Mesa ' + u.mesa : ''})</span>
          </div>
          <span style="color: #ef4444; font-size: 0.68rem; font-weight: 600;">⏳ Faltante</span>
        </div>
      `).join("");
    }

    const unregRemaining = Math.max(0, missing - (g.missingPersoneros.length + unregisteredUsuarios.length));
    if (unregRemaining > 0) {
      if (missingListHtml) missingListHtml += `<div style="margin-top: 2px; border-top: 1px dashed rgba(239, 68, 68, 0.15); padding-top: 2px;"></div>`;
      missingListHtml += `
        <div class="asistencia-alert-missing-item" style="color: #ef4444; font-weight: 600; font-size: 0.72rem; padding: 2px 0; display: flex; align-items: center; gap: 6px;">
          <span>⏳</span>
          <span>${unregRemaining} ${unregRemaining === 1 ? 'mesa / personero pendiente' : 'mesas / personeros pendientes'} por registrar en la hoja Coordinadores</span>
        </div>
      `;
    }

    if (!missingListHtml) {
      missingListHtml = `<div style="font-size: 0.7rem; color: #10b981; font-style: italic; padding-left: 0.25rem; font-weight: 600;">Ninguno ausente (Asistencia 100%)</div>`;
    }

    return `
      <div class="asistencia-alert-card ${cardStatusClass}" style="width: 320px; min-width: 320px; flex-shrink: 0; box-sizing: border-box;">
        <div class="asistencia-alert-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
          <div style="flex: 1; min-width: 0;">
            <div class="asistencia-alert-card-coord" style="font-weight: 700; font-size: 0.95rem; color: var(--primary);">👤 Coordinador: ${g.coordinadorNombre}</div>
            <div class="asistencia-alert-card-local" style="font-size: 0.8rem; color: var(--text2);">🏫 Local: ${g.local} (${g.distrito})</div>
          </div>
          <!-- Badge Total -->
          <div style="display: flex; flex-direction: column; align-items: center; background: var(--surface2); border: 2px solid var(--border); border-radius: 10px; padding: 0.3rem 0.6rem; min-width: 56px; flex-shrink: 0;">
            <span style="font-size: 1.35rem; font-weight: 800; color: var(--primary); line-height: 1;">${total}</span>
            <span style="font-size: 0.6rem; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em;">Total Mesas</span>
          </div>
        </div>

        <!-- Contadores: Total → Confirmados → Por confirmar -->
        <div style="display: flex; gap: 0.5rem; margin: 0.6rem 0 0.3rem 0; justify-content: space-between;">
          <div style="flex: 1; text-align: center; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 0.35rem 0.25rem;">
            <div style="font-size: 1.2rem; font-weight: 800; color: #10b981; line-height: 1;">${present}</div>
            <div style="font-size: 0.62rem; color: #10b981; font-weight: 700; text-transform: uppercase;">✅ Personeros Asistieron</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text3); font-size: 1rem; font-weight: 700;">→</div>
          <div style="flex: 1; text-align: center; background: ${missing > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.06)'}; border: 1px solid ${missing > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.2)'}; border-radius: 8px; padding: 0.35rem 0.25rem;">
            <div style="font-size: 1.2rem; font-weight: 800; color: ${missing > 0 ? '#ef4444' : '#10b981'}; line-height: 1;">${missing}</div>
            <div style="font-size: 0.62rem; color: ${missing > 0 ? '#ef4444' : '#10b981'}; font-weight: 700; text-transform: uppercase;">${missing > 0 ? '⏳ Personeros Faltantes' : '🎉 Asistencia Completa'}</div>
          </div>
        </div>

        <!-- Botón Ver Más -->
        <button class="btn-secondary btn-sm" onclick="toggleAsistenciaCardDetails(this)" style="margin-top: 0.5rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.25rem; font-weight: 600; padding: 0.4rem 0; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface2); transition: background var(--transition);">
          👁️ Ver más
        </button>

        <!-- Contenido Desplegable -->
        <div class="asistencia-card-details">
          <div class="asistencia-alert-present-list" style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="font-size: 0.68rem; font-weight: 700; color: #10b981;">PERSONEROS CONFIRMADOS (${present} de ${total}):</div>
            ${attendedListHtml}
          </div>
          <div class="asistencia-alert-missing-list" style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.25rem;">
            <div class="asistencia-alert-missing-title" style="color: #ef4444; font-size: 0.68rem; font-weight: 700;">POR CONFIRMAR (${missing} restantes de ${total}):</div>
            ${missingListHtml}
          </div>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="asistencia-alerts-container" style="${anyAbsence && isPast7Am ? 'border: 1px solid #ef4444; background: var(--surface2);' : ''}">
      <div class="asistencia-alerts-header">
        <div class="asistencia-alerts-title" style="${anyAbsence && isPast7Am ? 'color: #ef4444;' : ''}">
          <span>📢 Control de Apertura de Mesas</span>
        </div>
        <div class="asistencia-alerts-time-badge ${timeBadgeClass}">
          ${timeBadgeText}
        </div>
      </div>
      
      <!-- Resumen General -->
      <div class="asistencia-alerts-summary-bar" style="background: var(--surface); border: 1px solid var(--border); margin: 0.5rem 0 1rem 0; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden;">
        <!-- Fila superior: título + cifras -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem;">
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 6px;">
            <span>📊</span> Resumen General de Mesas:
          </div>
          <div style="display: flex; gap: 1.25rem; font-size: 0.85rem; font-weight: 700; flex-wrap: wrap; align-items: center;">
            <span style="color: var(--text); background: var(--surface2); border: 2px solid var(--primary); border-radius: 8px; padding: 0.2rem 0.7rem;">Total Mesas: <strong style="font-size: 1.1rem; color: var(--primary);">${globalTotal}</strong></span>
            <span style="color: #10b981;">✅ Confirmadas: <strong style="font-size: 1rem;">${globalPresent}</strong> <span style="font-size: 0.8rem; font-weight: 500;">(${globalPresentPct}%)</span></span>
            <span style="color: ${globalMissing > 0 ? '#ef4444' : '#10b981'};">⏳ Por confirmar: <strong style="font-size: 1rem;">${globalMissing}</strong> <span style="font-size: 0.8rem; font-weight: 500;">(${globalMissingPct}%)</span></span>
          </div>
        </div>
        <!-- Barra de progreso global -->
        <div style="height: 8px; background: rgba(239,68,68,0.18); width: 100%;">
          <div style="height: 100%; width: ${globalPresentPct}%; background: linear-gradient(90deg, #10b981, #3fb7e2); border-radius: 0 4px 4px 0; transition: width 0.6s ease;"></div>
        </div>
        <!-- Fila inferior: cuenta regresiva textual -->
        <div style="padding: 0.4rem 1.25rem; font-size: 0.75rem; color: var(--text3); font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
          <span>🔢 Faltan aperturar/confirmar <strong style="color: ${globalMissing > 0 ? '#ef4444' : '#10b981'}; font-size: 0.9rem;">${globalMissing}</strong> de <strong style="color: var(--primary);">${globalTotal}</strong> mesas totales</span>
        </div>
      </div>

      <p style="font-size: 0.8rem; color: var(--text2); margin-bottom: 0.75rem;">
        Monitoreo en tiempo real de la apertura de mesas por coordinador.
      </p>
      <div class="asistencia-alerts-grid" id="asistenciaAlertsGrid" style="display: flex; flex-direction: column; flex-wrap: wrap; height: 660px; max-height: 660px; align-content: flex-start; gap: 0.75rem; overflow-x: auto; overflow-y: hidden; padding-bottom: 0.75rem; scroll-behavior: smooth;">
        ${cardsHtml}
      </div>
    </div>
  `;
}


/**
 * Aplicar filtros en cascada sobre los datos
 */
function applyAsistenciaFilters() {
  const filtered = getFilteredAsistenciaData();
  renderAsistenciaKPIs(filtered);
  renderAsistenciaAlerts(filtered);
  renderAsistenciaCharts(filtered);
  renderAsistenciaRecientes(filtered);
}

/**
 * Renderizar tarjetas de KPI
 */
function renderAsistenciaKPIs(data) {
  if (!data) data = getFilteredAsistenciaData();

  const totalEl = document.getElementById("asistKpiTotal");
  const confirmadosEl = document.getElementById("asistKpiConfirmados");
  const coordsFaltantesEl = document.getElementById("asistKpiCoordsFaltantes");
  const pctEl = document.getElementById("asistKpiPct");

  const labelTotal = document.querySelector("#view-asistencia .kpi-card-pro:nth-child(1) .kpi-card-label");
  const labelConfirmados = document.querySelector("#view-asistencia .kpi-card-pro:nth-child(2) .kpi-card-label");
  const labelCoordsFaltantes = document.querySelector("#view-asistencia .kpi-card-pro:nth-child(3) .kpi-card-label");
  const labelPct = document.querySelector("#view-asistencia .kpi-card-pro:nth-child(4) .kpi-card-label");

  if (labelTotal) labelTotal.textContent = "Total Mesas Esperadas";
  if (labelConfirmados) labelConfirmados.textContent = "Personas que Asistieron";
  if (labelCoordsFaltantes) labelCoordsFaltantes.textContent = "Coordinadores Faltantes";
  if (labelPct) labelPct.textContent = "% Asistencia";

  const isConfirmedStr = (cStr) => {
    const conf = String(cStr || "").toUpperCase().trim();
    return conf === "SI" || conf.includes("HTTP") || conf.includes("HYPERLINK") || conf.includes("FOTO") || conf.includes("CONFIRMADO") || conf.includes("PRESENTE") || conf.includes("LLEGO");
  };

  const filter = window.VR_FILTER || { level: 'lima' };
  const electoralTotal = getElectoralMesasCount(filter);
  const totalEsperados = electoralTotal > 0 ? electoralTotal : Math.max(data.length, (window.VR_USUARIOS_DATA || []).length);

  const attendedDnis = new Set();
  const reportedCoords = new Set();

  (data || []).forEach(item => {
    if (isConfirmedStr(item.confirmacion)) {
      const persDni = String(item.personeroDni || item.dni || item.id || item.personeroNombre || Math.random()).trim();
      attendedDnis.add(persDni);
      if (item.coordinadorNombre || item.coordinador) {
        reportedCoords.add(String(item.coordinadorNombre || item.coordinador).toLowerCase().trim());
      }
    }
  });

  const personasAsistieron = attendedDnis.size;
  const pct = totalEsperados > 0 ? Math.round((personasAsistieron / totalEsperados) * 100) : 0;

  // Calcular total de coordinadores esperados según la nómina o locales
  const allUsuarios = window.VR_USUARIOS_DATA || [];
  const cleanStr = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

  const coordsInUsers = allUsuarios.filter(u => {
    const uRol = String(u.rol || "").toLowerCase();
    const uName = String(u.nombre || "").toLowerCase();
    const isCoord = uRol === "coordinador" || uName.startsWith("coord");
    if (!isCoord) return false;

    if (filter.level === 'distrito' && filter.distrito) {
      return cleanStr(u.ubicacion || u.distrito) === cleanStr(filter.distrito);
    }
    if (filter.level === 'colegio' && filter.colegio) {
      return cleanStr(u.colegio || u.local) === cleanStr(filter.colegio);
    }
    return true;
  });

  const totalCoordsExpected = Math.max(coordsInUsers.length, (data ? new Set(data.map(d => cleanStr(d.coordinadorNombre || d.coordinador))).size : 0));
  const coordsFaltantes = Math.max(0, totalCoordsExpected - reportedCoords.size);

  if (totalEl) totalEl.textContent = totalEsperados.toLocaleString('es-PE');
  if (confirmadosEl) confirmadosEl.textContent = personasAsistieron.toLocaleString('es-PE');
  if (coordsFaltantesEl) coordsFaltantesEl.textContent = coordsFaltantes.toLocaleString('es-PE');
  if (pctEl) pctEl.textContent = pct + "%";
}

/**
 * Obtener colores según tema activo (oscuro/claro)
 */
function getChartThemeColors() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    text: isDark ? "#94a3b8" : "#374151",
    grid: isDark ? "#334155" : "#e5e7eb",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#d1d5db"
  };
}

/**
 * Dibujar diagramas usando Chart.js (1ª Asistencia y 2ª Asistencia)
 */
function renderAsistenciaCharts(data) {
  if (!data) data = getFilteredAsistenciaData();
  const colors = getChartThemeColors();

  const isConfirmedStr = (cStr) => {
    const conf = String(cStr || "").toUpperCase().trim();
    return conf === "SI" || conf.includes("HTTP") || conf.includes("HYPERLINK") || conf.includes("FOTO") || conf.includes("CONFIRMADO") || conf.includes("PRESENTE") || conf.includes("LLEGO");
  };

  const filter = window.VR_FILTER || { level: 'lima' };
  const totalEsperados = getElectoralMesasCount(filter) || data.length || 1;

  let confirmados1 = 0;
  let confirmados2 = 0;

  const distStats1 = {};
  const distStats2 = {};

  (data || []).forEach(item => {
    const dist = item.distrito || item.ubicacion || "Otros";
    const c1 = isConfirmedStr(item.confirmacion || item.confirmacion_1 || item.asistencia_1);
    const c2 = isConfirmedStr(item.confirmacion_2 || item.asistencia_2 || item.cierre);

    if (c1) {
      confirmados1++;
      distStats1[dist] = (distStats1[dist] || 0) + 1;
    }
    if (c2) {
      confirmados2++;
      distStats2[dist] = (distStats2[dist] || 0) + 1;
    }
  });

  const faltantes1 = Math.max(0, totalEsperados - confirmados1);
  const faltantes2 = Math.max(0, totalEsperados - confirmados2);

  // 1. 🌅 PRIMERA ASISTENCIA (DOUGHNUT)
  try {
    const ctx1 = document.getElementById("asistencia1DoughnutChart")?.getContext("2d");
    if (ctx1) {
      if (asist1DoughnutChartInstance) asist1DoughnutChartInstance.destroy();
      asist1DoughnutChartInstance = new Chart(ctx1, {
        type: "doughnut",
        data: {
          labels: ["Confirmados 1ª Asistencia", "Faltantes 1ª Asistencia"],
          datasets: [{
            data: [confirmados1, faltantes1],
            backgroundColor: ["#10b981", "#ef4444"],
            borderWidth: 2,
            borderColor: document.documentElement.getAttribute("data-theme") === "dark" ? "#1e293b" : "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: "bottom", labels: { color: colors.text } }
          },
          cutout: "65%"
        }
      });
    }
  } catch (err) { console.warn("Error asist1DoughnutChart:", err); }

  // 2. 🌅 PRIMERA ASISTENCIA POR DISTRITO (BAR)
  try {
    const ctxBar1 = document.getElementById("asistencia1BarChart")?.getContext("2d");
    if (ctxBar1) {
      if (asist1BarChartInstance) asist1BarChartInstance.destroy();
      const labels1 = Object.keys(distStats1).slice(0, 12);
      const values1 = labels1.map(k => distStats1[k]);
      asist1BarChartInstance = new Chart(ctxBar1, {
        type: "bar",
        data: {
          labels: labels1.length > 0 ? labels1 : ["Sin registros"],
          datasets: [{
            label: "Confirmados 1ª Asistencia",
            data: values1.length > 0 ? values1 : [0],
            backgroundColor: "#10b981",
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
            y: { ticks: { color: colors.text }, grid: { color: colors.grid } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  } catch (err) { console.warn("Error asist1BarChart:", err); }

  // 3. 🌆 SEGUNDA ASISTENCIA (DOUGHNUT)
  try {
    const ctx2 = document.getElementById("asistencia2DoughnutChart")?.getContext("2d");
    if (ctx2) {
      if (asist2DoughnutChartInstance) asist2DoughnutChartInstance.destroy();
      asist2DoughnutChartInstance = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: ["Confirmados 2ª Asistencia", "Faltantes 2ª Asistencia"],
          datasets: [{
            data: [confirmados2, faltantes2],
            backgroundColor: ["#3b82f6", "#f59e0b"],
            borderWidth: 2,
            borderColor: document.documentElement.getAttribute("data-theme") === "dark" ? "#1e293b" : "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: "bottom", labels: { color: colors.text } }
          },
          cutout: "65%"
        }
      });
    }
  } catch (err) { console.warn("Error asist2DoughnutChart:", err); }

  // 4. 🌆 SEGUNDA ASISTENCIA POR DISTRITO (BAR)
  try {
    const ctxBar2 = document.getElementById("asistencia2BarChart")?.getContext("2d");
    if (ctxBar2) {
      if (asist2BarChartInstance) asist2BarChartInstance.destroy();
      const labels2 = Object.keys(distStats2).slice(0, 12);
      const values2 = labels2.map(k => distStats2[k]);
      asist2BarChartInstance = new Chart(ctxBar2, {
        type: "bar",
        data: {
          labels: labels2.length > 0 ? labels2 : ["Sin registros"],
          datasets: [{
            label: "Confirmados 2ª Asistencia",
            data: values2.length > 0 ? values2 : [0],
            backgroundColor: "#3b82f6",
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
            y: { ticks: { color: colors.text }, grid: { color: colors.grid } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  } catch (err) { console.warn("Error asist2BarChart:", err); }

  // 5. 👤 DASHBOARD CIRCULAR COORDINADORES (DOUGHNUT)
  try {
    const ctxCoord = document.getElementById("coordDoughnutChart")?.getContext("2d");
    if (ctxCoord) {
      if (coordDoughnutChartInstance) coordDoughnutChartInstance.destroy();

      let totalExpected = getElectoralMesasCount(filter) || data.length || 1;
      let totalConfirmed = 0;
      (data || []).forEach(item => {
        if (isConfirmedStr(item.confirmacion || item.confirmacion_1 || item.asistencia_1)) {
          totalConfirmed++;
        }
      });
      let totalPending = Math.max(0, totalExpected - totalConfirmed);

      coordDoughnutChartInstance = new Chart(ctxCoord, {
        type: "doughnut",
        data: {
          labels: ["Mesas Aperturadas", "Mesas Pendientes"],
          datasets: [{
            data: [totalConfirmed, totalPending],
            backgroundColor: ["#10b981", "#ef4444"],
            borderWidth: 2,
            borderColor: document.documentElement.getAttribute("data-theme") === "dark" ? "#1e293b" : "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: "bottom", labels: { color: colors.text } }
          },
          cutout: "65%"
        }
      });
    }
  } catch (err) { console.warn("Error coordDoughnutChart:", err); }

  // 6. 👤 DASHBOARD BARRAS COORDINADORES (BAR)
  try {
    const ctxCoordBar = document.getElementById("coordBarChart")?.getContext("2d");
    if (ctxCoordBar) {
      if (coordBarChartInstance) coordBarChartInstance.destroy();

      const distCount = {};
      (data || []).forEach(item => {
        if (isConfirmedStr(item.confirmacion || item.confirmacion_1 || item.asistencia_1)) {
          const dist = item.distrito || item.ubicacion || "Otros";
          distCount[dist] = (distCount[dist] || 0) + 1;
        }
      });

      const labelsCoord = Object.keys(distCount).slice(0, 12);
      const valuesCoord = labelsCoord.map(k => distCount[k]);

      coordBarChartInstance = new Chart(ctxCoordBar, {
        type: "bar",
        data: {
          labels: labelsCoord.length > 0 ? labelsCoord : ["Sin registros"],
          datasets: [{
            label: "Mesas Aperturadas",
            data: valuesCoord.length > 0 ? valuesCoord : [0],
            backgroundColor: "#6366f1",
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
            y: { ticks: { color: colors.text }, grid: { color: colors.grid } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  } catch (err) { console.warn("Error coordBarChart:", err); }
}

/**
 * Renderizar la lista de actualizaciones más recientes (últimos 5 registros)
 */
function renderAsistenciaRecientes(data) {
  if (!data) data = getFilteredAsistenciaData();
  const container = document.getElementById("asistenciaRecientesList");
  if (!container) return;

  const recientes = [...data].reverse().slice(0, 5);

  if (recientes.length === 0) {
    container.innerHTML = `<div class="empty-state">No hay registros de actividad recientes.</div>`;
    return;
  }

  container.innerHTML = recientes.map(item => {
    const conf = String(item.confirmacion || "").trim();
    const fotoUrl = (conf.startsWith("http://") || conf.startsWith("https://")) ? conf : "";
    return `
      <div class="asistencia-activity-item si">
        <div class="activity-dot"></div>
        <div class="asistencia-activity-content">
          <div style="font-weight: 600; color: var(--text); display: flex; justify-content: space-between; align-items: center;">
            <span>${item.personeroNombre || "Personero sin nombre"} (${item.personeroDni || "S/DNI"})</span>
            ${fotoUrl ? `<a href="${fotoUrl}" target="_blank" style="color: #3fb7e2; text-decoration: none; font-size: 0.72rem; font-weight: 600; display: inline-flex; align-items: center; gap: 2px;">🖼️ Ver Foto</a>` : ''}
          </div>
          <div style="color: var(--text2); margin-top: 0.1rem;">
            Confirmación en ${item.distrito || "Distrito"} - Local: ${item.local || "Local"}
          </div>
          <div class="asistencia-activity-time">
            Coordinador: <strong>${item.coordinadorNombre || ""}</strong> · ${item.fechaHora || ""}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Hacer globales las funciones que lo requieran
window.syncAsistenciaData = syncAsistenciaData;
window.applyAsistenciaFilters = applyAsistenciaFilters;
window.initAsistenciaView = initAsistenciaView;
window.renderAsistenciaCharts = renderAsistenciaCharts;

function toggleAsistenciaCardDetails(btn) {
  const card = btn.closest(".asistencia-alert-card");
  const details = card.querySelector(".asistencia-card-details");
  const isOpen = details.classList.contains("open");
  
  if (!isOpen) {
    details.classList.add("open");
    btn.innerHTML = "👁️ Ver menos";
  } else {
    details.classList.remove("open");
    btn.innerHTML = "👁️ Ver más";
  }
}
window.toggleAsistenciaCardDetails = toggleAsistenciaCardDetails;

