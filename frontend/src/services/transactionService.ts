import { api } from '../lib/api';
import { TransactionStatus, PaymentMethod } from '../types';

export interface Transaction {
  _id: string;
  transactionId: string;
  referenceCode: string;
  method: PaymentMethod;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  platformStatus: TransactionStatus;
  merchantConfirmation?: 'pending' | 'confirmed' | 'not_received';
  customer: {
    name: string;
    email: string;
  };
  customerInfo?: {
    name?: string;
    email?: string;
  };
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  status?: string;
  paymentMethod?: string;
  merchantConfirmation?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export const transactionService = {
  // Get all transactions with filters
  async getTransactions(filters?: TransactionFilters): Promise<{ transactions: Transaction[]; total: number }> {
    const response = await api.get('/transactions', { params: filters });
    return response.data.data;
  },

  // Legacy method for backward compatibility
  getAll: () => {
    return api.get<{ data: { transactions: Transaction[] } }>('/transactions');
  },

  // Get transaction by ID
  getById: (id: string) => {
    return api.get<{ data: Transaction }>(`/transactions/${id}`);
  },

  // Confirm transaction (merchant)
  async confirmTransaction(id: string, formData: FormData): Promise<Transaction> {
    const response = await api.post(`/transactions/${id}/confirm`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Review transaction (ops/admin)
  async reviewTransaction(id: string, decision: 'approve' | 'reject', notes?: string): Promise<Transaction> {
    const response = await api.post(`/transactions/${id}/review`, { decision, notes });
    return response.data.data;
  },
};

