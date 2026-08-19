// ── ACTIVIDAD E HISTORIAL ──
const ActivityLog = {
  entries: [],

  init() {
    try {
      this.entries = JSON.parse(localStorage.getItem('vr_activity') || '[]');
    } catch (_) { this.entries = []; }
    this.render();
  },

  add(action, detail) {
    const user = localStorage.getItem('vr_user') || 'Administrador';
    this.entries.unshift({
      id: Date.now(),
      action,
      detail,
      user,
      time: new Date().toISOString()
    });
    if (this.entries.length > 100) this.entries = this.entries.slice(0, 100);
    localStorage.setItem('vr_activity', JSON.stringify(this.entries));
    this.render();
  },

  render() {
    const panel = document.getElementById('activityPanel');
    if (!panel) return;

    panel.innerHTML = this.entries.slice(0, 20).map(e => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <strong>${e.action}</strong>
          <span>${e.detail || ''}</span>
          <time>${this.formatTime(e.time)}</time>
        </div>
      </div>`).join('') || '<p class="empty-state">Sin actividad reciente</p>';

    const badge = document.getElementById('activityBadge');
    if (badge) badge.textContent = Math.min(this.entries.length, 99) || '';
    if (badge) badge.style.display = this.entries.length > 0 ? 'flex' : 'none';
  },

  formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    return d.toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  },

  clear() {
    if (confirm('¿Limpiar historial de actividad?')) {
      this.entries = [];
      localStorage.removeItem('vr_activity');
      this.render();
    }
  }
};

const Favorites = {
  items: [],

  init() {
    try { this.items = JSON.parse(localStorage.getItem('vr_favorites') || '[]'); } catch (_) { this.items = []; }
    this.render();
  },

  saveCurrent(name) {
    const fav = {
      id: Date.now(),
      name: name || `Dashboard ${new Date().toLocaleDateString()}`,
      layout: JSON.parse(JSON.stringify(DashboardCore.widgets)),
      filter: { ...window.VR_FILTER },
      created: new Date().toISOString()
    };
    this.items.unshift(fav);
    localStorage.setItem('vr_favorites', JSON.stringify(this.items));
    this.render();
    showToast('Dashboard guardado en favoritos', 'success');
    ActivityLog.add('Favorito creado', fav.name);
  },

  load(id) {
    const fav = this.items.find(f => f.id === id);
    if (!fav) return;
    DashboardCore.widgets = fav.layout;
    DashboardCore.save();
    if (fav.filter) window.VR_FILTER = fav.filter;
    buildDashboard();
    showToast(`Favorito "${fav.name}" cargado`, 'success');
    ActivityLog.add('Favorito cargado', fav.name);
  },

  remove(id) {
    this.items = this.items.filter(f => f.id !== id);
    localStorage.setItem('vr_favorites', JSON.stringify(this.items));
    this.render();
  },

  render() {
    const el = document.getElementById('favoritesList');
    if (!el) return;
    el.innerHTML = this.items.map(f => `
      <div class="fav-item">
        <div class="fav-info"><strong>${f.name}</strong><span>${new Date(f.created).toLocaleDateString('es-PE')}</span></div>
        <div class="fav-actions">
          <button onclick="Favorites.load(${f.id})" class="btn-sm btn-primary">Cargar</button>
          <button onclick="Favorites.remove(${f.id})" class="btn-sm btn-ghost">✕</button>
        </div>
      </div>`).join('') || '<p class="empty-state">No hay favoritos guardados</p>';
  }
};

const Templates = {
  presets: [
    { id: 'executive', name: 'Ejecutivo', desc: 'KPIs y resumen para directivos', widgets: ['w-kpi-main', 'w-total', 'w-dona', 'w-gauge'] },
    { id: 'analyst', name: 'Analista', desc: 'Gráficos detallados y comparativos', widgets: ['w-distrito', 'w-linea', 'w-radar', 'w-heatmap'] },
    { id: 'full', name: 'Completo', desc: 'Todos los widgets visibles', widgets: DEFAULT_WIDGETS.map(w => w.id) }
  ],

  apply(id) {
    const preset = this.presets.find(p => p.id === id);
    if (!preset) return;
    DashboardCore.widgets.forEach(w => { w.visible = preset.widgets.includes(w.id); });
    DashboardCore.save();
    buildDashboard();
    showToast(`Plantilla "${preset.name}" aplicada`, 'success');
    ActivityLog.add('Plantilla aplicada', preset.name);
  },

  render() {
    const el = document.getElementById('templatesList');
    if (!el) return;
    el.innerHTML = this.presets.map(p => `
      <div class="template-card">
        <div class="template-icon">${p.name.charAt(0)}</div>
        <div class="template-info"><strong>${p.name}</strong><span>${p.desc}</span></div>
        <button onclick="Templates.apply('${p.id}')" class="btn-sm btn-primary">Aplicar</button>
      </div>`).join('');
  }
};

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function promptFavorite() {
  const name = prompt('Nombre del favorito:', `Dashboard ${new Date().toLocaleDateString()}`);
  if (name) Favorites.saveCurrent(name);
}

function toggleActivityPanel() {
  const panel = document.getElementById('activityDropdown');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  if (isOpen) ActivityLog.render();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.activity-dropdown-wrap')) {
    document.getElementById('activityDropdown')?.classList.remove('open');
  }
});
