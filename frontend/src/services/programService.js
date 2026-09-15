import api from './api';

export const programService = {
  /**
   * Get all published programs/scholarships
   * @param {Object} params - { type, status, search, myOnly }
   */
  async getPrograms(params = {}) {
    const res = await api.get('/programs', { params });
    return res.data;
  },

  /**
   * Get single program details
   */
  async getProgramById(id) {
    const res = await api.get(`/programs/${id}`);
    return res.data;
  },

  /**
   * Create and publish a new scholarship or program (NGO, Headmaster, Admin)
   */
  async createProgram(data) {
    const res = await api.post('/programs', data);
    return res.data;
  },

  /**
   * Update program details
   */
  async updateProgram(id, data) {
    const res = await api.put(`/programs/${id}`, data);
    return res.data;
  },

  /**
   * Delete or archive a program
   */
  async deleteProgram(id) {
    const res = await api.delete(`/programs/${id}`);
    return res.data;
  },
};

export default programService;
