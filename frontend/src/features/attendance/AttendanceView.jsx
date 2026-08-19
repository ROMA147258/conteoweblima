import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
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

export const AttendanceView = () => {
  const { filters } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    totalPersonerosRegistrados: 1661,
    primeraAsistencia: 1,
    segundaAsistencia: 0,
    distritosConReporte: 5
  };

  const conf1 = data?.charts?.conf1Global?.confirmados || 1;
  const falt1 = data?.charts?.conf1Global?.faltantes || 1660;

  const conf2 = data?.charts?.conf2Global?.confirmados || 0;
  const falt2 = data?.charts?.conf2Global?.faltantes || 1661;

  // Donut 1ª Asistencia (Apertura)
  const doughnut1Data = {
    labels: ['Confirmados 1ª Asist.', 'Faltantes 1ª Asist.'],
    datasets: [
      {
        data: [conf1, falt1],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Bar 1ª Asistencia por Distrito
  const distEntries1 = Object.entries(data?.charts?.conf1PorDistrito || { ATE: 4 });
  const bar1Data = {
    labels: distEntries1.length > 0 ? distEntries1.map(([k]) => k) : ['ATE'],
    datasets: [
      {
        label: 'Apertura por distrito',
        data: distEntries1.length > 0 ? distEntries1.map(([, v]) => v) : [4],
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ]
  };

  // Donut 2ª Asistencia (Cierre)
  const doughnut2Data = {
    labels: ['Confirmados 2ª Asist.', 'Faltantes 2ª Asist.'],
    datasets: [
      {
        data: [conf2, falt2],
        backgroundColor: ['#3b82f6', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };

  // Bar 2ª Asistencia por Distrito
  const bar2Data = {
    labels: ['Sin registros'],
    datasets: [
      {
        label: 'Cierre por distrito',
        data: [0],
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
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      }
    }
  };

  return (
    <section className="view active" id="view-apertura">
      <div className="view-header">
        <div>
          <h1 className="view-title">👥 Monitoreo de Personeros</h1>
          <p className="view-subtitle">
            Apertura y control de personeros sincronizado con la base de datos
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
              <span className="kpi-card-label">TOTAL PERSONEROS REGISTRADOS</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#10b981', padding: '0.85rem 1rem' }}>
            <span className="kpi-icon">🌅</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.primeraAsistencia}</span>
              <span className="kpi-card-label">1ª ASISTENCIA (APERTURA)</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#3b82f6', padding: '0.85rem 1rem' }}>
            <span className="kpi-icon">🌆</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.segundaAsistencia}</span>
              <span className="kpi-card-label">2ª ASISTENCIA (CIERRE)</span>
            </div>
          </div>

          <div className="kpi-card-pro" style={{ '--kpi-color': '#8b5cf6', padding: '0.85rem 1rem' }}>
            <span className="kpi-icon">📍</span>
            <div className="kpi-meta">
              <span className="kpi-card-value">{kpis.distritosConReporte}</span>
              <span className="kpi-card-label">DISTRITOS CON REPORTE</span>
            </div>
          </div>
        </div>

        {/* Grilla Simétrica de 4 Gráficos (4 columnas en fila simétrica y alineada) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {/* 1. 1ª Conf. Global */}
          <div className="dash-widget" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ color: '#10b981', fontSize: '0.85rem' }}>🌅 1ª Conf. Global</h3>
                <p className="widget-subtitle">Apertura 07:00 AM</p>
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
                <p className="widget-subtitle">Apertura por distrito</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, minHeight: 0, padding: '0.25rem' }}>
              <Bar data={bar1Data} options={barOptions} />
            </div>
          </div>

          {/* 3. 2ª Conf. Global */}
          <div className="dash-widget" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-header" style={{ paddingBottom: '0.4rem' }}>
              <div>
                <h3 className="widget-title" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>🌆 2ª Conf. Global</h3>
                <p className="widget-subtitle">Cierre 01:00-05:00 PM</p>
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
                <h3 className="widget-title" style={{ fontSize: '0.85rem' }}>🌆 2ª por Distrito</h3>
                <p className="widget-subtitle">Cierre por distrito</p>
              </div>
            </div>
            <div className="widget-chart" style={{ flex: 1, minHeight: 0, padding: '0.25rem' }}>
              <Bar data={bar2Data} options={barOptions} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AttendanceView;
