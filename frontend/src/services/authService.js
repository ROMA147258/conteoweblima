import apiClient from './apiClient';

export const authService = {
  async login(username, password) {
    const res = await apiClient.post('/auth/login', { username, password });
    if (res.success && res.token) {
      localStorage.setItem('votoreal_token', res.token);
      localStorage.setItem('votoreal_user', JSON.stringify(res.user));
    }
    return res;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (_) {}
    localStorage.removeItem('votoreal_token');
    localStorage.removeItem('votoreal_user');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('votoreal_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (_) {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('votoreal_token');
  }
};
