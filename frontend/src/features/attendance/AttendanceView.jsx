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
    const isMan = p.envioManual === 'ENVIADO';
    const isImg = p.envioImagen === 'ENVIADO';
    const isAmbos = isMan && isImg;

    if (statusFilter === 'conf1') return isConf1;
    if (statusFilter === 'conf2') return isConf2;
    if (statusFilter === 'ambas') return isConf1 && isConf2;
    if (statusFilter === 'pendientes_asistencia') return !isConf1 && !isConf2;
    if (statusFilter === 'manual') return isMan;
    if (statusFilter === 'imagen') return isImg;
    if (statusFilter === 'ambos_envios') return isAmbos;
    if (statusFilter === 'solo_manual') return isMan && !isImg;
    if (statusFilter === 'solo_imagen') return !isMan && isImg;
    if (statusFilter === 'sin_envio') return !isMan && !isImg;

    return true;
  });

  const formatHora = (fStr) => {
    if (!fStr) return '';
    try {
      const d = new Date(fStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  const handleWhatsApp = (p) => {
    const phone = (p.celular || '').replace(/\D/g, '');
    if (!phone) {
      alert(`El personero ${p.nombre} no tiene número de celular registrado.`);
      return;
    }
    const cleanPhone = phone.length === 9 ? `51${phone}` : phone;
    let msg = `Hola ${p.nombre}, te saludamos del equipo electoral. `;
    if (p.estadoEnvio === 'SIN_ENVIO') {
      msg += `Recordatorio para tu mesa ${p.mesa || 'asignada'}: Recuerda registrar los resultados por el formulario manual y subir la foto del acta.`;
    } else if (p.estadoEnvio === 'SOLO_MANUAL') {
      msg += `Recibimos tu conteo manual para la mesa ${p.mesa || 'asignada'}. Recuerda subir también la foto del acta por la app para validar.`;
    } else if (p.estadoEnvio === 'SOLO_IMAGEN') {
      msg += `Recibimos la foto del acta para la mesa ${p.mesa || 'asignada'}. Recuerda registrar también los votos de conteo manual.`;
    } else {
      msg += `¡Tus actas de la mesa ${p.mesa || 'asignada'} han sido recibidas exitosamente tanto en manual como en imagen!`;
    }
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section className="view active" id="view-apertura">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 className="view-title">👥 Monitoreo de Personeros, Asistencia y Envíos de Actas</h1>
          <p className="view-subtitle">
            Control de 1ª/2ª Asistencia y estado de transmisión: <strong>Conteo Manual 📝</strong> e <strong>Imagen / OCR 📸</strong>
          </p>
        </div>
      </div>

      <div className="dashboard-scroll" style={{ overflowY: 'auto', flex: 1, padding: '0.875rem 1.25rem' }}>
        {/* KPI Row (6 Tarjetas Informativas y Clicables) */}
        <div className="kpi-row-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#1565c0', padding: '0.75rem 0.85rem', cursor: 'pointer', border: statusFilter === 'todos' ? '2px solid #1565c0' : '1px solid var(--border)' }}
            onClick={() => setStatusFilter('todos')}
          >
            <span className="kpi-icon">👥</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.totalPersonerosRegistrados.toLocaleString()}</span>
              <span className="kpi-card-label">TOTAL PERSONEROS</span>
            </div>
          </div>

          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#059669', padding: '0.75rem 0.85rem', cursor: 'pointer', border: statusFilter === 'conf1' ? '2px solid #059669' : '1px solid var(--border)' }}
            onClick={() => setStatusFilter('conf1')}
          >
            <span className="kpi-icon">🌅</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.primeraAsistencia.toLocaleString()}</span>
              <span className="kpi-card-label">1ª ASIST. (FOTO)</span>
            </div>
          </div>

          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#0284c7', padding: '0.75rem 0.85rem', cursor: 'pointer', border: statusFilter === 'conf2' ? '2px solid #0284c7' : '1px solid var(--border)' }}
            onClick={() => setStatusFilter('conf2')}
          >
            <span className="kpi-icon">📍</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.segundaAsistencia.toLocaleString()}</span>
              <span className="kpi-card-label">2ª ASIST. (GPS)</span>
            </div>
          </div>

          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#10b981', padding: '0.75rem 0.85rem', cursor: 'pointer', border: statusFilter === 'ambos_envios' ? '2px solid #10b981' : '1px solid var(--border)', background: statusFilter === 'ambos_envios' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface)' }}
            onClick={() => setStatusFilter('ambos_envios')}
          >
            <span className="kpi-icon">✅</span>
            <div className="kpi-meta">
              <span className="kpi-card-value" style={{ color: '#10b981' }}>{(kpis.enviosAmbos || 0).toLocaleString()}</span>
              <span className="kpi-card-label">AMBOS ENVÍOS (2/2)</span>
            </div>
          </div>

          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#f59e0b', padding: '0.75rem 0.85rem', cursor: 'pointer', border: statusFilter === 'manual' ? '2px solid #f59e0b' : '1px solid var(--border)' }}
            onClick={() => setStatusFilter('manual')}
          >
            <span className="kpi-icon">📝</span>
            <div className="kpi-meta">
              <span className="kpi-card-value" style={{ color: '#f59e0b' }}>{(kpis.enviosManual || 0).toLocaleString()}</span>
              <span className="kpi-card-label">ENVÍO MANUAL</span>
            </div>
          </div>

          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#3b82f6', padding: '0.75rem 0.85rem', cursor: 'pointer', border: statusFilter === 'imagen' ? '2px solid #3b82f6' : '1px solid var(--border)' }}
            onClick={() => setStatusFilter('imagen')}
          >
            <span className="kpi-icon">📸</span>
            <div className="kpi-meta">
              <span className="kpi-card-value" style={{ color: '#3b82f6' }}>{(kpis.enviosImagen || 0).toLocaleString()}</span>
              <span className="kpi-card-label">ENVÍO FOTO / OCR</span>
            </div>
          </div>
        </div>

        {/* Grilla Simétrica de 4 Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {/* 1. 1ª Conf. Global (Foto) */}
          <div className="dash-widget" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
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
          <div className="dash-widget" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
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
          <div className="dash-widget" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
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
          <div className="dash-widget" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
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

        {/* Tabla Detallada de Personeros con Asistencia y Envíos (Manual + Imagen) */}
        <div className="dash-widget" style={{ padding: '1rem', minHeight: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                📋 Detalle de Personeros: Asistencia y Envíos de Actas ({filteredPersoneros.length})
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text3)', margin: 0 }}>
                Seguimiento en vivo: Asistencia (Foto/GPS) + Envío Manual 📝 + Envío Imagen 📸
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, DNI, mesa, local..."
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
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <option value="todos">Todos los Personeros</option>
                <optgroup label="── Estado de Asistencia ──">
                  <option value="conf1">1ª Asistencia (Foto)</option>
                  <option value="conf2">2ª Asistencia (GPS)</option>
                  <option value="ambas">Ambas Asistencias Confirmadas</option>
                  <option value="pendientes_asistencia">Asistencia Pendiente</option>
                </optgroup>
                <optgroup label="── Estado de Envíos de Actas ──">
                  <option value="ambos_envios">✅ Ambos Envíos (Manual + Imagen)</option>
                  <option value="manual">📝 Con Envío Manual</option>
                  <option value="imagen">📸 Con Envío Imagen / OCR</option>
                  <option value="solo_manual">🟡 Solo Manual (Falta Foto)</option>
                  <option value="solo_imagen">🔵 Solo Imagen (Falta Manual)</option>
                  <option value="sin_envio">🔴 Sin Ningún Envío de Actas</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Personero</th>
                  <th style={{ padding: '8px 10px' }}>DNI / Celular</th>
                  <th style={{ padding: '8px 10px' }}>Distrito / Local</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Mesa</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>1ª Conf. (Foto)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>2ª Conf. (GPS)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)' }}>Envío Manual 📝</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)' }}>Envío Imagen 📸</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Estado Envíos</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Contacto</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersoneros.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>
                      No se encontraron personeros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredPersoneros.map((p, idx) => {
                    const isConf1 = p.confirmacion1 === 'CONFIRMADO' || p.confirmacion === 'SI';
                    const isConf2 = p.confirmacion2 === 'CONFIRMADO';
                    const isMan = p.envioManual === 'ENVIADO';
                    const isImg = p.envioImagen === 'ENVIADO';

                    return (
                      <tr key={p.dni || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        {/* Personero */}
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                          {p.nombre || '—'}
                        </td>

                        {/* DNI / Celular */}
                        <td style={{ padding: '8px 10px', color: 'var(--text2)' }}>
                          <div><strong>{p.dni || '—'}</strong></div>
                          {p.celular && <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>📞 {p.celular}</div>}
                        </td>

                        {/* Distrito / Local */}
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {p.distrito || 'LIMA'}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '2px', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.local}>
                            {p.local || '—'}
                          </div>
                        </td>

                        {/* Mesa */}
                        <td style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: 'var(--primary)' }}>
                          {p.mesa || '—'}
                        </td>

                        {/* 1ª Conf (Foto) */}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {isConf1 ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <span style={{ background: '#10b981', color: '#fff', padding: '2px 7px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700 }}>
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
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    fontSize: '0.65rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  📷 Ver Foto
                                </button>
                              )}
                              {p.fechaHora1 && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>
                                  {formatHora(p.fechaHora1)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 7px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 600 }}>
                              ⏳ PENDIENTE
                            </span>
                          )}
                        </td>

                        {/* 2ª Conf (GPS) */}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {isConf2 ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 7px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700 }}>
                                📍 LLEGÓ (GPS)
                              </span>
                              {p.fechaHora2 && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>
                                  {formatHora(p.fechaHora2)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 7px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 600 }}>
                              ⏳ PENDIENTE
                            </span>
                          )}
                        </td>

                        {/* Envío Manual 📝 (Al costado de 2ª Confirmación) */}
                        <td style={{ padding: '8px 10px', textAlign: 'center', background: 'rgba(245, 158, 11, 0.03)' }}>
                          {isMan ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <span style={{ background: '#10b981', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                                ✅ ENVIADO
                              </span>
                              {p.fechaManual && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>
                                  🕒 {formatHora(p.fechaManual)}
                                </span>
                              )}
                              {p.votosManual > 0 && (
                                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                                  ({p.votosManual} votos)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 7px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                              ⏳ PENDIENTE
                            </span>
                          )}
                        </td>

                        {/* Envío Imagen 📸 (Al costado de Envío Manual) */}
                        <td style={{ padding: '8px 10px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.03)' }}>
                          {isImg ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                                📸 ENVIADO
                              </span>
                              {p.fechaImagen && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>
                                  🕒 {formatHora(p.fechaImagen)}
                                </span>
                              )}
                              {p.votosImagen > 0 && (
                                <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 700 }}>
                                  ({p.votosImagen} votos)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 7px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                              ⏳ PENDIENTE
                            </span>
                          )}
                        </td>

                        {/* Estado General Envíos */}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {p.estadoEnvio === 'AMBOS' && (
                            <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                              🟢 Completo (2/2)
                            </span>
                          )}
                          {p.estadoEnvio === 'SOLO_MANUAL' && (
                            <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                              🟡 Falta Foto (1/2)
                            </span>
                          )}
                          {p.estadoEnvio === 'SOLO_IMAGEN' && (
                            <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                              🔵 Falta Manual (1/2)
                            </span>
                          )}
                          {(p.estadoEnvio === 'SIN_ENVIO' || !p.estadoEnvio) && (
                            <span style={{ background: '#64748b', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                              🔴 Sin Envío (0/2)
                            </span>
                          )}
                        </td>

                        {/* Contacto WhatsApp */}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleWhatsApp(p)}
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.68rem',
                              background: '#25D366',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontWeight: 600
                            }}
                            title="Contactar por WhatsApp"
                          >
                            💬 Avisar
                          </button>
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
