import api from '../lib/api';
import { CryptoAsset, WithdrawalSource, type Withdrawal } from '../types';

export type { Withdrawal };

export interface CreateWithdrawalDto {
  method: 'crypto' | 'bank_transfer';
  source?: WithdrawalSource;
  asset?: CryptoAsset;
  network?: string;
  address?: string;
  amount: number;
  currency?: string;
  // Bank transfer fields
  bankAccount?: string;
  iban?: string;
  swiftCode?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  beneficiaryName?: string;
}

export interface UpdateWithdrawalStatusDto {
  status: string;
  failureReason?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const withdrawalService = {
  getAll: (params?: { status?: string; limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    queryParams.append('limit', params?.limit?.toString() || '100');
    queryParams.append('page', params?.page?.toString() || '1');
    
    return api.get<{ data: { withdrawals: Withdrawal[]; pagination: PaginationData } }>(`/withdrawals?${queryParams.toString()}`);
  },

  getById: (id: string) => {
    return api.get<{ data: Withdrawal }>(`/withdrawals/${id}`);
  },

  create: (data: CreateWithdrawalDto) => {
    return api.post<{ data: Withdrawal }>('/withdrawals', data);
  },

  updateStatus: (id: string, data: UpdateWithdrawalStatusDto) => {
    return api.put<{ data: Withdrawal }>(`/withdrawals/${id}/status`, data);
  },
};


