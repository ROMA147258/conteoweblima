import React, { useState, useEffect } from 'react';
import { ALL_DISTRITOS } from '../../constants/locations';
import { comparisonService } from '../../services/comparisonService';
import apiClient from '../../services/apiClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const ComparisonView = () => {
  const [filterA, setFilterA] = useState({
    level: 'distrito',
    location: 'Ate',
    votoTipo: 'todos',
    origen: ''
  });

  const [filterB, setFilterB] = useState({
    level: 'distrito',
    location: 'Ancón',
    votoTipo: 'todos',
    origen: ''
  });

  const [availableSchools, setAvailableSchools] = useState([]);
  const [availableMesas, setAvailableMesas] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar lista de colegios y mesas disponibles para los filtros dinámicos
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await apiClient.get('/voto-real', { action: 'obtener_mesas' });
        const mesasData = res.mesas || [];
        const schools = Array.from(new Set(mesasData.map(m => m.colegio).filter(Boolean))).sort();
        const mesas = Array.from(new Set(mesasData.map(m => m.mesa).filter(Boolean))).sort();
        setAvailableSchools(schools);
        setAvailableMesas(mesas);
      } catch (err) {
        console.warn('Error cargando colegios/mesas para comparación:', err.message);
      }
    }
    loadLocations();
  }, []);

  useEffect(() => {
    async function loadComparison() {
      setLoading(true);
      try {
        const res = await comparisonService.getComparison({
          levelA: filterA.level,
          locationA: filterA.level === 'lima' ? 'LIMA' : filterA.location,
          votoTipoA: filterA.votoTipo,
          origenA: filterA.origen,
          levelB: filterB.level,
          locationB: filterB.level === 'lima' ? 'LIMA' : filterB.location,
          votoTipoB: filterB.votoTipo,
          origenB: filterB.origen
        });
        setComparisonData(res);
      } catch (err) {
        console.error('Error cargando comparación:', err);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [filterA, filterB]);

  const partiesList = [
    { key: 'FP', altKeys: ['FP'], label: 'Fuerza Popular', color: '#c41e3a' },
    { key: 'JP', altKeys: ['JP'], label: 'Juntos por el Perú', color: '#e07b39' },
    { key: 'SP', altKeys: ['SP', 'SOMOS PERU'], label: 'Somos Perú', color: '#1a8a7d' },
    { key: 'FR', altKeys: ['FR', 'FREPAP'], label: 'FREPAP', color: '#2c5282' },
    { key: 'VE', altKeys: ['VE', 'VERDE'], label: 'Verde', color: '#38a169' },
    { key: 'MO', altKeys: ['MO', 'MORADO'], label: 'Morado', color: '#6b46c1' },
    { key: 'NULOS', altKeys: ['NULOS'], label: 'Nulos', color: '#7f8c8d' },
    { key: 'VACIOS', altKeys: ['VACIOS'], label: 'Vacíos', color: '#bdc3c7' }
  ];

  const getVoteValue = (sideRaw, party) => {
    if (!sideRaw) return 0;
    for (const k of party.altKeys) {
      if (sideRaw[k] !== undefined) return sideRaw[k];
    }
    return sideRaw[party.key] || 0;
  };

  const chartLabels = partiesList.map(p => p.label);
  const dataA = partiesList.map(p => getVoteValue(comparisonData?.sideA?.raw, p));
  const dataB = partiesList.map(p => getVoteValue(comparisonData?.sideB?.raw, p));

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: `${filterA.level === 'lima' ? 'Lima General' : (filterA.location || 'Lado A')} (Lado A)`,
        data: dataA,
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        label: `${filterB.level === 'lima' ? 'Lima General' : (filterB.location || 'Lado B')} (Lado B)`,
        data: dataB,
        backgroundColor: '#8b5cf6',
        borderRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#64748b', font: { size: 11, weight: '600' } }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} votos`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(100, 116, 139, 0.1)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  const totalA = comparisonData?.sideA?.total || 0;
  const totalB = comparisonData?.sideB?.total || 0;
  const brecha = comparisonData?.brechaAbsoluta || 0;
  const variacion = comparisonData?.variacionPct || '0.0';
  const liderA = comparisonData?.sideA?.lider || { label: 'Sin votos', pct: '0.0' };
  const liderB = comparisonData?.sideB?.lider || { label: 'Sin votos', pct: '0.0' };

  const getLocationOptions = (level) => {
    if (level === 'distrito') return ALL_DISTRITOS;
    if (level === 'colegio') return availableSchools.length > 0 ? availableSchools : ['IE 2025 INMACULADA CONCEPCION', 'Colegio San Jose'];
    if (level === 'mesa') return availableMesas.length > 0 ? availableMesas : ['123456', '145455', '578858'];
    return ['Lima (General)'];
  };

  return (
    <section className="view active" id="view-comparacion">
      <div className="view-header">
        <div>
          <h1 className="view-title">📊 Panel de Comparación Avanzada</h1>
          <p className="view-subtitle">
            Sincronizado en tiempo real con la tabla <code>votos_detalle</code> (Distritos, Colegios, Mesas, Provincial vs. Distrital, Manual vs. OCR)
          </p>
        </div>
      </div>

      <div className="compare-layout" style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.5rem' }}>
        {/* Paneles de Filtro Dual (Lado A vs Lado B) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          {/* Panel LADO A */}
          <div
            style={{
              background: 'var(--surface)',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                LADO A
              </span>
              <strong style={{ fontSize: '0.9rem' }}>{filterA.level === 'lima' ? 'Lima (General)' : (filterA.location || 'Ate')}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Nivel:</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={filterA.level}
                  onChange={(e) => {
                    const nextLvl = e.target.value;
                    const opts = getLocationOptions(nextLvl);
                    setFilterA({ ...filterA, level: nextLvl, location: opts[0] || '' });
                  }}
                >
                  <option value="distrito">Distrito</option>
                  <option value="lima">Lima (General)</option>
                  <option value="colegio">Colegio</option>
                  <option value="mesa">Mesa</option>
                </select>
              </div>

              {filterA.level !== 'lima' && (
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>
                    {filterA.level === 'colegio' ? 'Colegio:' : filterA.level === 'mesa' ? 'Mesa:' : 'Distrito:'}
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', maxWidth: '100%' }}
                    value={filterA.location}
                    onChange={(e) => setFilterA({ ...filterA, location: e.target.value })}
                  >
                    {getLocationOptions(filterA.level).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Tipo Voto:</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', maxWidth: '100%' }}
                    value={filterA.votoTipo}
                    onChange={(e) => setFilterA({ ...filterA, votoTipo: e.target.value })}
                  >
                    <option value="todos">Prov. + Dist.</option>
                    <option value="provincial">Provincial</option>
                    <option value="distrital">Distrital</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Origen:</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', maxWidth: '100%' }}
                    value={filterA.origen}
                    onChange={(e) => setFilterA({ ...filterA, origen: e.target.value })}
                  >
                    <option value="">Todos (Man+OCR)</option>
                    <option value="MANUAL">Manual</option>
                    <option value="IMAGEN">OCR / Imagen</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* VS Badge */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}
          >
            VS
          </div>

          {/* Panel LADO B */}
          <div
            style={{
              background: 'var(--surface)',
              border: '2px solid #8b5cf6',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ background: '#8b5cf6', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                LADO B
              </span>
              <strong style={{ fontSize: '0.9rem' }}>{filterB.level === 'lima' ? 'Lima (General)' : (filterB.location || 'Ancón')}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Nivel:</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={filterB.level}
                  onChange={(e) => {
                    const nextLvl = e.target.value;
                    const opts = getLocationOptions(nextLvl);
                    setFilterB({ ...filterB, level: nextLvl, location: opts[0] || '' });
                  }}
                >
                  <option value="distrito">Distrito</option>
                  <option value="lima">Lima (General)</option>
                  <option value="colegio">Colegio</option>
                  <option value="mesa">Mesa</option>
                </select>
              </div>

              {filterB.level !== 'lima' && (
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>
                    {filterB.level === 'colegio' ? 'Colegio:' : filterB.level === 'mesa' ? 'Mesa:' : 'Distrito:'}
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', maxWidth: '100%' }}
                    value={filterB.location}
                    onChange={(e) => setFilterB({ ...filterB, location: e.target.value })}
                  >
                    {getLocationOptions(filterB.level).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Tipo Voto:</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', maxWidth: '100%' }}
                    value={filterB.votoTipo}
                    onChange={(e) => setFilterB({ ...filterB, votoTipo: e.target.value })}
                  >
                    <option value="todos">Prov. + Dist.</option>
                    <option value="provincial">Provincial</option>
                    <option value="distrital">Distrital</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Origen:</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', maxWidth: '100%' }}
                    value={filterB.origen}
                    onChange={(e) => setFilterB({ ...filterB, origen: e.target.value })}
                  >
                    <option value="">Todos (Man+OCR)</option>
                    <option value="MANUAL">Manual</option>
                    <option value="IMAGEN">OCR / Imagen</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de Estadísticas Lado A / Diferencia / Lado B */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="dash-widget" style={{ minHeight: 'auto', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>
              LADO A
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{filterA.level === 'lima' ? 'Lima General' : filterA.location}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>
              {totalA.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>votos</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '0.2rem' }}>
              🏆 Líder: <strong>{liderA.label}</strong> ({liderA.pct}%)
            </div>
          </div>

          <div className="dash-widget" style={{ minHeight: 'auto', padding: '0.75rem 1rem', borderTop: '3px solid #eab308' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>
              DIFERENCIA
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Brecha Absoluta</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#eab308' }}>
              {brecha.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>votos</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '0.2rem' }}>
              Variación: <strong>{variacion}%</strong>
            </div>
          </div>

          <div className="dash-widget" style={{ minHeight: 'auto', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>
              LADO B
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{filterB.level === 'lima' ? 'Lima General' : filterB.location}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6' }}>
              {totalB.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>votos</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '0.2rem' }}>
              🏆 Líder: <strong>{liderB.label}</strong> ({liderB.pct}%)
            </div>
          </div>
        </div>

        {/* Gráfico Comparativo */}
        <div className="dash-widget" style={{ height: '320px', minHeight: '320px', marginBottom: '1.25rem' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Tabla Comparativa */}
        <div className="compare-table">
          <table>
            <thead>
              <tr>
                <th>Partido</th>
                <th>{filterA.level === 'lima' ? 'Lima General' : filterA.location} (A)</th>
                <th>{filterB.level === 'lima' ? 'Lima General' : filterB.location} (B)</th>
                <th>Diferencia (A - B)</th>
                <th>Comparativa Visual</th>
              </tr>
            </thead>
            <tbody>
              {partiesList.map(p => {
                const vA = getVoteValue(comparisonData?.sideA?.raw, p);
                const vB = getVoteValue(comparisonData?.sideB?.raw, p);
                const diff = vA - vB;
                const maxV = Math.max(vA, vB, 1);
                const pctA = (vA / maxV) * 100;
                const pctB = (vB / maxV) * 100;

                return (
                  <tr key={p.key}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }}></span>
                      {p.label}
                    </td>
                    <td style={{ fontWeight: 700, color: '#3b82f6' }}>{vA.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: '#8b5cf6' }}>{vB.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                      {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                    </td>
                    <td style={{ width: '220px' }}>
                      <div style={{ display: 'flex', gap: '4px', height: '8px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden', padding: '1px' }}>
                        <div style={{ width: `${pctA / 2}%`, background: '#3b82f6', borderRadius: '2px' }} title={`Lado A: ${vA}`}></div>
                        <div style={{ width: `${pctB / 2}%`, background: '#8b5cf6', borderRadius: '2px' }} title={`Lado B: ${vB}`}></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ComparisonView;
