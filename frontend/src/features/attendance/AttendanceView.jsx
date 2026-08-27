import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { useFilters } from '../../context/FilterContext';
import { ALL_DISTRITOS } from '../../constants/locations';
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

export const AttendanceView = () => {
  const { filters } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros locales para la tabla de personeros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await attendanceService.getAttendance({
          distrito: filters.distrito,
          local: filters.colegio
        });
        setData(res);
      } catch (err) {
        console.error('Error cargando asistencia:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filters.distrito, filters.colegio]);

  const kpis = data?.kpis || {
    totalPersonerosRegistrados: 0,
    primeraAsistencia: 0,
    segundaAsistencia: 0,
    distritosConReporte: 0
  };

  const conf1 = data?.charts?.conf1Global?.confirmados || 0;
  const falt1 = data?.charts?.conf1Global?.faltantes || 0;

  const conf2 = data?.charts?.conf2Global?.confirmados || 0;
  const falt2 = data?.charts?.conf2Global?.faltantes || 0;

  // Donut 1ª Asistencia (Apertura / Foto)
  const doughnut1Data = {
    labels: ['Confirmados 1ª Asist.', 'Faltantes 1ª Asist.'],
    datasets: [
      {
        data: [conf1, Math.max(0, falt1)],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Bar 1ª Asistencia por Distrito
  const distEntries1 = Object.entries(data?.charts?.conf1PorDistrito || {});
  const bar1Data = {
    labels: distEntries1.length > 0 ? distEntries1.map(([k]) => k) : ['Sin registros'],
    datasets: [
      {
        label: '1ª Asistencia por distrito',
        data: distEntries1.length > 0 ? distEntries1.map(([, v]) => v) : [0],
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ]
  };

  // Donut 2ª Asistencia (Llegada con GPS)
  const doughnut2Data = {
    labels: ['Confirmados 2ª Asist.', 'Faltantes 2ª Asist.'],
    datasets: [
      {
        data: [conf2, Math.max(0, falt2)],
        backgroundColor: ['#3b82f6', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };

  // Bar 2ª Asistencia por Distrito
  const distEntries2 = Object.entries(data?.charts?.conf2PorDistrito || {});
  const bar2Data = {
    labels: distEntries2.length > 0 ? distEntries2.map(([k]) => k) : ['Sin registros'],
    datasets: [
      {
        label: '2ª Asistencia por distrito',
        data: distEntries2.length > 0 ? distEntries2.map(([, v]) => v) : [0],
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: { size: 11 },
          color: '#94a3b8'
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(100, 116, 139, 0.1)' },
        ticks: { font: { size: 10 }, color: '#94a3b8', stepSize: 1 }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      }
    }
  };

  // Filtrado de personeros en la tabla
  const personerosList = data?.registros || [];
  const filteredPersoneros = personerosList.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.dni || '').toLowerCase().includes(term) ||
      (p.local || '').toLowerCase().includes(term) ||
      (p.mesa || '').toLowerCase().includes(term) ||
      (p.distrito || '').toLowerCase().includes(term);

    if (!matchSearch) return false;

    const isConf1 = p.confirmacion1 === 'CONFIRMADO' || p.confirmacion === 'SI';
    const isConf2 = p.confirmacion2 === 'CONFIRMADO';

    if (statusFilter === 'conf1') return isConf1;
    if (statusFilter === 'conf2') return isConf2;
    if (statusFilter === 'ambas') return isConf1 && isConf2;
    if (statusFilter === 'pendientes') return !isConf1 && !isConf2;

    return true;
  });

  return (
    <section className="view active" id="view-apertura">
      <div className="view-header">
        <div>
          <h1 className="view-title">👥 Monitoreo de Personeros y Asistencia</h1>
          <p className="view-subtitle">
            Control de 1ª Asistencia (Confirmación y Foto) y 2ª Asistencia (Llegada con GPS) sincronizado en tiempo real
          </p>
        </div>
      </div>

      <div className="dashboard-scroll" style={{ overflowY: 'auto', flex: 1, padding: '0.875rem 1.25rem' }}>
        {/* KPI Row (4 Tarjetas) */}
        <div className="kpi-row-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="kpi-card-pro" style={{ '--kpi-color': '#1565c0', padding: '0.85rem 1rem' }}>
            <span className="kpi-icon">👥</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.totalPersonerosRegistrados.toLocaleString()}</span>
              <span className="kpi-card-label">TOTAL DE PERSONEROS</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#10b981', padding: '0.85rem 1rem' }}>
            <span className="kpi-icon">🌅</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.primeraAsistencia.toLocaleString()}</span>
              <span className="kpi-card-label">1ª ASISTENCIA (FOTO)</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#3b82f6', padding: '0.85rem 1rem' }}>
            <span className="kpi-icon">📍</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.segundaAsistencia.toLocaleString()}</span>
              <span className="kpi-card-label">2ª ASISTENCIA (GPS)</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#8b5cf6', padding: '0.85rem 1rem' }}>
            <span className="kpi-icon">🏛️</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.distritosConReporte.toLocaleString()}</span>
              <span className="kpi-card-label">DISTRITOS CON REPORTE</span>
            </div>
          </div>
        </div>

        {/* Grilla Simétrica de 4 Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {/* 1. 1ª Conf. Global (Foto) */}
          <div className="dash-widget" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ color: '#10b981', fontSize: '0.85rem' }}>🌅 1ª Conf. Global</h3>
                <p className="widget-subtitle">Confirmación con Foto</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0.25rem' }}>
              <Doughnut data={doughnut1Data} options={donutOptions} />
            </div>
          </div>

          {/* 2. 1ª por Distrito */}
          <div className="dash-widget" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ fontSize: '0.85rem' }}>🌅 1ª por Distrito</h3>
                <p className="widget-subtitle">Fotos recibidas</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, minHeight: 0, padding: '0.25rem' }}>
              <Bar data={bar1Data} options={barOptions} />
            </div>
          </div>

          {/* 3. 2ª Conf. Global (GPS) */}
          <div className="dash-widget" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>📍 2ª Conf. Global</h3>
                <p className="widget-subtitle">Llegada con GPS</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0.25rem' }}>
              <Doughnut data={doughnut2Data} options={donutOptions} />
            </div>
          </div>

          {/* 4. 2ª por Distrito */}
          <div className="dash-widget" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ fontSize: '0.85rem' }}>📍 2ª por Distrito</h3>
                <p className="widget-subtitle">Llegadas GPS por distrito</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, minHeight: 0, padding: '0.25rem' }}>
              <Bar data={bar2Data} options={barOptions} />
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Asistencia de Personeros */}
        <div className="dash-widget" style={{ padding: '1rem', minHeight: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                📋 Detalle de Personeros y Estado de Confirmación ({filteredPersoneros.length})
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text3)', margin: 0 }}>
                Seguimiento individual de 1ª Asistencia (Foto) y 2ª Asistencia (GPS)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, DNI, mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  minWidth: '220px'
                }}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }}
              >
                <option value="todos">Todos los Estados</option>
                <option value="conf1">Solo 1ª Conf. (Foto)</option>
                <option value="conf2">Solo 2ª Conf. (GPS)</option>
                <option value="ambas">Ambas Confirmadas</option>
                <option value="pendientes">Pendientes</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Personero</th>
                  <th style={{ padding: '8px 10px' }}>DNI / Celular</th>
                  <th style={{ padding: '8px 10px' }}>Distrito</th>
                  <th style={{ padding: '8px 10px' }}>Local de Votación</th>
                  <th style={{ padding: '8px 10px' }}>Mesa</th>
                  <th style={{ padding: '8px 10px' }}>1ª Conf. (Foto)</th>
                  <th style={{ padding: '8px 10px' }}>2ª Conf. (GPS)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersoneros.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>
                      No se encontraron personeros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredPersoneros.map((p, idx) => {
                    const isConf1 = p.confirmacion1 === 'CONFIRMADO' || p.confirmacion === 'SI';
                    const isConf2 = p.confirmacion2 === 'CONFIRMADO';

                    return (
                      <tr key={p.dni || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                          {p.nombre || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text2)' }}>
                          <div><strong>{p.dni || '—'}</strong></div>
                          {p.celular && <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>📞 {p.celular}</div>}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                            {p.distrito || 'LIMA'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.local}>
                          {p.local || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--primary)' }}>
                          {p.mesa || '—'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {isConf1 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                                ✓ CONFIRMADO
                              </span>
                              {p.foto && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhoto({ foto: p.foto, nombre: p.nombre, dni: p.dni })}
                                  style={{
                                    background: 'var(--bg3)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.68rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  📷 Foto
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>
                              ⏳ PENDIENTE
                            </span>
                          )}
                          {p.fechaHora1 && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '2px' }}>
                              {new Date(p.fechaHora1).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {isConf2 ? (
                            <div>
                              <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                                📍 LLEGÓ (GPS)
                              </span>
                              {p.ubicacionGps && (
                                <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '2px' }}>
                                  🛰️ {p.ubicacionGps}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>
                              ⏳ PENDIENTE
                            </span>
                          )}
                          {p.fechaHora2 && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '2px' }}>
                              {new Date(p.fechaHora2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para ver foto de asistencia */}
      {selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '8px',
              padding: '1.25rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>📷 Foto de Asistencia - 1ª Confirmación</h3>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text2)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text2)' }}>
              <strong>{selectedPhoto.nombre}</strong> (DNI: {selectedPhoto.dni})
            </p>
            <div style={{ maxHeight: '350px', overflow: 'hidden', borderRadius: '6px', textAlign: 'center' }}>
              <img
                src={selectedPhoto.foto}
                alt="Foto de asistencia"
                style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '6px' }}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedPhoto(null)}
                style={{ padding: '6px 16px', fontSize: '0.82rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AttendanceView;
