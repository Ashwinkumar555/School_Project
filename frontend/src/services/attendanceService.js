import api from './api';

export const attendanceService = {
  async recordAttendance(data) {
    const res = await api.post('/attendance', data);
    return res.data;
  },

  async updateStudentAttendance(studentId, data) {
    const res = await api.put(`/attendance/student/${studentId}`, data);
    return res.data;
  },

  async getClassAttendance(classId, date) {
    const res = await api.get(`/attendance/class/${classId}`, { params: { date } });
    return res.data;
  },

  async getStudentAttendance(studentId) {
    const res = await api.get(`/attendance/student/${studentId}`);
    return res.data;
  },

  async getTodaySummary() {
    const res = await api.get('/attendance/today-summary');
    return res.data;
  },
};

export default attendanceService;
