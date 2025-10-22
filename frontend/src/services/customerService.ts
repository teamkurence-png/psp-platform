import api from '../lib/api';

export interface Customer {
  _id: string;
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  totalPaid: number;
  transactionCount: number;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
}

export const customerService = {
  getAll: () => {
    return api.get<{ data: { customers: Customer[] } }>('/customers');
  },

  getById: (id: string) => {
    return api.get<{ data: Customer }>(`/customers/${id}`);
  },
};

