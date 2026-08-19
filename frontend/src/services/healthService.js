import api from './api';

export const healthService = {
  /**
   * Check backend server & database health
   */
  async checkHealth() {
    const response = await api.get('/health');
    return response.data;
  },
};

export default healthService;
