import api from './api';

export const communicationService = {
  getCommunications: async (params = {}) => {
    const response = await api.get('/communications', { params });
    return response.data;
  },

  createCommunication: async (data) => {
    const response = await api.post('/communications', data);
    return response.data;
  },

  replyCommunication: async (id, data) => {
    const response = await api.put(`/communications/${id}/reply`, data);
    return response.data;
  },
};

export default communicationService;
