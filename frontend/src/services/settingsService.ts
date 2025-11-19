import { api } from '../lib/api';

export interface Setting {
  _id: string;
  merchantId: string;
  key: string;
  value: string;
  category: 'gateway' | 'bank' | 'crypto' | 'notification' | 'general';
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  email: string;
  role: 'merchant' | 'ops' | 'finance' | 'admin';
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export const settingsService = {
  // Get all settings
  async getSettings(category?: string): Promise<Setting[]> {
    const params = category ? { category } : {};
    const response = await api.get('/settings', { params });
    return response.data.data;
  },

  // Get single setting
  async getSetting(key: string): Promise<Setting> {
    const response = await api.get(`/settings/${key}`);
    return response.data.data;
  },

  // Update or create setting
  async updateSetting(key: string, value: string, category: string): Promise<Setting> {
    const response = await api.put(`/settings/${key}`, { value, category });
    return response.data.data;
  },

  // Delete setting
  async deleteSetting(key: string): Promise<void> {
    await api.delete(`/settings/${key}`);
  },

  // Admin: Get all users
  async getUsers(): Promise<User[]> {
    const response = await api.get('/auth/users');
    return response.data.data;
  },

  // Admin: Update user role
  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await api.put(`/auth/users/${userId}/role`, { role });
    return response.data.data;
  },

  // Admin: Deactivate user
  async deactivateUser(userId: string): Promise<void> {
    await api.put(`/auth/users/${userId}/deactivate`);
  },

  // Admin: Activate user
  async activateUser(userId: string): Promise<void> {
    await api.put(`/auth/users/${userId}/activate`);
  },

  // Admin: Update user password
  async updateUserPassword(userId: string, password: string): Promise<void> {
    await api.put(`/auth/users/${userId}/password`, { password });
  },
};

