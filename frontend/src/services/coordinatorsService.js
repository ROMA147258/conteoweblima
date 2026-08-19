import apiClient from './apiClient';

export const coordinatorsService = {
  async getCoordinators(filter = {}) {
    const res = await apiClient.get('/coordinators', filter);
    return res.data;
  }
};

export default coordinatorsService;
