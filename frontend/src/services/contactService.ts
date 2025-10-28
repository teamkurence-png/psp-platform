import { api } from '../lib/api';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactSubmission extends ContactFormData {
  id: number;
  createdAt: string;
}

export interface ContactSubmissionsResponse {
  submissions: ContactSubmission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const contactService = {
  // Submit contact form (public)
  async submitContactForm(data: ContactFormData): Promise<{ message: string }> {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  // Get all contact submissions (admin only)
  async getSubmissions(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ContactSubmissionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await api.get(`/contacts?${queryParams.toString()}`);
    return response.data.data;
  },
};

