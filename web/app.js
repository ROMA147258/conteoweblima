// ── APP PRINCIPAL ──
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');

  const navMap = {
    dashboard: 'nav-dashboard',
    mapa: 'nav-mapa',
    analytics: 'nav-analytics',
    comparacion: 'nav-comparacion',
    asistencia: 'nav-asistencia',
    apertura: 'nav-apertura',
    configuracion: 'nav-configuracion',
    'config-sincronizacion': 'nav-configuracion',
    'config-edit-dashboard': 'nav-configuracion',
    'config-edit-diagramas': 'nav-configuracion',
  };
  const navId = navMap[name];
  if (navId) document.getElementById(navId)?.classList.add('active');

  const filtersEl = document.getElementById('globalFilters');
  if (filtersEl) {
    if (name === 'configuracion' || name.startsWith('config-')) {
      filtersEl.style.display = 'none';
    } else {
      filtersEl.style.display = ''; // Default display style
    }
  }

  if (name === 'apertura') {
    setTimeout(async () => {
      if (typeof initPersonerosView === 'function') {
        await initPersonerosView();
      }
      if (typeof applyPersonerosFilters === 'function') {
        applyPersonerosFilters();
      }
    }, 30);
  }

  if (name === 'asistencia') {
    setTimeout(async () => {
      if (typeof initAsistenciaView === 'function') {
        await initAsistenciaView();
      }
      if (typeof applyAsistenciaFilters === 'function') {
        applyAsistenciaFilters();
      }
    }, 30);
  }

  if (name === 'mapa') {
    setTimeout(() => { initMap(); leafletMap && leafletMap.invalidateSize(); highlightMapForFilter(); }, 50);
  }
  if (name === 'dashboard') {
    setTimeout(() => buildDashboard(), 30);
  }
  if (name === 'config-sincronizacion') {
    loadSheetConfigUI();
  }
  if (name === 'config-edit-dashboard') {
    setTimeout(() => buildEditDashboard(), 30);
  }
  if (name === 'config-edit-diagramas') {
    setTimeout(() => buildEditDiagramas(), 30);
  }
  if (name === 'analytics') {
    setTimeout(() => refreshAnalytics(), 30);
  }
  if (name === 'comparacion') {
    Comparison.init();
    setTimeout(() => refreshComparison(), 30);
  }

  if (typeof LocationFilters !== 'undefined') {
    LocationFilters.updateFilterModeHint();
  }

  document.querySelector('.sidebar')?.classList.remove('open');
}

function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  saveConfig({ theme });

  refreshActiveDashboardViews();
  const analyticsView = document.getElementById('view-analytics');
  if (analyticsView?.classList.contains('active')) refreshAnalytics();
  const compareView = document.getElementById('view-comparacion');
  if (compareView?.classList.contains('active')) refreshComparison();
  const asistView = document.getElementById('view-asistencia');
  const apertView = document.getElementById('view-apertura');
  if ((asistView?.classList.contains('active') || apertView?.classList.contains('active')) && typeof renderAsistenciaCharts === 'function') renderAsistenciaCharts();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('vr_theme', theme);
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.checked = (theme === 'dark');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function toggleExportMenu() {
  document.getElementById('exportMenu')?.classList.toggle('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.export-dropdown')) {
    document.getElementById('exportMenu')?.classList.remove('open');
  }
});

function doLogout() {
  localStorage.removeItem('vr_token');
  localStorage.removeItem('vr_user');
  window.location.href = window.location.protocol === 'file:' ? 'login.html' : '/';
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    if (cfg.googleSheetUrl) {
      const el = document.getElementById('configSheetUrl') || document.getElementById('sheetUrl');
      if (el) el.value = cfg.googleSheetUrl;
    }
    if (cfg.theme) applyTheme(cfg.theme);
    else applyTheme(localStorage.getItem('vr_theme') || 'light');
    if (cfg.dashboardLayout?.length) {
      DashboardCore.widgets = cfg.dashboardLayout;
      localStorage.setItem('vr_dashboard_layout', JSON.stringify(cfg.dashboardLayout));
    }
    return cfg;
  } catch (_) {
    applyTheme(localStorage.getItem('vr_theme') || 'light');
    return {};
  }
}

async function saveConfig(partial) {
  try {
    const res = await fetch('/api/config');
    const current = await res.json();
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...current, ...partial })
    });
  } catch (_) { /* offline */ }
}

function toggleSidebarMinimize() {
  const sidebar = document.getElementById('sidebar');
  const main = document.querySelector('.main-content');
  if (sidebar && main) {
    sidebar.classList.toggle('minimized');
    main.classList.toggle('sidebar-minimized');
    const isMinimized = sidebar.classList.contains('minimized');
    localStorage.setItem('sidebar_minimized', isMinimized ? 'true' : 'false');
    const icon = document.getElementById('minimizeIcon');
    if (icon) {
      icon.innerHTML = isMinimized
        ? '<polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>'
        : '<polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>';
    }
    setTimeout(() => {
      if (typeof leafletMap !== 'undefined' && leafletMap) leafletMap.invalidateSize();
      DashboardCore.resizeAllCharts();
    }, 320);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('vr_token')) {
    window.location.href = '/';
    return;
  }

  const wasMinimized = localStorage.getItem('sidebar_minimized') === 'true';
  if (wasMinimized) {
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main-content');
    if (sidebar && main) {
      sidebar.classList.add('minimized');
      main.classList.add('sidebar-minimized');
      const icon = document.getElementById('minimizeIcon');
      if (icon) {
        icon.innerHTML = '<polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>';
      }
    }
  }

  ensureDistrictData();
  const sqlApiUrl = '/api/voto-real';

  window.VR_SQL_API_URL = sqlApiUrl;
  window.VR_FILTER = { level: 'lima' };

  const triggerSync = () => {
    syncFromGoogleSheet(sqlApiUrl).then(() => {
      if (typeof DashboardCore !== 'undefined') DashboardCore.renderAll();
      if (typeof updateKPIs === 'function') updateKPIs();
    }).catch((e) => console.warn('syncFromGoogleSheet catch:', e));
  };

  loadConfig().then(() => {
    triggerSync();
  });

  // Sincronización en vivo periódica con SQL Server (cada 10 segundos)
  setInterval(() => {
    triggerSync();
  }, 10000);

  LocationFilters.init();
  DashboardCore.init();
  ActivityLog.init();
  Favorites.init();
  Templates.render();
  updateKPIs();
  switchView('dashboard');
  ActivityLog.add('Sesión iniciada', localStorage.getItem('vr_user') || 'Administrador');
});
