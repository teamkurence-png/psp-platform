import api from '../lib/api';

export interface Balance {
  _id: string;
  currency: string;
  available: number;
  pending: number;
  total: number;
  updatedAt: string;
}

export const balanceService = {
  getAll: () => {
    return api.get<{ data: { balances: Balance[] } }>('/balances');
  },
};


