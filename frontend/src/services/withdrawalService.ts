import api from '../lib/api';
import { CryptoAsset, type Withdrawal } from '../types';

export type { Withdrawal };

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


