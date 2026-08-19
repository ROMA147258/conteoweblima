import apiClient from './apiClient';

export const mapService = {
  async getMapData(filter = {}) {
    const res = await apiClient.get('/map', filter);
    return res.data;
  }
};

export default mapService;
