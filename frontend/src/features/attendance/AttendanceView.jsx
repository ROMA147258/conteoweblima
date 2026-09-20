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

  // Filtros locales para la tabla de personeros (Sin redundancia)
  const [searchTerm, setSearchTerm] = useState('');
  const [asistenciaFilter, setAsistenciaFilter] = useState('todos');
  const [enviosFilter, setEnviosFilter] = useState('todos');
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

  const filterAnimKey = `${filters.distrito || ''}_${filters.colegio || ''}`;

  const kpis = data?.kpis || {
    totalPersonerosRegistrados: 0,
    primeraAsistencia: 0,
    distritosConReporte: 0,
    enviosAmbos: 0,
    enviosSoloManual: 0,
    enviosSoloImagen: 0,
    sinEnvio: 0
  };

  const conf1 = data?.charts?.conf1Global?.confirmados || 0;
  const falt1 = data?.charts?.conf1Global?.faltantes || 0;

  // Donut Asistencia Global
  const doughnut1Data = {
    labels: ['Asistencia Confirmada', 'Asistencia Pendiente'],
    datasets: [
      {
        data: [conf1, Math.max(0, falt1)],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Bar Asistencia por Distrito
  const distEntries1 = Object.entries(data?.charts?.conf1PorDistrito || {});
  const bar1Data = {
    labels: distEntries1.length > 0 ? distEntries1.map(([k]) => k) : ['Sin registros'],
    datasets: [
      {
        label: 'Personeros Asistieron',
        data: distEntries1.length > 0 ? distEntries1.map(([, v]) => v) : [0],
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ]
  };

  // Donut Estado de Envíos de Actas Global
  const doughnut2Data = {
    labels: ['Completo (2/2)', 'Falta Foto (1/2)', 'Falta Manual (1/2)', 'Sin Envíos (0/2)'],
    datasets: [
      {
        data: [
          kpis.enviosAmbos || 0,
          kpis.enviosSoloManual || 0,
          kpis.enviosSoloImagen || 0,
          kpis.sinEnvio || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Bar Envíos de Actas por Distrito
  const enviosDistritos = {};
  (data?.registros || []).forEach(r => {
    const d = r.distrito || 'LIMA';
    if (r.envioManual === 'ENVIADO' || r.envioImagen === 'ENVIADO') {
      enviosDistritos[d] = (enviosDistritos[d] || 0) + 1;
    }
  });
  const distEntries2 = Object.entries(enviosDistritos);
  const bar2Data = {
    labels: distEntries2.length > 0 ? distEntries2.map(([k]) => k) : ['Sin registros'],
    datasets: [
      {
        label: 'Personeros con Actas Enviadas',
        data: distEntries2.length > 0 ? distEntries2.map(([, v]) => v) : [0],
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 850,
      easing: 'easeOutCirc'
    },
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
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
      delay: (ctx) => {
        if (ctx.type === 'data' && ctx.mode === 'default') {
          return (ctx.dataIndex || 0) * 40;
        }
        return 0;
      }
    },
    animations: {
      y: {
        type: 'number',
        easing: 'easeOutQuart',
        duration: 900,
        from: (ctx) => {
          if (ctx.chart && ctx.chart.scales && ctx.chart.scales.y) {
            return ctx.chart.scales.y.getPixelForValue(0);
          }
          return 0;
        },
        delay: (ctx) => {
          if (ctx.type === 'data' && ctx.mode === 'default') {
            return (ctx.dataIndex || 0) * 40;
          }
          return 0;
        }
      }
    },
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

  // Filtrado de personeros en la tabla (Sin redundancia)
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
    const isMan = p.envioManual === 'ENVIADO';
    const isImg = p.envioImagen === 'ENVIADO';

    // 1. Filtro de Asistencia
    if (asistenciaFilter === 'conf1' && !isConf1) return false;
    if (asistenciaFilter === 'sin_asistencia' && isConf1) return false;

    // 2. Filtro de Envíos de Actas
    if (enviosFilter === 'ambos' && (!isMan || !isImg)) return false;
    if (enviosFilter === 'solo_manual' && (!isMan || isImg)) return false;
    if (enviosFilter === 'solo_imagen' && (isMan || !isImg)) return false;
    if (enviosFilter === 'sin_envio' && (isMan || isImg)) return false;

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

  const hasActiveFilters = searchTerm !== '' || asistenciaFilter !== 'todos' || enviosFilter !== 'todos';

  const resetAllFilters = () => {
    setSearchTerm('');
    setAsistenciaFilter('todos');
    setEnviosFilter('todos');
  };

  return (
    <section className="view active" id="view-apertura">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 className="view-title">👥 Monitoreo de Personeros, Asistencia y Envíos de Actas</h1>
          <p className="view-subtitle">
            Control de Asistencia y estado de transmisión: <strong>Conteo Manual 📝</strong> e <strong>Imagen / OCR 📸</strong>
          </p>
        </div>
      </div>

      <div className="dashboard-scroll" style={{ overflowY: 'auto', flex: 1, padding: '0.875rem 1.25rem' }}>
        {/* KPI Row (6 Tarjetas Informativas y Clicables) */}
        <div className="kpi-row-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {/* 1. Total Personeros */}
          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#1565c0', padding: '0.75rem 0.85rem', cursor: 'pointer', border: (asistenciaFilter === 'todos' && enviosFilter === 'todos') ? '2px solid #1565c0' : '1px solid var(--border)' }}
            onClick={resetAllFilters}
            title="Mostrar todos los personeros"
          >
            <span className="kpi-icon">👥</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.totalPersonerosRegistrados.toLocaleString()}</span>
              <span className="kpi-card-label">TOTAL PERSONEROS</span>
            </div>
          </div>

          {/* 2. Asistencia Confirmada */}
          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#059669', padding: '0.75rem 0.85rem', cursor: 'pointer', border: asistenciaFilter === 'conf1' ? '2px solid #059669' : '1px solid var(--border)', background: asistenciaFilter === 'conf1' ? 'rgba(5, 150, 105, 0.08)' : 'var(--surface)' }}
            onClick={() => { setAsistenciaFilter('conf1'); setEnviosFilter('todos'); }}
            title="Filtrar personeros con Asistencia Confirmada"
          >
            <span className="kpi-icon">🌅</span>
            <div className="kpi-meta">
              <span className="kpi-card-value" style={{ color: '#059669' }}>{kpis.primeraAsistencia.toLocaleString()}</span>
              <span className="kpi-card-label">ASIST. CONFIRMADA</span>
            </div>
          </div>

          {/* 3. Envíos Completos (2/2) */}
          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#10b981', padding: '0.75rem 0.85rem', cursor: 'pointer', border: enviosFilter === 'ambos' ? '2px solid #10b981' : '1px solid var(--border)', background: enviosFilter === 'ambos' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface)' }}
            onClick={() => { setEnviosFilter('ambos'); setAsistenciaFilter('todos'); }}
            title="Filtrar personeros con ambos envíos completados (Manual + Foto)"
          >
            <span className="kpi-icon">🟢</span>
            <div className="kpi-meta">
              <span className="kpi-card-value" style={{ color: '#10b981' }}>{(kpis.enviosAmbos || 0).toLocaleString()}</span>
              <span className="kpi-card-label">COMPLETO (2/2)</span>
            </div>
          </div>

          {/* 4. Falta Foto (Solo Manual) */}
          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#f59e0b', padding: '0.75rem 0.85rem', cursor: 'pointer', border: enviosFilter === 'solo_manual' ? '2px solid #f59e0b' : '1px solid var(--border)', background: enviosFilter === 'solo_manual' ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface)' }}
            onClick={() => { setEnviosFilter('solo_manual'); setAsistenciaFilter('todos'); }}
            title="Filtrar personeros que enviaron manual pero les falta subir la foto"
          >
            <span className="kpi-icon">🟡</span>
            <div className="kpi-meta">
              <span className="kpi-card-value" style={{ color: '#f59e0b' }}>{(kpis.enviosSoloManual || 0).toLocaleString()}</span>
              <span className="kpi-card-label">FALTA FOTO (1/2)</span>
            </div>
          </div>

          {/* 5. Falta Manual (Solo Foto) */}
          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#3b82f6', padding: '0.75rem 0.85rem', cursor: 'pointer', border: enviosFilter === 'solo_imagen' ? '2px solid #3b82f6' : '1px solid var(--border)', background: enviosFilter === 'solo_imagen' ? 'rgba(59, 130, 246, 0.12)' : 'var(--surface)' }}
            onClick={() => { setEnviosFilter('solo_imagen'); setAsistenciaFilter('todos'); }}
            title="Filtrar personeros que subieron foto pero les falta digitar manual"
          >
            <span className="kpi-icon">🔵</span>
            <div className="kpi-meta">
              <span className="kpi-card-value" style={{ color: '#3b82f6' }}>{(kpis.enviosSoloImagen || 0).toLocaleString()}</span>
              <span className="kpi-card-label">FALTA MANUAL (1/2)</span>
            </div>
          </div>

          {/* 6. Sin Envíos (0/2) */}
          <div
            className="kpi-card-pro"
            style={{ '--kpi-color': '#ef4444', padding: '0.75rem 0.85rem', cursor: 'pointer', border: enviosFilter === 'sin_envio' ? '2px solid #ef4444' : '1px solid var(--border)', background: enviosFilter === 'sin_envio' ? 'rgba(239, 68, 68, 0.12)' : 'var(--surface)' }}
            onClick={() => { setEnviosFilter('sin_envio'); setAsistenciaFilter('todos'); }}
            title="Filtrar personeros sin ningún envío de actas aún"
          >
            <span className="kpi-icon">🔴</span>
            <div className="kpi-meta">
              <span className="kpi-card-value" style={{ color: '#ef4444' }}>{(kpis.sinEnvio || 0).toLocaleString()}</span>
              <span className="kpi-card-label">SIN ENVÍO (0/2)</span>
            </div>
          </div>
        </div>

        {/* Grilla Simétrica de 4 Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {/* 1. Asistencia Global */}
          <div className="dash-widget" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ color: '#10b981', fontSize: '0.85rem' }}>🌅 Asistencia Global</h3>
                <p className="widget-subtitle">Confirmación de presencia</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0.25rem' }}>
              <Doughnut key={`donut-asist-${filterAnimKey}`} data={doughnut1Data} options={donutOptions} />
            </div>
          </div>

          {/* 2. Asistencia por Distrito */}
          <div className="dash-widget" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ fontSize: '0.85rem' }}>🌅 Asistencia por Distrito</h3>
                <p className="widget-subtitle">Personeros confirmados</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, minHeight: 0, padding: '0.25rem' }}>
              <Bar key={`bar-asist-${filterAnimKey}`} data={bar1Data} options={barOptions} />
            </div>
          </div>

          {/* 3. Estado de Transmisión de Actas */}
          <div className="dash-widget" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>📦 Estado Global de Actas</h3>
                <p className="widget-subtitle">Distribución de transmisión</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0.25rem' }}>
              <Doughnut key={`donut-envios-${filterAnimKey}`} data={doughnut2Data} options={donutOptions} />
            </div>
          </div>

          {/* 4. Envíos de Actas por Distrito */}
          <div className="dash-widget" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ fontSize: '0.85rem' }}>📊 Actas Transmitidas por Distrito</h3>
                <p className="widget-subtitle">Personeros que reportaron</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, minHeight: 0, padding: '0.25rem' }}>
              <Bar key={`bar-envios-${filterAnimKey}`} data={bar2Data} options={barOptions} />
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
                Seguimiento en vivo: Asistencia + Envío Manual 📝 + Envío Imagen 📸
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

              {/* Filtro 1: Asistencia */}
              <select
                value={asistenciaFilter}
                onChange={(e) => setAsistenciaFilter(e.target.value)}
                style={{
                  background: 'var(--bg2)',
                  border: asistenciaFilter !== 'todos' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
                title="Filtrar por estado de asistencia"
              >
                <option value="todos">📋 Asistencia: Todos</option>
                <option value="conf1">✅ Asistencia Confirmada</option>
                <option value="sin_asistencia">⏳ Asistencia Pendiente</option>
              </select>

              {/* Filtro 2: Envíos de Actas */}
              <select
                value={enviosFilter}
                onChange={(e) => setEnviosFilter(e.target.value)}
                style={{
                  background: 'var(--bg2)',
                  border: enviosFilter !== 'todos' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
                title="Filtrar por estado de transmisión de actas"
              >
                <option value="todos">📦 Envíos: Todos</option>
                <option value="ambos">🟢 Completo (Manual + Foto)</option>
                <option value="solo_manual">🟡 Solo Manual (Falta Foto)</option>
                <option value="solo_imagen">🔵 Solo Foto / OCR (Falta Manual)</option>
                <option value="sin_envio">🔴 Sin Envíos de Actas (0/2)</option>
              </select>

              {/* Botón Reset si hay filtros aplicados */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Restablecer todos los filtros y búsqueda"
                >
                  ✖ Limpiar
                </button>
              )}
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
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>📸 Asistencia</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)' }}>Envío Manual 📝</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)' }}>Envío Imagen 📸</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Estado Envíos</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Contacto</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersoneros.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>
                      No se encontraron personeros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredPersoneros.map((p, idx) => {
                    const isConf1 = p.confirmacion1 === 'CONFIRMADO' || p.confirmacion === 'SI';
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

                        {/* Asistencia */}
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

                        {/* Envío Manual 📝 */}
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

                        {/* Envío Imagen 📸 */}
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
