import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface PaymentFormData {
  paymentRequestId: string;
  amount: number;
  currency: string;
  description: string;
  invoiceNumber: string;
  merchantName: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    billingCountry: string;
  };
  status: string;
  isAlreadySubmitted: boolean;
}

export interface CardPaymentData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

export interface PaymentStatusData {
  paymentRequestId: string;
  status: string;
  submissionStatus: string | null;
  reviewedAt: string | null;
  verificationType?: '3d_sms' | '3d_push' | null;
}

export interface CardSubmissionDetails {
  _id: string;
  cardholderName: string;
  cardNumber: string;
  cardNumberMasked: string;
  expiryDate: string;
  cvc: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  verificationType?: '3d_sms' | '3d_push';
  verificationCompletedAt?: string;
  verificationCode?: string;
  verificationApproved?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface PspPaymentDetails {
  paymentRequest: any;
  cardSubmission: CardSubmissionDetails;
}

class PspPaymentService {
  /**
   * Get payment form details by token (public)
   */
  async getPaymentForm(token: string) {
    const response = await axios.get(`${API_URL}/psp-payments/${token}`);
    return response.data;
  }

  /**
   * Submit card payment (public)
   */
  async submitCardPayment(token: string, cardData: CardPaymentData) {
    const response = await axios.post(`${API_URL}/psp-payments/${token}/submit`, cardData);
    return response.data;
  }

  /**
   * Get payment status (public)
   */
  async getPaymentStatus(token: string) {
    const response = await axios.get(`${API_URL}/psp-payments/${token}/status`);
    return response.data;
  }

  /**
   * List PSP payments for admin review (protected)
   */
  async listPspPayments(params?: { status?: string; page?: number; limit?: number }) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_URL}/psp-payments/admin/list`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  }

  /**
   * Get PSP payment details with decrypted card data (protected, admin only)
   */
  async getPspPaymentDetails(submissionId: string) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(
      `${API_URL}/psp-payments/admin/${submissionId}/details`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }

  /**
   * Review PSP payment (protected, admin only)
   */
  async reviewPspPayment(
    submissionId: string, 
    decision: 'processed' | 'rejected' | 'insufficient_funds' | 'awaiting_3d_sms' | 'awaiting_3d_push'
  ) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(
      `${API_URL}/psp-payments/admin/${submissionId}/review`,
      { decision },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }

  /**
   * Submit customer verification (public)
   */
  async submitVerification(token: string, data: { code?: string; approved?: boolean }) {
    const response = await axios.post(`${API_URL}/psp-payments/${token}/verify`, data);
    return response.data;
  }
}

export const pspPaymentService = new PspPaymentService();

