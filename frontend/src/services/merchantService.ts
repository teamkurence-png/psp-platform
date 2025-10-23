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

export interface MerchantDocument {
  _id: string;
  type: string;
  fileName: string;
  filePath: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  rejectionReason?: string;
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

  // Get merchant documents
  async getDocuments(): Promise<MerchantDocument[]> {
    const response = await api.get('/merchants/documents');
    return response.data.data;
  },

  // Upload document
  async uploadDocument(type: string, file: File): Promise<MerchantDocument> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);

    const response = await api.post('/merchants/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/merchants/documents/${documentId}`);
  },
};

