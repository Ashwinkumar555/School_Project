import api from './api';

export const reportService = {
  async getSchoolSummaryReport() {
    const res = await api.get('/reports/school-summary');
    return res.data;
  },
};

export default reportService;
