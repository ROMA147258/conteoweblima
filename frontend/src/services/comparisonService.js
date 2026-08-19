import apiClient from './apiClient';

export const comparisonService = {
  async getComparison(params = {}) {
    const res = await apiClient.get('/comparison', params);
    return res.data;
  }
};

export default comparisonService;
