import React, { useState, useEffect, useRef } from 'react';
import { useFilters } from '../../context/FilterContext';
import { mapService } from '../../services/mapService';
import { DISTRICT_COORDS } from '../../constants/locations';
import { PARTIES } from '../../constants/parties';
import L from 'leaflet';

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};

export const MapView = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [mapData, setMapData] = useState(null);
  const [mapStyle, setMapStyle] = useState('light');
  const [selectedSchool, setSelectedSchool] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await mapService.getMapData({ distrito: filters.distrito });
        setMapData(res);
      } catch (err) {
        console.error('Error al cargar datos del mapa:', err);
      }
    }
    loadData();
  }, [filters.distrito]);

  // Inicializar mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-12.0464, -77.0428], 11);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      tileLayerRef.current = L.tileLayer(TILE_URLS[mapStyle], { maxZoom: 19 }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep instance alive during state updates
    };
  }, []);

  // Cambiar estilo de mapa (claro, oscuro, satélite, calle)
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = L.tileLayer(TILE_URLS[mapStyle], { maxZoom: 19 }).addTo(mapInstanceRef.current);
    }
  }, [mapStyle]);

  // Renderizar marcadores de colegios y distritos
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !mapData) return;

    markersLayerRef.current.clearLayers();

    // 1. Si hay filtro de distrito o colegios con coordenadas
    const schoolsWithCoords = (mapData.colegios || []).filter(s => s.latitud && s.longitud);

    if (schoolsWithCoords.length > 0 && filters.distrito) {
      schoolsWithCoords.forEach(s => {
        const hasVotes = s.totalVotos > 0;
        const color = hasVotes ? '#0284c7' : '#94a3b8';

        const marker = L.circleMarker([s.latitud, s.longitud], {
          radius: hasVotes ? 8 : 6,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        });

        marker.bindTooltip(
          `<strong>${s.colegio}</strong><br>Mesas: ${s.numMesas} | Votos: ${s.totalVotos}`,
          { direction: 'top' }
        );

        marker.on('click', () => {
          setSelectedSchool(s);
        });

        markersLayerRef.current.addLayer(marker);
      });

      // Centrar en el primer colegio o en coordenadas de distrito
      if (DISTRICT_COORDS[filters.distrito]) {
        mapInstanceRef.current.setView(DISTRICT_COORDS[filters.distrito], 13);
      } else if (schoolsWithCoords[0]) {
        mapInstanceRef.current.setView([schoolsWithCoords[0].latitud, schoolsWithCoords[0].longitud], 13);
      }
    } else {
      // 2. Vista General de Distritos de Lima
      Object.entries(DISTRICT_COORDS).forEach(([dist, coords]) => {
        const distRes = mapData.distritosResumen?.[dist.toUpperCase()];
        const totalVotos = distRes?.totalVotos || 0;
        const hasVotes = totalVotos > 0;
        const color = hasVotes ? '#1565c0' : '#94a3b8';

        const marker = L.circleMarker(coords, {
          radius: 8 + Math.min(totalVotos / 500, 8),
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        });

        marker.bindTooltip(
          `<strong>${dist}</strong><br>Votos: ${totalVotos}`,
          { direction: 'top' }
        );

        marker.on('click', () => {
          updateFilter('distrito', dist);
        });

        markersLayerRef.current.addLayer(marker);
      });

      mapInstanceRef.current.setView([-12.0464, -77.0428], 11);
    }
  }, [mapData, filters.distrito]);

  const totalMesasEsp = mapData?.totalMesasEsperadas || 3648;
  const totalMesasEsc = mapData?.totalMesasEscrutadas || 1;
  const totalVotos = mapData?.totalVotos || 8;
  const avancePct = ((totalMesasEsc / totalMesasEsp) * 100).toFixed(1);

  return (
    <section className="view active" id="view-mapa">
      <div className="view-header">
        <div>
          <h1 className="view-title">🗺️ Mapa Electoral Interactivo</h1>
          <p className="view-subtitle">
            Visualización geográfica · {filters.distrito ? `Lima — ${filters.distrito}` : 'Lima (todas)'}
          </p>
        </div>
        <div className="view-actions">
          <div className="header-stats">
            <div className="stat-pill">
              <span className="stat-pill-label">Mesas</span>
              <span className="stat-pill-value">{totalMesasEsc}/{totalMesasEsp}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-label">Votos</span>
              <span className="stat-pill-value">{totalVotos}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-label">Distritos</span>
              <span className="stat-pill-value">48</span>
            </div>
          </div>
          <button
            className="btn-secondary btn-sm"
            onClick={() => updateFilter('distrito', '')}
            title="Volver a vista general de Lima"
          >
            ⌂ Lima
          </button>
        </div>
      </div>

      {/* PANEL DE ESTADÍSTICAS ENCIMA DEL MAPA */}
      <div className="map-stats-bar">
        {/* Partido Líder */}
        <div className="map-stat-card map-stat-leader">
          <div className="map-stat-icon">🏆</div>
          <div className="map-stat-body">
            <div className="map-stat-label">Partido Líder</div>
            <div className="map-stat-value">NULOS</div>
            <div className="map-stat-sub">NULOS · 75.0%</div>
          </div>
        </div>

        {/* Avance de Escrutinio */}
        <div className="map-stat-card">
          <div className="map-stat-icon">📊</div>
          <div className="map-stat-body">
            <div className="map-stat-label">Avance de Escrutinio</div>
            <div className="map-stat-value">{avancePct}%</div>
            <div className="map-avance-bar">
              <div className="map-avance-fill" style={{ width: `${Math.max(avancePct, 1)}%` }}></div>
            </div>
            <div className="map-stat-sub">{totalMesasEsc} de {totalMesasEsp} mesas</div>
          </div>
        </div>

        {/* Zona Activa */}
        <div className="map-stat-card">
          <div className="map-stat-icon">📍</div>
          <div className="map-stat-body">
            <div className="map-stat-label">Zona Activa</div>
            <div className="map-stat-value">
              {filters.distrito ? filters.distrito : 'Lima (todas)'}
            </div>
            <div className="map-stat-sub">
              Nivel: {filters.distrito ? 'distrito' : 'lima · 48 distrito(s)'}
            </div>
          </div>
        </div>
      </div>

      <div className="map-layout">
        <div className="map-container">
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>

          {/* CUADRO FLOTANTE INDICADOR DEL MAPA */}
          <div className="map-legend-floating">
            <div className="map-legend-floating-section">
              <h4 className="floating-section-title">🎨 Estilo del mapa</h4>
              <div className="map-style-btns-mini">
                <button
                  className={`style-btn-mini ${mapStyle === 'dark' ? 'active' : ''}`}
                  onClick={() => setMapStyle('dark')}
                >
                  🌙 Oscuro
                </button>
                <button
                  className={`style-btn-mini ${mapStyle === 'light' ? 'active' : ''}`}
                  onClick={() => setMapStyle('light')}
                >
                  ☀️ Claro
                </button>
                <button
                  className={`style-btn-mini ${mapStyle === 'streets' ? 'active' : ''}`}
                  onClick={() => setMapStyle('streets')}
                >
                  🗺️ Calle
                </button>
                <button
                  className={`style-btn-mini ${mapStyle === 'satellite' ? 'active' : ''}`}
                  onClick={() => setMapStyle('satellite')}
                >
                  🛰️ Satélite
                </button>
              </div>
            </div>

            <div className="map-legend-floating-section">
              <h4 className="floating-section-title">🏆 Top Distritos Activos</h4>
              <div style={{ fontSize: '0.68rem', color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>1</strong> ATE</span>
                  <span style={{ fontWeight: 700 }}>8</span>
                </div>
              </div>
            </div>

            <div className="map-legend-floating-actions">
              <button
                className="map-action-btn-mini"
                onClick={() => updateFilter('distrito', '')}
              >
                ⌂ Vista general
              </button>
              <button className="map-action-btn-mini" onClick={resetFilters}>
                ↺ Reiniciar
              </button>
            </div>
          </div>

          {/* Modal Overlay al hacer clic en un local escolar */}
          {selectedSchool && (
            <div className="map-overlay">
              <button className="overlay-close" onClick={() => setSelectedSchool(null)}>✕</button>
              <div className="map-overlay-header">
                <h3>{selectedSchool.colegio}</h3>
                <div className="map-overlay-subtitle">
                  {selectedSchool.distrito} · {selectedSchool.direccion || 'Lima'}
                </div>
              </div>
              <div className="map-overlay-body" style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                  <strong>Mesas:</strong> {selectedSchool.numMesas}
                </div>
                <div style={{ fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                  <strong>Total Votos Escrutados:</strong> {selectedSchool.totalVotos}
                </div>
              </div>
            </div>
          )}

          {/* Hint de ayuda de zoom */}
          <div className="map-zoom-hint">
            Haz clic en un distrito o colegio para ver detalles
          </div>
        </div>
      </div>
    </section>
  );
};
