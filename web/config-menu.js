// ── MENÚ DESPLEGABLE DE CONFIGURACIÓN ──

const CONFIG_ROUTES = {
  sincronizacion: 'config-sincronizacion',
  'edit-dashboard': 'config-edit-dashboard',
  'edit-diagramas': 'config-edit-diagramas',
};

function toggleConfigMenu(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('configMenuPopup')?.classList.toggle('open');
}

function closeConfigMenu() {
  document.getElementById('configMenuPopup')?.classList.remove('open');
}

function openConfigSection(section) {
  closeConfigMenu();
  const route = CONFIG_ROUTES[section];
  if (route) switchView(route);
}

document.addEventListener('click', e => {
  if (!e.target.closest('.config-menu-wrap')) closeConfigMenu();
});
