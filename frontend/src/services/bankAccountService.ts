import api from '../lib/api';
import type { BankAccount } from '../types';

export const bankAccountService = {
  // Get all bank accounts
  getAll: async () => {
    const response = await api.get('/bank-accounts');
    return response.data;
  },

  // Get a single bank account
  getById: async (id: string) => {
    const response = await api.get(`/bank-accounts/${id}`);
    return response.data;
  },

  // Create a new bank account (admin only)
  create: async (data: Omit<BankAccount, '_id' | 'isActive' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/bank-accounts', data);
    return response.data;
  },

  // Update a bank account (admin only)
  update: async (id: string, data: Partial<BankAccount>) => {
    const response = await api.put(`/bank-accounts/${id}`, data);
    return response.data;
  },

  // Delete (soft delete) a bank account (admin only)
  delete: async (id: string) => {
    const response = await api.delete(`/bank-accounts/${id}`);
    return response.data;
  },
};

