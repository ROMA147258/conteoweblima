import apiClient from './apiClient';

export const attendanceService = {
  async getAttendance(filter = {}) {
    const res = await apiClient.get('/attendance', filter);
    return res.data;
  }
};

export default attendanceService;
