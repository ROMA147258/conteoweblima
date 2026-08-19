import React, { useState } from 'react';
import { useFilters } from '../context/FilterContext';
import { PARTIES } from '../constants/parties';

export const FilterPanel = () => {
  const {
    filters,
    updateFilter,
    resetFilters,
    provincias,
    distritos,
    availableSchools
  } = useFilters();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleDropdown = (name) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
      setSearchTerm('');
    } else {
      setOpenDropdown(name);
      setSearchTerm('');
    }
  };

  const handleSelect = (key, value) => {
    updateFilter(key, value);
    setOpenDropdown(null);
    setSearchTerm('');
  };

  return (
    <div className="filter-panel" id="globalFilters">
      {/* Departamento */}
      <div className="filter-group filter-group-search">
        <label className="filter-label">Departamento</label>
        <select
          className="filter-select"
          value={filters.departamento}
          onChange={(e) => updateFilter('departamento', e.target.value)}
          style={{ minWidth: '110px' }}
        >
          <option value="Lima">Lima</option>
        </select>
      </div>

      {/* Provincia con buscador */}
      <div className="filter-group filter-group-search">
        <label className="filter-label">Provincia</label>
        <div className={`filt-dropdown ${openDropdown === 'provincia' ? 'open' : ''}`}>
          <div className="filt-dropdown-toggle" onClick={() => toggleDropdown('provincia')}>
            <span className="filt-selected-text">
              {filters.provincia
                ? (provincias.find(p => p.id === filters.provincia || p.name === filters.provincia)?.name || filters.provincia)
                : 'Todas las provincias'}
            </span>
            <span className="filt-arrow">▾</span>
          </div>
          {openDropdown === 'provincia' && (
            <div className="filt-dropdown-panel">
              <input
                className="filt-search-input"
                type="text"
                placeholder="Buscar provincia…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <ul className="filt-options-list">
                <li
                  className={!filters.provincia ? 'selected' : ''}
                  onClick={() => handleSelect('provincia', '')}
                >
                  Todas las provincias
                </li>
                {provincias
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(p => (
                    <li
                      key={p.id}
                      className={filters.provincia === p.id ? 'selected' : ''}
                      onClick={() => handleSelect('provincia', p.id)}
                    >
                      {p.name}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Distrito con buscador */}
      <div className="filter-group filter-group-search">
        <label className="filter-label">Distrito</label>
        <div className={`filt-dropdown ${openDropdown === 'distrito' ? 'open' : ''}`}>
          <div className="filt-dropdown-toggle" onClick={() => toggleDropdown('distrito')}>
            <span className="filt-selected-text">{filters.distrito || 'Todos los distritos'}</span>
            <span className="filt-arrow">▾</span>
          </div>
          {openDropdown === 'distrito' && (
            <div className="filt-dropdown-panel">
              <input
                className="filt-search-input"
                type="text"
                placeholder="Buscar distrito…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <ul className="filt-options-list">
                <li
                  className={!filters.distrito ? 'selected' : ''}
                  onClick={() => handleSelect('distrito', '')}
                >
                  Todos los distritos
                </li>
                {distritos
                  .filter(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(d => (
                    <li
                      key={d}
                      className={filters.distrito === d ? 'selected' : ''}
                      onClick={() => handleSelect('distrito', d)}
                    >
                      {d}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Colegio con buscador */}
      <div className="filter-group filter-group-search">
        <label className="filter-label">Colegio</label>
        <div className={`filt-dropdown ${openDropdown === 'colegio' ? 'open' : ''}`}>
          <div className="filt-dropdown-toggle" onClick={() => toggleDropdown('colegio')}>
            <span className="filt-selected-text">{filters.colegio || 'Todos los colegios'}</span>
            <span className="filt-arrow">▾</span>
          </div>
          {openDropdown === 'colegio' && (
            <div className="filt-dropdown-panel">
              <input
                className="filt-search-input"
                type="text"
                placeholder="Buscar colegio…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <ul className="filt-options-list">
                <li
                  className={!filters.colegio ? 'selected' : ''}
                  onClick={() => handleSelect('colegio', '')}
                >
                  Todos los colegios
                </li>
                {availableSchools
                  .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(c => (
                    <li
                      key={c}
                      className={filters.colegio === c ? 'selected' : ''}
                      onClick={() => handleSelect('colegio', c)}
                    >
                      {c}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mesa */}
      <div className="filter-group filter-group-search">
        <label className="filter-label">Mesa</label>
        <div className={`filt-dropdown ${openDropdown === 'mesa' ? 'open' : ''}`}>
          <div className="filt-dropdown-toggle" onClick={() => toggleDropdown('mesa')}>
            <span className="filt-selected-text">{filters.mesa || 'Todas las mesas'}</span>
            <span className="filt-arrow">▾</span>
          </div>
          {openDropdown === 'mesa' && (
            <div className="filt-dropdown-panel">
              <input
                className="filt-search-input"
                type="text"
                placeholder="Escribir número de mesa…"
                value={filters.mesa}
                onChange={(e) => updateFilter('mesa', e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* Partido */}
      <div className="filter-group filter-group-search">
        <label className="filter-label">Partido</label>
        <div className={`filt-dropdown ${openDropdown === 'partido' ? 'open' : ''}`}>
          <div className="filt-dropdown-toggle" onClick={() => toggleDropdown('partido')}>
            <span className="filt-selected-text">
              {filters.partido ? (PARTIES[filters.partido]?.label || filters.partido) : 'Todos los partidos'}
            </span>
            <span className="filt-arrow">▾</span>
          </div>
          {openDropdown === 'partido' && (
            <div className="filt-dropdown-panel">
              <ul className="filt-options-list">
                <li
                  className={!filters.partido ? 'selected' : ''}
                  onClick={() => handleSelect('partido', '')}
                >
                  Todos los partidos
                </li>
                {Object.entries(PARTIES).map(([k, p]) => (
                  <li
                    key={k}
                    className={filters.partido === k ? 'selected' : ''}
                    onClick={() => handleSelect('partido', k)}
                  >
                    <span className="filt-partido-dot" style={{ background: p.color }}></span>
                    {p.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Botón Reiniciar */}
      <div className="filter-group filter-group-search">
        <label className="filter-label">Acciones</label>
        <button
          className="filter-action-btn"
          onClick={resetFilters}
          title="Reiniciar todos los filtros"
        >
          <span>↺</span> Reiniciar
        </button>
      </div>
    </div>
  );
};
