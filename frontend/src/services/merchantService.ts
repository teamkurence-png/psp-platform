import { api } from '../lib/api';

export interface MerchantProfile {
  businessName: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  website: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swift: string;
    iban: string;
  };
}

export interface Merchant {
  _id: string;
  userId: string;
  profile: MerchantProfile;
  onboardingStatus: 'incomplete' | 'pending_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const merchantService = {
  // Get merchant profile
  async getProfile(): Promise<Merchant> {
    const response = await api.get('/merchants/profile');
    return response.data.data;
  },

  // Update merchant profile
  async updateProfile(profile: Partial<MerchantProfile>): Promise<Merchant> {
    const response = await api.put('/merchants/profile', { profile });
    return response.data.data;
  },

  // Submit profile for review
  async submitForReview(): Promise<Merchant> {
    const response = await api.post('/merchants/submit-review');
    return response.data.data;
  },

  // List all merchants (admin/ops)
  async listMerchants(params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await api.get(`/merchants/list?${queryParams.toString()}`);
    return response.data.data;
  },

  // Review merchant onboarding (admin/ops)
  async reviewMerchant(merchantId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
    const response = await api.post(`/merchants/${merchantId}/review`, {
      status,
      rejectionReason,
    });
    return response.data.data;
  },

  // Assign merchant to leader (admin only)
  async assignMerchantToLeader(merchantId: string, leaderId: string | null) {
    const response = await api.post(`/merchants/${merchantId}/assign-leader`, {
      leaderId,
    });
    return response.data.data;
  },

  // Toggle merchant leader status (admin only)
  async toggleMerchantLeader(merchantId: string, isMerchantLeader: boolean) {
    const response = await api.post(`/merchants/${merchantId}/toggle-leader`, {
      isMerchantLeader,
    });
    return response.data.data;
  },
};

