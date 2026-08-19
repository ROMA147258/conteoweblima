import React, { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { resultsService } from '../../services/resultsService';
import { PARTIES, PARTY_KEYS } from '../../constants/parties';
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

export const ResultsView = () => {
  const { filters } = useFilters();
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

  const createChartData = (votesObj = {}) => {
    const labels = ['FP', 'JP', 'SP', 'FR', 'VE', 'MO', 'NULOS', 'VACIOS'];
    const partyData = [
      votesObj.FP || 0,
      votesObj.JP || 0,
      votesObj['SOMOS PERU'] || votesObj.SP || 0,
      votesObj.FREPAP || votesObj.FR || 0,
      votesObj.VERDE || votesObj.VE || 0,
      votesObj.MORADO || votesObj.MO || 0,
      votesObj.NULOS || 0,
      votesObj.VACIOS || 0
    ];

    const backgroundColors = labels.map(k => {
      if (k === 'SP') return PARTIES.SP.color;
      if (k === 'FR') return PARTIES.FR.color;
      if (k === 'VE') return PARTIES.VE.color;
      if (k === 'MO') return PARTIES.MO.color;
      return PARTIES[k]?.color || '#94a3b8';
    });

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw} votos`
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

  const manualProv = data?.desglose?.manualProvincial || {};
  const manualDist = data?.desglose?.manualDistrital || {};
  const ocrProv = data?.desglose?.ocrProvincial || {};
  const ocrDist = data?.desglose?.ocrDistrital || {};

  const totalManualProv = manualProv.TOTAL || 0;
  const totalManualDist = manualDist.TOTAL || 0;
  const totalOcrProv = ocrProv.TOTAL || 0;
  const totalOcrDist = ocrDist.TOTAL || 0;

  // Resultado Lima Metropolitana = Suma de Alcaldía Metropolitana Manual + Alcaldía Metropolitana OCR
  const combinedLimaMetro = {
    FP: (manualProv.FP || 0) + (ocrProv.FP || 0),
    JP: (manualProv.JP || 0) + (ocrProv.JP || 0),
    SP: (manualProv['SOMOS PERU'] || manualProv.SP || 0) + (ocrProv['SOMOS PERU'] || ocrProv.SP || 0),
    FR: (manualProv.FREPAP || manualProv.FR || 0) + (ocrProv.FREPAP || ocrProv.FR || 0),
    VE: (manualProv.VERDE || manualProv.VE || 0) + (ocrProv.VERDE || ocrProv.VE || 0),
    MO: (manualProv.MORADO || manualProv.MO || 0) + (ocrProv.MORADO || ocrProv.MO || 0),
    NULOS: (manualProv.NULOS || 0) + (ocrProv.NULOS || 0),
    VACIOS: (manualProv.VACIOS || 0) + (ocrProv.VACIOS || 0)
  };

  const totalLimaMetro = totalManualProv + totalOcrProv;

  const getPartyTotal = (partyKey) => {
    return combinedLimaMetro[partyKey] || 0;
  };

  const getPartyPct = (partyKey) => {
    if (!totalLimaMetro || totalLimaMetro === 0) return '0%';
    const votes = getPartyTotal(partyKey);
    return `${((votes / totalLimaMetro) * 100).toFixed(1)}%`;
  };

  return (
    <section className="view active" id="view-dashboard">
      <div className="view-header">
        <div>
          <h1 className="view-title">Dashboard de Resultados</h1>
          <p className="view-subtitle">
            Lima (todas) · Mostrando datos de: {filters.distrito ? `Lima (${filters.distrito})` : 'Lima (todas)'}
          </p>
        </div>

        <div className="view-actions">
          <div className="header-stats">
            <div className="stat-pill party-pill" style={{ '--c': '#c41e3a' }}>
              FP <strong>{getPartyPct('FP')}</strong>
            </div>
            <div className="stat-pill party-pill" style={{ '--c': '#e07b39' }}>
              JP <strong>{getPartyPct('JP')}</strong>
            </div>
            <div className="stat-pill party-pill" style={{ '--c': '#1a8a7d' }}>
              SP <strong>{getPartyPct('SOMOS PERU')}</strong>
            </div>
            <div className="stat-pill party-pill" style={{ '--c': '#2c5282' }}>
              FR <strong>{getPartyPct('FREPAP')}</strong>
            </div>
            <div className="stat-pill party-pill" style={{ '--c': '#38a169' }}>
              VE <strong>{getPartyPct('VERDE')}</strong>
            </div>
            <div className="stat-pill party-pill" style={{ '--c': '#6b46c1' }}>
              MO <strong>{getPartyPct('MORADO')}</strong>
            </div>
          </div>
          <button className="btn-secondary btn-sm" title="Marcar vista como favorita">
            ★ Favorito
          </button>
        </div>
      </div>

      <div className="dashboard-scroll" id="dashboardContent">
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
            {/* 1. Alcaldía Metropolitana (Manual) */}
            <div className="dash-widget widget-lg">
              <div className="widget-header">
                <div>
                  <h3 className="widget-title">Alcaldía Metropolitana (Manual)</h3>
                  <p className="widget-subtitle">Votos provinciales</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="widget-badge" style={{ color: '#0284c7', fontWeight: 700 }}>
                    Total: {totalManualProv}
                  </span>
                  <span className="widget-badge">Barras Verticales</span>
                </div>
              </div>
              <div className="widget-chart">
                <Bar data={createChartData(manualProv)} options={chartOptions} />
              </div>
            </div>

            {/* 2. Alcaldía Distrital (Manual) */}
            <div className="dash-widget widget-lg">
              <div className="widget-header">
                <div>
                  <h3 className="widget-title">Alcaldía Distrital (Manual)</h3>
                  <p className="widget-subtitle">Votos distritales</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="widget-badge" style={{ color: '#0284c7', fontWeight: 700 }}>
                    Total: {totalManualDist}
                  </span>
                  <span className="widget-badge">Barras Verticales</span>
                </div>
              </div>
              <div className="widget-chart">
                <Bar data={createChartData(manualDist)} options={chartOptions} />
              </div>
            </div>

            {/* 3. Alcaldía Metropolitana (OCR) */}
            <div className="dash-widget widget-lg">
              <div className="widget-header">
                <div>
                  <h3 className="widget-title">Alcaldía Metropolitana (OCR)</h3>
                  <p className="widget-subtitle">Votos provinciales</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="widget-badge" style={{ color: '#0284c7', fontWeight: 700 }}>
                    Total: {totalOcrProv}
                  </span>
                  <span className="widget-badge">Barras Verticales</span>
                </div>
              </div>
              <div className="widget-chart">
                <Bar data={createChartData(ocrProv)} options={chartOptions} />
              </div>
            </div>

            {/* 4. Alcaldía Distrital (OCR) */}
            <div className="dash-widget widget-lg">
              <div className="widget-header">
                <div>
                  <h3 className="widget-title">Alcaldía Distrital (OCR)</h3>
                  <p className="widget-subtitle">Votos distritales</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="widget-badge" style={{ color: '#0284c7', fontWeight: 700 }}>
                    Total: {totalOcrDist}
                  </span>
                  <span className="widget-badge">Barras Verticales</span>
                </div>
              </div>
              <div className="widget-chart">
                <Bar data={createChartData(ocrDist)} options={chartOptions} />
              </div>
            </div>

            {/* 5. Resultado LimaMetropolitana */}
            <div className="dash-widget widget-full">
              <div className="widget-header">
                <div>
                  <h3 className="widget-title">Resultado LimaMetropolitana</h3>
                  <p className="widget-subtitle">Lima (todas)</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="widget-badge" style={{ color: '#0284c7', fontWeight: 700 }}>
                    Total: {totalLimaMetro}
                  </span>
                  <span className="widget-badge">Barras Verticales</span>
                </div>
              </div>
              <div className="widget-chart" style={{ height: '260px' }}>
                <Bar data={createChartData(combinedLimaMetro)} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResultsView;
