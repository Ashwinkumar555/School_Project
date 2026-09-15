import api from './api';

export const supportRecordService = {
  /**
   * Get support records (filtered by NGO or institution)
   * @param {Object} params - { supportType, status, recipientType, search }
   */
  async getSupportRecords(params = {}) {
    const res = await api.get('/support-records', { params });
    return res.data;
  },

  /**
   * Record new educational support provided (Books, Uniforms, Bags, Laptops, Scholarships)
   */
  async createSupportRecord(data) {
    const res = await api.post('/support-records', data);
    return res.data;
  },

  /**
   * Update support record
   */
  async updateSupportRecord(id, data) {
    const res = await api.put(`/support-records/${id}`, data);
    return res.data;
  },

  /**
   * Delete support record
   */
  async deleteSupportRecord(id) {
    const res = await api.delete(`/support-records/${id}`);
    return res.data;
  },

  /**
   * Get NGO impact and reports statistics
   */
  async getNgoImpactStats() {
    const res = await api.get('/support-records/impact');
    return res.data;
  },
};

export default supportRecordService;
