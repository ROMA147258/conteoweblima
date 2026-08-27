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

  const [locationsData, setLocationsData] = useState(null);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [availableMesas, setAvailableMesas] = useState([]);

  // Cargar provincias, distritos y colegios sincronizados desde la BD
  useEffect(() => {
    async function loadAllLocations() {
      try {
        const res = await apiClient.get('/locations');
        if (res.success && res.data) {
          setLocationsData(res.data);
        }
      } catch (_) {}
    }
    loadAllLocations();
  }, []);

  // Cargar lista de colegios y mesas según distrito
  useEffect(() => {
    async function loadLocations() {
      if (!filters.distrito) {
        setAvailableSchools([]);
        return;
      }

      if (locationsData?.colegiosPorDistrito && locationsData.colegiosPorDistrito[filters.distrito]) {
        setAvailableSchools(locationsData.colegiosPorDistrito[filters.distrito]);
        return;
      }

      try {
        const res = await apiClient.get('/map', { distrito: filters.distrito });
        if (res.success && res.data?.colegios) {
          const uniqueSchools = Array.from(new Set(res.data.colegios.map(c => c.colegio))).filter(Boolean);
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
