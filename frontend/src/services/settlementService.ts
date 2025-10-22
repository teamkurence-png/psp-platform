import api from '../lib/api';

export interface Settlement {
  _id: string;
  settlementId: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'crypto';
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  failureReason?: string;
  settledAt?: string;
  createdAt: string;
}

export interface CreateSettlementDto {
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'crypto';
  destination: string;
}

export const settlementService = {
  getAll: () => {
    return api.get<{ data: { settlements: Settlement[] } }>('/settlements');
  },

  getById: (id: string) => {
    return api.get<{ data: Settlement }>(`/settlements/${id}`);
  },

  create: (data: CreateSettlementDto) => {
    return api.post<{ data: Settlement }>('/settlements', data);
  },
};

