import api from './api';

export const schoolNeedService = {
  async getSchoolNeeds(params = {}) {
    const res = await api.get('/school-needs', { params });
    return res.data;
  },

  async getSchoolNeedById(id) {
    const res = await api.get(`/school-needs/${id}`);
    return res.data;
  },

  async createSchoolNeed(data) {
    const res = await api.post('/school-needs', data);
    return res.data;
  },

  async updateSchoolNeed(id, data) {
    const res = await api.put(`/school-needs/${id}`, data);
    return res.data;
  },
};

export default schoolNeedService;
