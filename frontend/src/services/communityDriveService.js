import api from './api';

export const communityDriveService = {
  async getCommunityDrives(params = {}) {
    const res = await api.get('/drives', { params });
    return res.data;
  },

  async getDriveById(id) {
    const res = await api.get(`/drives/${id}`);
    return res.data;
  },

  async createCommunityDrive(data) {
    const res = await api.post('/drives', data);
    return res.data;
  },
};

export default communityDriveService;
