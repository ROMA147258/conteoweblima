import apiClient from './apiClient';

export const resultsService = {
  async getResults(filters = {}) {
    const res = await apiClient.get('/results', filters);
    return res.data;
  }
};

export const mapService = {
  async getMapData(filter = {}) {
    const res = await apiClient.get('/map', filter);
    return res.data;
  }
};

export const comparisonService = {
  async getComparison(params = {}) {
    const res = await apiClient.get('/comparison', params);
    return res.data;
  }
};

export const coordinatorsService = {
  async getCoordinators(filter = {}) {
    const res = await apiClient.get('/coordinators', filter);
    return res.data;
  }
};

export const attendanceService = {
  async getAttendance(filter = {}) {
    const res = await apiClient.get('/attendance', filter);
    return res.data;
  }
};
