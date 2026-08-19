import api from './api';

export const earlyAttentionService = {
  async getDashboard() {
    const res = await api.get('/early-attention/dashboard');
    return res.data;
  },

  async getStudentProfile(studentId) {
    const res = await api.get(`/early-attention/student/${studentId}`);
    return res.data;
  },

  async addIntervention(data) {
    const res = await api.post('/early-attention/interventions', data);
    return res.data;
  },

  async reevaluateAll() {
    const res = await api.post('/early-attention/re-evaluate');
    return res.data;
  },
};

export default earlyAttentionService;
