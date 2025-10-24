import api from '../lib/api';

export const cardService = {
  // Get all cards
  getAll: async () => {
    const response = await api.get('/cards');
    return response.data;
  },

  // Get a single card
  getById: async (id: string) => {
    const response = await api.get(`/cards/${id}`);
    return response.data;
  },

  // Create a new card (admin only)
  create: async (data: { name: string; pspLink: string }) => {
    const response = await api.post('/cards', data);
    return response.data;
  },

  // Update a card (admin only)
  update: async (id: string, data: Partial<{ name: string; pspLink: string; isActive: boolean }>) => {
    const response = await api.put(`/cards/${id}`, data);
    return response.data;
  },

  // Delete (soft delete) a card (admin only)
  delete: async (id: string) => {
    const response = await api.delete(`/cards/${id}`);
    return response.data;
  },
};

