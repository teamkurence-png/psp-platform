import api from '../lib/api';
import type { MerchantLeaderDashboard, Merchant, PaymentRequest, Commission } from '../types';

/**
 * Get merchant leader dashboard with aggregated stats
 */
export const getDashboard = async (): Promise<{ data: MerchantLeaderDashboard }> => {
  const response = await api.get('/merchant-leader/dashboard');
  return response.data;
};

/**
 * Get all merchants in the leader's group
 */
export const getGroupMerchants = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{
  data: {
    merchants: Merchant[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}> => {
  const response = await api.get('/merchant-leader/group-merchants', { params });
  return response.data;
};

/**
 * Get all payment requests from group merchants
 */
export const getGroupPaymentRequests = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  merchantId?: string;
}): Promise<{
  data: {
    paymentRequests: PaymentRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}> => {
  const response = await api.get('/merchant-leader/group-payment-requests', { params });
  return response.data;
};

/**
 * Get commission history for the merchant leader
 */
export const getCommissions = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  merchantId?: string;
}): Promise<{
  data: {
    commissions: Commission[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}> => {
  const response = await api.get('/merchant-leader/commissions', { params });
  return response.data;
};

export const merchantLeaderService = {
  getDashboard,
  getGroupMerchants,
  getGroupPaymentRequests,
  getCommissions,
};

export default merchantLeaderService;

