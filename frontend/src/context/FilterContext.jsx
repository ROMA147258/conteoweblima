import React, { createContext, useContext, useState, useEffect } from 'react';
import { PROVINCIAS, ALL_DISTRITOS } from '../constants/locations';
import apiClient from '../services/apiClient';

const FilterContext = createContext(null);

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

  const [availableSchools, setAvailableSchools] = useState([]);
  const [availableMesas, setAvailableMesas] = useState([]);

  // Cargar lista de colegios y mesas según distrito
  useEffect(() => {
    async function loadLocations() {
      try {
        if (filters.distrito) {
          const res = await apiClient.get('/map', { distrito: filters.distrito });
          if (res.success && res.data?.colegios) {
            const uniqueSchools = Array.from(new Set(res.data.colegios.map(c => c.colegio))).filter(Boolean);
            setAvailableSchools(uniqueSchools);
          }
        } else {
          setAvailableSchools([]);
        }
      } catch (_) {}
    }
    loadLocations();
  }, [filters.distrito]);

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

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilter,
        resetFilters,
        provincias: PROVINCIAS,
        distritos: filters.provincia
          ? (PROVINCIAS.find(p => p.id === filters.provincia || p.name.toLowerCase() === filters.provincia.toLowerCase())?.distritos || ALL_DISTRITOS)
          : ALL_DISTRITOS,
        availableSchools,
        availableMesas
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
