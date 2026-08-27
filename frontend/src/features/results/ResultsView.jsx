import React, { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { resultsService } from '../../services/resultsService';
import { PARTIES, PARTY_KEYS } from '../../constants/parties';
import { getCandidatoProvincial, getCandidatoDistrital } from '../../constants/candidatesData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export const ResultsView = () => {
  const { filters, updateFilter } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await resultsService.getResults(filters);
        setData(res);
      } catch (err) {
        setError(err.message || 'Error al cargar resultados');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filters]);

  const manualProv = data?.desglose?.manualProvincial || {};
  const manualDist = data?.desglose?.manualDistrital || {};
  const ocrProv = data?.desglose?.ocrProvincial || {};
  const ocrDist = data?.desglose?.ocrDistrital || {};

  const totalManualProv = manualProv.TOTAL || 0;
  const totalManualDist = manualDist.TOTAL || 0;
  const totalOcrProv = ocrProv.TOTAL || 0;
  const totalOcrDist = ocrDist.TOTAL || 0;

  const candProvDB = data?.candidatosProvincial || {};
  const candDistDB = data?.candidatosDistrital || {};

  // Resultado Lima Metropolitana = Suma de Provincial Manual + Provincial OCR
  const combinedLimaMetro = {};
  PARTY_KEYS.forEach(k => {
    const v1 = manualProv[k] || (k === 'SP' ? manualProv['SOMOS PERU'] : 0) || 0;
    const v2 = ocrProv[k] || (k === 'SP' ? ocrProv['SOMOS PERU'] : 0) || 0;
    combinedLimaMetro[k] = v1 + v2;
  });

  const totalLimaMetro = totalManualProv + totalOcrProv;

  const selectedPartyKey = filters.partido ? filters.partido.toUpperCase() : null;
  const selectedParty = selectedPartyKey ? PARTIES[selectedPartyKey] : null;

  // Gráficos globales cuando NO hay filtro de partido
  const createGlobalChartData = (votesObj = {}) => {
    const activeKeys = PARTY_KEYS.filter(k => {
      const v = votesObj[k] || (k === 'SP' ? votesObj['SOMOS PERU'] : 0) || 0;
      return v > 0 || ['FP', 'JP', 'SP', 'FREPAP', 'VERDE', 'MORADO', 'RP', 'AN', 'AVANZA', 'PODEMOS', 'AP', 'NULOS', 'VACIOS', 'IMPUGNADOS'].includes(k);
    });

    const labels = activeKeys.map(k => PARTIES[k]?.short || k);
    const partyData = activeKeys.map(k => votesObj[k] || (k === 'SP' ? votesObj['SOMOS PERU'] : 0) || 0);
    const backgroundColors = activeKeys.map(k => PARTIES[k]?.color || '#94a3b8');

    return {
      labels,
      datasets: [
        {
          label: 'Votos',
          data: partyData,
          backgroundColor: backgroundColors,
          borderRadius: 4
        }
      ]
    };
  };

  // Gráfico de desglose por origen y tipo para el partido seleccionado
  const createPartyBreakdownChartData = (pKey) => {
    const pManualProv = manualProv[pKey] || (pKey === 'SP' ? manualProv['SOMOS PERU'] : 0) || 0;
    const pOcrProv = ocrProv[pKey] || (pKey === 'SP' ? ocrProv['SOMOS PERU'] : 0) || 0;
    const pManualDist = manualDist[pKey] || (pKey === 'SP' ? manualDist['SOMOS PERU'] : 0) || 0;
    const pOcrDist = ocrDist[pKey] || (pKey === 'SP' ? ocrDist['SOMOS PERU'] : 0) || 0;
    const pTotal = (pManualProv + pOcrProv) + (pManualDist + pOcrDist);

    return {
      labels: ['Prov. Manual', 'Prov. OCR', 'Dist. Manual', 'Dist. OCR', 'Total Partido'],
      datasets: [
        {
          label: 'Votos',
          data: [pManualProv, pOcrProv, pManualDist, pOcrDist, pTotal],
          backgroundColor: [
            '#0284c7',
            '#38bdf8',
            '#8b5cf6',
            '#c084fc',
            selectedParty?.color || '#f59e0b'
          ],
          borderRadius: 4
        }
      ]
    };
  };

  // Gráfico de participación del partido seleccionado vs Nulos, Blancos, Impugnados y Otros
  const createPartyShareDoughnutData = (pKey) => {
    const partyProv = (manualProv[pKey] || 0) + (ocrProv[pKey] || 0);
    const nulos = (manualProv.NULOS || 0) + (ocrProv.NULOS || 0);
    const blancos = (manualProv.VACIOS || 0) + (ocrProv.VACIOS || 0);
    const impugnados = (manualProv.IMPUGNADOS || 0) + (ocrProv.IMPUGNADOS || 0);
    const otros = Math.max(0, totalLimaMetro - (partyProv + nulos + blancos + impugnados));

    return {
      labels: [selectedParty?.label || pKey, 'Otros Partidos', 'Nulos', 'Blancos', 'Impugnados'],
      datasets: [
        {
          data: [partyProv, otros, nulos, blancos, impugnados],
          backgroundColor: [
            selectedParty?.color || '#3b82f6',
            'rgba(148, 163, 184, 0.4)',
            '#64748b',
            '#94a3b8',
            '#eab308'
          ],
          borderWidth: 1,
          borderColor: 'var(--surface)'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const label = items[0].label;
            const matchKey = PARTY_KEYS.find(k => (PARTIES[k]?.short || k) === label) || label;
            return PARTIES[matchKey]?.label || label;
          },
          label: (ctx) => ` ${ctx.raw.toLocaleString()} votos`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(128, 128, 128, 0.12)' },
        ticks: { font: { size: 10 }, color: 'var(--text3)' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: 'var(--text3)', autoSkip: false, maxRotation: 45 }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 12, font: { size: 11 }, color: 'var(--text)' }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw || 0;
            const total = totalLimaMetro || 1;
            const pct = ((val / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${val.toLocaleString()} votos (${pct}%)`;
          }
        }
      }
    }
  };

  // Partidos ordenados por votos para el ranking y píldoras del header
  const sortedParties = PARTY_KEYS
    .filter(k => k !== 'NULOS' && k !== 'VACIOS' && k !== 'IMPUGNADOS')
    .map(k => {
      const provVotes = (manualProv[k] || 0) + (ocrProv[k] || 0);
      const distVotes = (manualDist[k] || 0) + (ocrDist[k] || 0);
      const totalParty = provVotes + distVotes;
      const pct = totalLimaMetro > 0 ? ((provVotes / totalLimaMetro) * 100) : 0;
      
      const cProv = candProvDB[k] || getCandidatoProvincial(k);
      const cDist = candDistDB[k] || getCandidatoDistrital(k, filters.distrito);

      return {
        key: k,
        ...PARTIES[k],
        provVotes,
        distVotes,
        totalParty,
        pct,
        candidatoProv: cProv,
        candidatoDist: cDist
      };
    })
    .sort((a, b) => {
      if (selectedPartyKey) {
        if (a.key === selectedPartyKey) return -1;
        if (b.key === selectedPartyKey) return 1;
      }
      return b.totalParty - a.totalParty;
    });

  // Datos de votos no válidos (Nulos, Blancos, Impugnados)
  const specialVotes = ['NULOS', 'VACIOS', 'IMPUGNADOS'].map(k => {
    const provVotes = (manualProv[k] || 0) + (ocrProv[k] || 0);
    const distVotes = (manualDist[k] || 0) + (ocrDist[k] || 0);
    const totalParty = provVotes + distVotes;
    const pct = totalLimaMetro > 0 ? ((provVotes / totalLimaMetro) * 100) : 0;
    return {
      key: k,
      ...PARTIES[k],
      provVotes,
      distVotes,
      totalParty,
      pct,
      candidatoProv: '—',
      candidatoDist: '—'
    };
  });

  const focusedPartyData = selectedPartyKey ? sortedParties.find(p => p.key === selectedPartyKey) : null;

  return (
    <section className="view active" id="view-dashboard">
      <div className="view-header">
        <div>
          <h1 className="view-title">📊 Dashboard de Resultados Electorales</h1>
          <p className="view-subtitle">
            Ámbito:{' '}
            <strong style={{ color: 'var(--accent)' }}>
              {filters.distrito ? filters.distrito : 'Lima Metropolitana'}
            </strong>
            {filters.colegio ? ` · Local: ${filters.colegio}` : ''}
            {filters.mesa ? ` · Mesa: ${filters.mesa}` : ''}
            {selectedParty ? ` · Filtro: ${selectedParty.label}` : ''}
          </p>
        </div>

        <div className="view-actions" style={{ overflowX: 'auto', maxWidth: '60%' }}>
          <div className="header-stats" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'nowrap' }}>
            {sortedParties.slice(0, 8).map(p => {
              const isSel = selectedPartyKey === p.key;
              return (
                <div
                  key={p.key}
                  className={`stat-pill party-pill ${isSel ? 'active' : ''}`}
                  onClick={() => updateFilter('partido', isSel ? '' : p.key)}
                  style={{
                    '--c': p.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 7px',
                    borderRadius: 'var(--radius)',
                    background: isSel ? 'var(--accent-glow)' : 'var(--bg3)',
                    border: isSel ? `1.5px solid ${p.color}` : '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    color: 'var(--text)',
                    whiteSpace: 'nowrap'
                  }}
                  title={`Filtrar por ${p.label}`}
                >
                  {p.symbol && (
                    <img
                      src={p.symbol}
                      alt={p.label}
                      style={{ width: 13, height: 13, objectFit: 'contain', borderRadius: 2 }}
                    />
                  )}
                  <span>{p.short}</span>
                  <strong style={{ color: p.color }}>{p.pct.toFixed(1)}%</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="dashboard-scroll" id="dashboardContent" style={{ padding: '0.65rem 0.85rem', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            Cargando resultados electorales...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
            ⚠️ Error: {error}
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Panel Compacto y Ajustado de Partido Filtrado (Sin Espacios Vacíos) */}
            {focusedPartyData && (
              <div
                style={{
                  gridColumn: 'span 12',
                  background: 'var(--surface)',
                  border: `1.5px solid ${focusedPartyData.color}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.5rem 0.75rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                {/* Fila Superior Ajustada */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {focusedPartyData.symbol ? (
                      <img
                        src={focusedPartyData.symbol}
                        alt={focusedPartyData.label}
                        style={{
                          width: 26,
                          height: 26,
                          objectFit: 'contain',
                          borderRadius: 'var(--radius-sm)',
                          background: '#ffffff',
                          padding: 2,
                          border: '1px solid var(--border)'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 'var(--radius-sm)',
                          background: focusedPartyData.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }}
                      >
                        {focusedPartyData.short}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          background: focusedPartyData.color,
                          color: '#ffffff',
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700
                        }}
                      >
                        Partido Filtrado
                      </span>
                      <h2 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, color: 'var(--text)' }}>
                        {focusedPartyData.label}
                      </h2>
                      <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>
                        ({filters.distrito ? `Distrito: ${filters.distrito}` : 'Lima Metropolitana'})
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => updateFilter('partido', '')}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg3)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    ✕ Quitar Filtro
                  </button>
                </div>

                {/* Grid Compacto de 4 Columnas Ajustadas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                  <div
                    style={{
                      background: 'var(--bg2)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, display: 'block' }}>
                      🏛️ CAND. PROVINCIAL (LIMA)
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {focusedPartyData.candidatoProv}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text2)', display: 'block' }}>
                      Votos: <strong style={{ color: 'var(--text)' }}>{focusedPartyData.provVotes.toLocaleString()}</strong> ({focusedPartyData.pct.toFixed(1)}%)
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg2)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-purple)', fontWeight: 700, display: 'block' }}>
                      📍 CAND. DISTRITAL ({filters.distrito || 'DISTRITO'})
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {focusedPartyData.candidatoDist}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text2)', display: 'block' }}>
                      Votos Distritales: <strong style={{ color: 'var(--text)' }}>{focusedPartyData.distVotes.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg2)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-green)', fontWeight: 700, display: 'block' }}>
                      🗳️ TOTAL VOTOS PARTIDO
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: focusedPartyData.color, display: 'block' }}>
                      {focusedPartyData.totalParty.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text3)', display: 'block' }}>
                      Manual + OCR sumados
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg2)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-orange)', fontWeight: 700, display: 'block' }}>
                      📈 % PARTICIPACIÓN LIMA
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'block' }}>
                      {focusedPartyData.pct.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text3)', display: 'block' }}>
                      De {totalLimaMetro.toLocaleString()} votos
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SI HAY UN PARTIDO FILTRADO: Mostrar gráficos adaptados y enfocados sin espacios vacíos */}
            {selectedPartyKey ? (
              <>
                {/* 1. Desglose detallado del partido */}
                <div className="dash-widget widget-lg" style={{ minHeight: '260px' }}>
                  <div className="widget-header">
                    <div>
                      <h3 className="widget-title">Desglose de Votos de {selectedParty?.label}</h3>
                      <p className="widget-subtitle">Comparativa por Origen de Datos y Tipo de Elección</p>
                    </div>
                    <span className="widget-badge" style={{ color: selectedParty?.color, fontWeight: 700 }}>
                      {focusedPartyData?.totalParty.toLocaleString()} Votos
                    </span>
                  </div>
                  <div className="widget-chart" style={{ height: '200px' }}>
                    <Bar data={createPartyBreakdownChartData(selectedPartyKey)} options={chartOptions} />
                  </div>
                </div>

                {/* 2. Distribución y porcentaje frente al total */}
                <div className="dash-widget widget-lg" style={{ minHeight: '260px' }}>
                  <div className="widget-header">
                    <div>
                      <h3 className="widget-title">Participación de {selectedParty?.short} vs Otros</h3>
                      <p className="widget-subtitle">Porcentaje sobre votos válidos, nulos e impugnados</p>
                    </div>
                    <span className="widget-badge" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      {focusedPartyData?.pct.toFixed(1)}% de Lima
                    </span>
                  </div>
                  <div className="widget-chart" style={{ height: '200px' }}>
                    <Doughnut data={createPartyShareDoughnutData(selectedPartyKey)} options={doughnutOptions} />
                  </div>
                </div>
              </>
            ) : (
              /* SI NO HAY FILTRO DE PARTIDO: Mostrar los 4 gráficos generales + Consolidado */
              <>
                {/* 1. Alcaldía Metropolitana (Manual) */}
                <div className="dash-widget widget-lg" style={{ minHeight: '270px' }}>
                  <div className="widget-header">
                    <div>
                      <h3 className="widget-title">Alcaldía Metropolitana (Manual)</h3>
                      <p className="widget-subtitle">Votos provinciales digitados</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="widget-badge" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        Total: {totalManualProv.toLocaleString()}
                      </span>
                      <span className="widget-badge">Barras</span>
                    </div>
                  </div>
                  <div className="widget-chart" style={{ height: '210px' }}>
                    <Bar data={createGlobalChartData(manualProv)} options={chartOptions} />
                  </div>
                </div>

                {/* 2. Alcaldía Distrital (Manual) */}
                <div className="dash-widget widget-lg" style={{ minHeight: '270px' }}>
                  <div className="widget-header">
                    <div>
                      <h3 className="widget-title">Alcaldía Distrital (Manual)</h3>
                      <p className="widget-subtitle">Votos distritales digitados</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="widget-badge" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        Total: {totalManualDist.toLocaleString()}
                      </span>
                      <span className="widget-badge">Barras</span>
                    </div>
                  </div>
                  <div className="widget-chart" style={{ height: '210px' }}>
                    <Bar data={createGlobalChartData(manualDist)} options={chartOptions} />
                  </div>
                </div>

                {/* 3. Alcaldía Metropolitana (OCR) */}
                <div className="dash-widget widget-lg" style={{ minHeight: '270px' }}>
                  <div className="widget-header">
                    <div>
                      <h3 className="widget-title">Alcaldía Metropolitana (OCR / Foto)</h3>
                      <p className="widget-subtitle">Votos procesados por imagen</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="widget-badge" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        Total: {totalOcrProv.toLocaleString()}
                      </span>
                      <span className="widget-badge">Barras</span>
                    </div>
                  </div>
                  <div className="widget-chart" style={{ height: '210px' }}>
                    <Bar data={createGlobalChartData(ocrProv)} options={chartOptions} />
                  </div>
                </div>

                {/* 4. Alcaldía Distrital (OCR) */}
                <div className="dash-widget widget-lg" style={{ minHeight: '270px' }}>
                  <div className="widget-header">
                    <div>
                      <h3 className="widget-title">Alcaldía Distrital (OCR / Foto)</h3>
                      <p className="widget-subtitle">Votos procesados por imagen</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="widget-badge" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        Total: {totalOcrDist.toLocaleString()}
                      </span>
                      <span className="widget-badge">Barras</span>
                    </div>
                  </div>
                  <div className="widget-chart" style={{ height: '210px' }}>
                    <Bar data={createGlobalChartData(ocrDist)} options={chartOptions} />
                  </div>
                </div>

                {/* 5. Resultado General Consolidado */}
                <div className="dash-widget widget-full" style={{ minHeight: '280px', marginBottom: '0.5rem' }}>
                  <div className="widget-header">
                    <div>
                      <h3 className="widget-title">Consolidado Lima Metropolitana</h3>
                      <p className="widget-subtitle">Total consolidado (Manual + OCR)</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="widget-badge" style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '0.85rem' }}>
                        Total: {totalLimaMetro.toLocaleString()}
                      </span>
                      <span className="widget-badge">Mesas: {data?.mesasEscrutadas || 0}</span>
                    </div>
                  </div>
                  <div className="widget-chart" style={{ height: '230px' }}>
                    <Bar data={createGlobalChartData(combinedLimaMetro)} options={chartOptions} />
                  </div>
                </div>
              </>
            )}

            {/* 6. Tabla Detallada de Todos los Partidos Políticos con Símbolos y Candidatos */}
            <div className="dash-widget widget-full" style={{ padding: '0.85rem' }}>
              <div className="widget-header" style={{ marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="widget-title">📋 Detalle de Partidos y Candidatos</h3>
                  <p className="widget-subtitle">
                    Candidatos para {filters.distrito ? `el distrito de ${filters.distrito}` : 'Lima Metropolitana'} con sus símbolos oficiales
                  </p>
                </div>
                {selectedPartyKey && (
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => updateFilter('partido', '')}
                    style={{ fontSize: '0.76rem', padding: '3px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    Ver Todos los Partidos
                  </button>
                )}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text3)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Símbolo</th>
                      <th style={{ padding: '8px 10px' }}>Partido / Tipo</th>
                      <th style={{ padding: '8px 10px' }}>Candidato Provincial</th>
                      <th style={{ padding: '8px 10px' }}>Candidato Distrital</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Votos Prov.</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Votos Dist.</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Votos</th>
                      <th style={{ padding: '8px 10px', width: '160px' }}>% Participación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...sortedParties, ...specialVotes].map(p => {
                      const isSelectedRow = selectedPartyKey === p.key;

                      return (
                        <tr
                          key={p.key}
                          onClick={() => {
                            if (p.key !== 'NULOS' && p.key !== 'VACIOS' && p.key !== 'IMPUGNADOS') {
                              updateFilter('partido', isSelectedRow ? '' : p.key);
                            }
                          }}
                          style={{
                            borderBottom: '1px solid var(--border-light, rgba(128,128,128,0.15))',
                            background: isSelectedRow ? 'var(--accent-glow)' : 'transparent',
                            outline: isSelectedRow ? `1.5px solid ${p.color}` : 'none',
                            cursor: p.key === 'NULOS' || p.key === 'VACIOS' || p.key === 'IMPUGNADOS' ? 'default' : 'pointer',
                            transition: 'background 0.15s'
                          }}
                          title={p.key === 'NULOS' || p.key === 'VACIOS' || p.key === 'IMPUGNADOS' ? '' : 'Haz clic para filtrar por este partido'}
                        >
                          <td style={{ padding: '8px 10px' }}>
                            {p.symbol ? (
                              <img
                                src={p.symbol}
                                alt={p.label}
                                style={{
                                  width: 24,
                                  height: 24,
                                  objectFit: 'contain',
                                  borderRadius: 'var(--radius-sm)',
                                  background: '#ffffff',
                                  padding: 2,
                                  border: '1px solid var(--border)'
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 'var(--radius-sm)',
                                  background: p.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  fontSize: '0.62rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {p.short?.substring(0, 3)}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{p.label}</span>
                              {isSelectedRow && (
                                <span style={{ fontSize: '0.62rem', background: p.color, color: '#ffffff', padding: '1px 4px', borderRadius: 2 }}>
                                  ACTIVO
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', color: p.candidatoProv !== 'Por designar' && p.candidatoProv !== '—' ? 'var(--accent)' : 'var(--text3)', fontWeight: 500 }}>
                            {p.candidatoProv}
                          </td>
                          <td style={{ padding: '8px 10px', color: p.candidatoDist !== 'Por designar' && p.candidatoDist !== '—' ? 'var(--accent-purple)' : 'var(--text3)', fontWeight: 500 }}>
                            {p.candidatoDist}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>
                            {p.provVotes.toLocaleString()}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--accent-purple)', fontWeight: 600 }}>
                            {p.distVotes.toLocaleString()}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>
                            {p.totalParty.toLocaleString()}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  borderRadius: 3,
                                  background: 'var(--bg3)',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(100, p.pct)}%`,
                                    height: '100%',
                                    background: p.color,
                                    borderRadius: 3
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, minWidth: '38px', color: 'var(--text2)' }}>
                                {p.pct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResultsView;
