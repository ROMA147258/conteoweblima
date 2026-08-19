import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFilters } from '../context/FilterContext';
import { exportUtils } from '../utils/exportUtils';

export const TopBar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { filters } = useFilters();
  const [exportOpen, setExportOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const breadcrumbText = filters.distrito
    ? `LIMA / ${filters.distrito.toUpperCase()}${filters.colegio ? ` / ${filters.colegio}` : ''}`
    : 'LIMA';

  const handleExport = (type) => {
    setExportOpen(false);
    if (type === 'png') {
      exportUtils.exportPNG('dashboardContent', 'votoreal_dashboard.png');
    } else if (type === 'excel') {
      exportUtils.exportExcel([{ Fecha: new Date().toLocaleString(), Zona: breadcrumbText }], 'votoreal_reporte.xlsx');
    } else if (type === 'csv') {
      exportUtils.exportCSV([{ Fecha: new Date().toLocaleString(), Zona: breadcrumbText }], 'votoreal_reporte.csv');
    } else if (type === 'pdf') {
      exportUtils.exportPDF('Reporte Voto Real Lima', ['Fecha', 'Zona'], [[new Date().toLocaleString(), breadcrumbText]]);
    }
  };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '1rem', marginRight: '0.75rem' }}>lima</span>
        <div className="breadcrumb">
          <span className="bc-item active">{breadcrumbText}</span>
        </div>
      </div>

      <div className="top-bar-right">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
          {theme === 'light' ? '☀️' : '🌙'}
        </button>

        <div className="activity-dropdown-wrap" style={{ position: 'relative' }}>
          <button
            className="theme-toggle-btn"
            onClick={() => setActivityOpen(!activityOpen)}
            title="Actividad reciente"
          >
            🕐
          </button>
          {activityOpen && (
            <div
              className="export-menu open"
              style={{ minWidth: '220px', padding: '0.75rem' }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.3rem' }}>
                Actividad Reciente
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                Sincronización en tiempo real activa.
              </div>
            </div>
          )}
        </div>

        <div className="export-dropdown">
          <button className="btn-secondary btn-sm" onClick={() => setExportOpen(!exportOpen)}>
            ⬇ Exportar
          </button>
          {exportOpen && (
            <div className="export-menu open">
              <button onClick={() => handleExport('pdf')}>📄 PDF</button>
              <button onClick={() => handleExport('excel')}>📊 Excel</button>
              <button onClick={() => handleExport('csv')}>📋 CSV</button>
              <button onClick={() => handleExport('png')}>🖼 PNG</button>
            </div>
          )}
        </div>

        <div className="user-chip">
          <div className="user-avatar">{user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'A'}</div>
          <strong>{user?.nombre || 'Administrador'}</strong>
        </div>

        <button className="btn-logout" onClick={logout} title="Cerrar sesión">
          Salir
        </button>
      </div>
    </div>
  );
};
