import api from './api';

export const supportRequestService = {
  /**
   * Get support requests for current logged in role
   * @param {Object} params - { status, category, priority }
   */
  async getSupportRequests(params = {}) {
    const res = await api.get('/support-requests', { params });
    return res.data;
  },

  /**
   * Get single support request details & history
   */
  async getSupportRequestById(id) {
    const res = await api.get(`/support-requests/${id}`);
    return res.data;
  },

  /**
   * Create a new support request (Parent or Village Local Head)
   */
  async createSupportRequest(data) {
    const res = await api.post('/support-requests', data);
    return res.data;
  },

  /**
   * Get eligible students for the current user (linked children or village students)
   */
  async getEligibleStudents() {
    const res = await api.get('/support-requests/eligible-students');
    return res.data;
  },

  /**
   * Get NGO directory for Head Master forwarding
   */
  async getNgos() {
    const res = await api.get('/support-requests/ngos');
    return res.data;
  },

  /**
   * Review and verify request (Head Master: Approve, Reject, Request Info, Forward)
   */
  async reviewSupportRequest(id, data) {
    const res = await api.put(`/support-requests/${id}/review`, data);
    return res.data;
  },

  /**
   * Respond to request (NGO: Accept, Reject, Complete)
   */
  async respondToSupportRequest(id, data) {
    const res = await api.put(`/support-requests/${id}/respond`, data);
    return res.data;
  },
};

export default supportRequestService;
