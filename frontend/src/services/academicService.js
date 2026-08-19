import api from './api';

export const academicService = {
  async recordMarks(data) {
    const res = await api.post('/academics/marks', data);
    return res.data;
  },

  async updateMarks(recordId, data) {
    const res = await api.put(`/academics/marks/${recordId}`, data);
    return res.data;
  },

  async getStudentMarks(studentId) {
    const res = await api.get(`/academics/student/${studentId}`);
    return res.data;
  },
};

export default academicService;
