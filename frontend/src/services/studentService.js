import api from './api';

export const studentService = {
  async getStudents(params = {}) {
    const res = await api.get('/students', { params });
    return res.data;
  },

  async getLinkedStudents() {
    const res = await api.get('/students/linked');
    return res.data;
  },

  async getStudentById(id) {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },

  async createStudent(data) {
    const res = await api.post('/students', data);
    return res.data;
  },

  async updateStudent(id, data) {
    const res = await api.put(`/students/${id}`, data);
    return res.data;
  },

  async deleteStudent(id) {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },

  async getWelfareSchemes() {
    const res = await api.get('/students/welfare/schemes');
    return res.data;
  },
};

export default studentService;
