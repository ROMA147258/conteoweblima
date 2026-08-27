import React, { useState, useEffect } from 'react';
import { coordinatorsService } from '../../services/coordinatorsService';
import { useFilters } from '../../context/FilterContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export const CoordinatorView = () => {
  const { filters } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCoord, setSelectedCoord] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await coordinatorsService.getCoordinators({
          distrito: filters.distrito,
          colegio: filters.colegio
        });
        setData(res);
      } catch (err) {
        console.error('Error cargando coordinadores:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filters.distrito, filters.colegio]);

  const kpis = data?.kpis || {
    totalMesasEsperadas: 0,
    personasQueAsistieron: 0,
    coordinadoresFaltantes: 0,
    porcentajeAsistencia: 0
  };

  const confirmadas = data?.totalConfirmadas ?? 0;
  const totalMesas = kpis.totalMesasEsperadas || 0;
  const porConfirmar = data?.totalPorConfirmar !== undefined ? data.totalPorConfirmar : Math.max(0, totalMesas - confirmadas);

  // Doughnut Chart Data (Apertura General)
  const doughnutData = {
    labels: ['Mesas Aperturadas', 'Mesas Pendientes'],
    datasets: [
      {
        data: [confirmadas, porConfirmar],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Bar Chart Data (Apertura por Distrito)
  const distritosCount = {};
  (data?.coordinadoresAgrupados || []).forEach(c => {
    if (c.distrito) {
      distritosCount[c.distrito] = (distritosCount[c.distrito] || 0) + (c.personerosAsistieron || 0);
    }
  });
  const barLabels = Object.keys(distritosCount).length > 0 ? Object.keys(distritosCount) : ['LIMA'];
  const barValues = Object.keys(distritosCount).length > 0 ? Object.values(distritosCount) : [confirmadas];

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Mesas aperturadas/confirmadas por distrito',
        data: barValues,
        backgroundColor: '#6366f1',
        borderRadius: 4
      }
    ]
  };

  return (
    <section className="view active" id="view-asistencia">
      <div className="view-header">
        <div>
          <h1 className="view-title">👤 Monitoreo de Coordinadores</h1>
          <p className="view-subtitle">Resumen de asistencia y control de apertura de mesas por coordinador</p>
        </div>
      </div>

      <div className="dashboard-scroll" style={{ overflowY: 'auto', flex: 1, padding: '0.875rem 1.25rem' }}>
        {/* KPI Row (4 Tarjetas) */}
        <div className="kpi-row-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="kpi-card-pro" style={{ '--kpi-color': '#1565c0', padding: '0.75rem 1rem' }}>
            <span className="kpi-icon">👥</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.totalMesasEsperadas.toLocaleString()}</span>
              <span className="kpi-card-label">TOTAL DE MESAS POR COORDINADOR</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#10b981', padding: '0.75rem 1rem' }}>
            <span className="kpi-icon">✅</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.personasQueAsistieron}</span>
              <span className="kpi-card-label">PERSONAS QUE ASISTIERON</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#f59e0b', padding: '0.75rem 1rem' }}>
            <span className="kpi-icon">👤</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.coordinadoresFaltantes}</span>
              <span className="kpi-card-label">COORDINADORES FALTANTES</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#8b5cf6', padding: '0.75rem 1rem' }}>
            <span className="kpi-icon">📈</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">
                {typeof kpis.porcentajeAsistencia === 'string' ? kpis.porcentajeAsistencia.replace('%', '') : kpis.porcentajeAsistencia}%
              </span>
              <span className="kpi-card-label">% ASISTENCIA</span>
            </div>
          </div>
        </div>

        {/* Card: Control de Apertura de Mesas */}
        <div className="dash-widget widget-full" style={{ marginBottom: '1.25rem', borderLeft: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🚨</span> Control de Apertura de Mesas
            </div>
            <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
              ⚠️ ALERTA: Pasadas las 07:00 AM
            </span>
          </div>

          <div style={{ background: 'var(--bg3)', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.76rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>📊 Resumen General de Mesas:</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span>Total Mesas: <strong>{totalMesas.toLocaleString()}</strong></span>
              <span style={{ color: '#10b981' }}>✅ Confirmadas: <strong>{confirmadas.toLocaleString()} ({totalMesas > 0 ? ((confirmadas / totalMesas) * 100).toFixed(1) : '0.0'}%)</strong></span>
              <span style={{ color: '#ef4444' }}>⏳ Por confirmar: <strong>{porConfirmar.toLocaleString()} ({totalMesas > 0 ? ((porConfirmar / totalMesas) * 100).toFixed(1) : '0.0'}%)</strong></span>
            </div>
          </div>

          {/* Grilla de Tarjetas de Coordinadores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
            {(data?.coordinadoresAgrupados || []).slice(0, 30).map((coord, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  padding: '0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.3rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                    👤 {coord.coordinadorNombre}
                  </div>
                  <span style={{ background: 'var(--bg3)', fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    {coord.totalMesas} MESAS
                  </span>
                </div>

                <div style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  🏫 {coord.local}
                </div>

                <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                  <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px', textAlign: 'center', fontSize: '0.62rem', fontWeight: 700 }}>
                    {coord.personerosAsistieron} ASIST.
                  </div>
                  <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '2px', textAlign: 'center', fontSize: '0.62rem', fontWeight: 700 }}>
                    {coord.personerosFaltantes} FALT.
                  </div>
                </div>

                <button
                  className="btn-secondary btn-sm"
                  style={{ width: '100%', fontSize: '0.65rem', padding: '0.25rem', marginTop: '0.2rem' }}
                  onClick={() => setSelectedCoord(coord)}
                >
                  👁 Ver más
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sección Inferior: Estado Global de Coordinadores y Mesas */}
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '1rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '16px', background: '#1565c0', borderRadius: '4px' }}></span>
          📊 Estado Global de Coordinadores y Mesas
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="dash-widget" style={{ height: '260px' }}>
            <div className="widget-header">
              <div>
                <h3 className="widget-title">Resumen General de Apertura</h3>
                <p className="widget-subtitle">Proporción de mesas aperturadas y pendientes</p>
              </div>
            </div>
            <div className="widget-chart" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="dash-widget" style={{ height: '260px' }}>
            <div className="widget-header">
              <div>
                <h3 className="widget-title">Apertura por Distrito</h3>
                <p className="widget-subtitle">Mesas aperturadas/confirmadas por distrito</p>
              </div>
            </div>
            <div className="widget-chart">
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Modal de Detalle de Coordinador */}
        {selectedCoord && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div
              className="dash-widget"
              style={{
                width: '500px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                overflowY: 'auto',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>👤 {selectedCoord.coordinadorNombre}</h3>
                <button className="btn-ghost" onClick={() => setSelectedCoord(null)}>✕</button>
              </div>

              <div style={{ margin: '0.5rem 0', fontSize: '0.78rem' }}>
                <div><strong>Local:</strong> {selectedCoord.local}</div>
                <div><strong>Distrito:</strong> {selectedCoord.distrito}</div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.8rem', marginTop: '0.75rem', marginBottom: '0.4rem' }}>
                Personeros Asignados ({selectedCoord.personeros.length}):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {selectedCoord.personeros.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg3)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.74rem'
                    }}
                  >
                    <div>
                      <strong>{p.nombre}</strong> (DNI: {p.dni || '—'})
                      <div style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>Mesa: {p.mesa || '—'}</div>
                    </div>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        background: (p.confirmacion === 'SI' || p.confirmacion === 'CONFIRMADO') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: (p.confirmacion === 'SI' || p.confirmacion === 'CONFIRMADO') ? '#10b981' : '#ef4444'
                      }}
                    >
                      {p.confirmacion || 'PENDIENTE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CoordinatorView;
