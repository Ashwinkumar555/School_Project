import api from './api';

export const contributionService = {
  async submitContribution(data) {
    const res = await api.post('/contributions', data);
    return res.data;
  },

  async getContributions(params = {}) {
    const res = await api.get('/contributions', { params });
    return res.data;
  },

  async reviewContribution(id, action, adminRemarks = '') {
    const res = await api.put(`/contributions/${id}/review`, { action, adminRemarks });
    return res.data;
  },

  async markAsReceived(id, physicalDetails = {}) {
    const res = await api.post(`/contributions/${id}/mark-received`, physicalDetails);
    return res.data;
  },
};

export default contributionService;
