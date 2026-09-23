import React, { createContext, useContext, useState, useEffect } from 'react';
import { PROVINCIAS, ALL_DISTRITOS } from '../constants/locations';
import apiClient from '../services/apiClient';

const FilterContext = createContext(null);

const LOCATIONS_CACHE_KEY = 'votoreal_locations_cache';
const LOCATIONS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Obtener datos iniciales desde caché de localStorage para 0 ms y 0 peticiones de red
const getInitialLocationsData = () => {
  try {
    const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.data && (Date.now() - (parsed.timestamp || 0) < LOCATIONS_CACHE_TTL)) {
        return parsed.data;
      }
    }
  } catch (_) {}
  return null;
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    departamento: 'Lima',
    provincia: '',
    distrito: '',
    colegio: '',
    mesa: '',
    partido: '',
    origen: ''
  });

  const [locationsData, setLocationsData] = useState(getInitialLocationsData);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [availableMesas, setAvailableMesas] = useState([]);

  // Cargar provincias, distritos y 2,214 colegios sincronizados con caché local
  useEffect(() => {
    async function loadAllLocations() {
      // Si ya tenemos datos válidos en localStorage, no transferimos megabytes repetidos
      const cached = getInitialLocationsData();
      if (cached && locationsData) {
        return;
      }

      try {
        const res = await apiClient.get('/locations');
        if (res.success && res.data) {
          setLocationsData(res.data);
          // Guardar en la memoria interna del teléfono (localStorage Cache)
          localStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify({
            data: res.data,
            timestamp: Date.now()
          }));
        }
      } catch (_) {}
    }
    loadAllLocations();
  }, []);

  // Cargar lista de colegios y mesas según distrito
  useEffect(() => {
    async function loadLocations() {
      if (!filters.distrito) {
        if (locationsData?.colegiosPorDistrito) {
          const all = Object.values(locationsData.colegiosPorDistrito).flat();
          setAvailableSchools(Array.from(new Set(all)).filter(Boolean).sort());
        }
        return;
      }

      if (locationsData?.colegiosPorDistrito) {
        const foundKey = Object.keys(locationsData.colegiosPorDistrito).find(
          k => k.trim().toLowerCase() === filters.distrito.trim().toLowerCase()
        );
        if (foundKey && locationsData.colegiosPorDistrito[foundKey]?.length) {
          setAvailableSchools(locationsData.colegiosPorDistrito[foundKey]);
          return;
        }
      }

      try {
        const res = await apiClient.get('/map', { distrito: filters.distrito });
        if (res.success && res.data?.colegios) {
          const uniqueSchools = Array.from(new Set(res.data.colegios.map(c => c.colegio))).filter(Boolean).sort();
          setAvailableSchools(uniqueSchools);
        }
      } catch (_) {}
    }
    loadLocations();
  }, [filters.distrito, locationsData]);

  const updateFilter = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Limpiar dependencias
      if (key === 'provincia') {
        next.distrito = '';
        next.colegio = '';
        next.mesa = '';
      } else if (key === 'distrito') {
        next.colegio = '';
        next.mesa = '';
      } else if (key === 'colegio') {
        next.mesa = '';
      }
      return next;
    });
  };

  const resetFilters = () => {
    setFilters({
      departamento: 'Lima',
      provincia: '',
      distrito: '',
      colegio: '',
      mesa: '',
      partido: '',
      origen: ''
    });
  };

  const currentProvincias = locationsData?.provincias || PROVINCIAS;
  const currentAllDistritos = locationsData?.distritos || ALL_DISTRITOS;

  let currentDistritos = currentAllDistritos;
  if (filters.provincia) {
    const selectedProv = currentProvincias.find(
      p => p.id === filters.provincia || p.name.toLowerCase() === filters.provincia.toLowerCase()
    );
    currentDistritos = selectedProv?.distritos || currentAllDistritos;
  }

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilter,
        resetFilters,
        provincias: currentProvincias,
        distritos: currentDistritos,
        availableSchools,
        availableMesas
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
