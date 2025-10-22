import api from '../lib/api';
import { PaymentMethod, BankRail, PaymentRequestStatus } from '../types';

export interface PaymentRequest {
  _id: string;
  requestId: string;
  amount: number;
  currency: string;
  description?: string;
  invoiceNumber?: string;
  status: PaymentRequestStatus;
  paymentMethods: PaymentMethod[];
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    billingCountry?: string;
  };
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CreatePaymentRequestDto {
  amount: number;
  currency: string;
  description?: string;
  invoiceNumber?: string;
  dueDate?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    billingCountry: string;
  };
  paymentMethods: PaymentMethod[];
  bankDetails?: {
    rails: BankRail[];
  };
  cardSettings?: {
    require3DS: boolean;
  };
}

export const paymentRequestService = {
  getAll: () => {
    return api.get<{ data: { paymentRequests: PaymentRequest[] } }>('/payment-requests');
  },

  getById: (id: string) => {
    return api.get<{ data: PaymentRequest }>(`/payment-requests/${id}`);
  },

  create: (data: CreatePaymentRequestDto) => {
    return api.post<{ data: PaymentRequest }>('/payment-requests', data);
  },

  cancel: (id: string) => {
    return api.post(`/payment-requests/${id}/cancel`);
  },
};

