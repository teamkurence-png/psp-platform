import api from '../lib/api';
import { CryptoAsset, WithdrawalStatus } from '../types';

export interface Withdrawal {
  _id: string;
  asset: CryptoAsset;
  network: string;
  address: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  txHash?: string;
  confirmations?: number;
  explorerUrl?: string;
  failureReason?: string;
  createdAt: string;
}

export interface CreateWithdrawalDto {
  asset: CryptoAsset;
  network: string;
  address: string;
  amount: number;
}

export const withdrawalService = {
  getAll: () => {
    return api.get<{ data: { withdrawals: Withdrawal[] } }>('/withdrawals');
  },

  getById: (id: string) => {
    return api.get<{ data: Withdrawal }>(`/withdrawals/${id}`);
  },

  create: (data: CreateWithdrawalDto) => {
    return api.post<{ data: Withdrawal }>('/withdrawals', data);
  },
};


