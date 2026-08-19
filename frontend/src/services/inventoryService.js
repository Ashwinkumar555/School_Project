import api from './api';

export const inventoryService = {
  async getInventory(params = {}) {
    const res = await api.get('/inventory', { params });
    return res.data;
  },

  async addInventoryItem(data) {
    const res = await api.post('/inventory', data);
    return res.data;
  },

  async updateInventoryItem(id, data) {
    const res = await api.put(`/inventory/${id}`, data);
    return res.data;
  },

  async getInventorySummary() {
    const res = await api.get('/inventory/summary');
    return res.data;
  },
};

export default inventoryService;
