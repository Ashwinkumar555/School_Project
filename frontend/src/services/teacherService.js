import api from './api';

export const teacherService = {
  async getTeachers() {
    const res = await api.get('/teachers');
    return res.data;
  },

  async createTeacher(data) {
    const res = await api.post('/teachers', data);
    return res.data;
  },

  async updateTeacher(id, data) {
    const res = await api.put(`/teachers/${id}`, data);
    return res.data;
  },

  async deleteTeacher(id) {
    const res = await api.delete(`/teachers/${id}`);
    return res.data;
  },

  async assignTeacher(data) {
    const res = await api.post('/teachers/assign', data);
    return res.data;
  },
};

export default teacherService;
