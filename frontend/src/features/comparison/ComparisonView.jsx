import React, { useState, useEffect } from 'react';
import { ALL_DISTRITOS } from '../../constants/locations';
import { PARTIES } from '../../constants/parties';
import { comparisonService } from '../../services/comparisonService';
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

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadComparison() {
      setLoading(true);
      try {
        const res = await comparisonService.getComparison({
          levelA: filterA.level,
          locationA: filterA.location,
          votoTipoA: filterA.votoTipo,
          origenA: filterA.origen,
          levelB: filterB.level,
          locationB: filterB.location,
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
    { key: 'FP', label: 'Fuerza Popular', color: '#c41e3a' },
    { key: 'JP', label: 'Juntos por el Perú', color: '#e07b39' },
    { key: 'SP', label: 'Somos Perú', color: '#1a8a7d' },
    { key: 'FR', label: 'FREPAP', color: '#2c5282' },
    { key: 'VE', label: 'Verde', color: '#38a169' },
    { key: 'MO', label: 'Morado', color: '#6b46c1' },
    { key: 'NULOS', label: 'Nulos', color: '#7f8c8d' },
    { key: 'VACIOS', label: 'Vacíos', color: '#bdc3c7' }
  ];

  const chartLabels = partiesList.map(p => p.label);
  const dataA = partiesList.map(p => comparisonData?.sideA?.raw?.[p.key] || 0);
  const dataB = partiesList.map(p => comparisonData?.sideB?.raw?.[p.key] || 0);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: `${filterA.location || 'Lado A'} (Lado A)`,
        data: dataA,
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        label: `${filterB.location || 'Lado B'} (Lado B)`,
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

  return (
    <section className="view active" id="view-comparacion">
      <div className="view-header">
        <div>
          <h1 className="view-title">Panel de Comparación Avanzada</h1>
          <p className="view-subtitle">
            Análisis comparativo multivariable (Distritos, Colegios, Votos Provinciales vs. Distritales, Manual vs. OCR)
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
              <strong style={{ fontSize: '0.9rem' }}>{filterA.location || 'Ate'}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Nivel:</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={filterA.level}
                  onChange={(e) => setFilterA({ ...filterA, level: e.target.value })}
                >
                  <option value="distrito">Distrito</option>
                  <option value="lima">Lima (General)</option>
                  <option value="colegio">Colegio</option>
                  <option value="mesa">Mesa</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Ubicación:</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={filterA.location}
                  onChange={(e) => setFilterA({ ...filterA, location: e.target.value })}
                >
                  {ALL_DISTRITOS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

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
              <strong style={{ fontSize: '0.9rem' }}>{filterB.location || 'Ancón'}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Nivel:</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={filterB.level}
                  onChange={(e) => setFilterB({ ...filterB, level: e.target.value })}
                >
                  <option value="distrito">Distrito</option>
                  <option value="lima">Lima (General)</option>
                  <option value="colegio">Colegio</option>
                  <option value="mesa">Mesa</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text3)' }}>Ubicación:</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={filterB.location}
                  onChange={(e) => setFilterB({ ...filterB, location: e.target.value })}
                >
                  {ALL_DISTRITOS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

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
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{filterA.location}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>
              {totalA} <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>votos</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '0.2rem' }}>
              🏆 Líder: Morado (0.0%)
            </div>
          </div>

          <div className="dash-widget" style={{ minHeight: 'auto', padding: '0.75rem 1rem', borderTop: '3px solid #eab308' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>
              DIFERENCIA
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Brecha Absoluta</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#eab308' }}>
              {brecha} <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>votos</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '0.2rem' }}>
              Variación: {variacion}%
            </div>
          </div>

          <div className="dash-widget" style={{ minHeight: 'auto', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>
              LADO B
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{filterB.location}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6' }}>
              {totalB} <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>votos</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '0.2rem' }}>
              🏆 Líder: Morado (0.0%)
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
                <th>{filterA.location} (A)</th>
                <th>{filterB.location} (B)</th>
                <th>Diferencia (A - B)</th>
                <th>Comparativa Visual</th>
              </tr>
            </thead>
            <tbody>
              {partiesList.map(p => {
                const vA = comparisonData?.sideA?.raw?.[p.key] || 0;
                const vB = comparisonData?.sideB?.raw?.[p.key] || 0;
                const diff = vA - vB;
                return (
                  <tr key={p.key}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }}></span>
                      {p.label}
                    </td>
                    <td style={{ fontWeight: 700, color: '#3b82f6' }}>{vA}</td>
                    <td style={{ fontWeight: 700, color: '#8b5cf6' }}>{vB}</td>
                    <td style={{ fontWeight: 700, color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td style={{ width: '200px' }}>
                      <div style={{ display: 'flex', gap: '2px', height: '8px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${vA > 0 ? 50 : 0}%`, background: '#3b82f6' }}></div>
                        <div style={{ width: `${vB > 0 ? 50 : 0}%`, background: '#8b5cf6' }}></div>
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
