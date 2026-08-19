import api from './api';

export const announcementService = {
  async getAnnouncements() {
    const res = await api.get('/announcements');
    return res.data;
  },

  async createAnnouncement(data) {
    const res = await api.post('/announcements', data);
    return res.data;
  },
};

export default announcementService;
