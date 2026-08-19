import api from './api';

export const impactService = {
  async getImpactStats() {
    const res = await api.get('/impact/stats');
    return res.data;
  },
};

export default impactService;
