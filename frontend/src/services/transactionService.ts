import api from '../lib/api';
import { TransactionStatus, PaymentMethod } from '../types';

export interface Transaction {
  _id: string;
  transactionId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  platformStatus: TransactionStatus;
  customerInfo?: {
    name?: string;
    email?: string;
  };
  description?: string;
  createdAt: string;
}

export const transactionService = {
  getAll: () => {
    return api.get<{ data: { transactions: Transaction[] } }>('/transactions');
  },

  getById: (id: string) => {
    return api.get<{ data: Transaction }>(`/transactions/${id}`);
  },
};

