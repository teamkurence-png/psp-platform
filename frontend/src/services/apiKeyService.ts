import api from '../lib/api';

export interface ApiKey {
  id: string;
  userId: string;
  prefix: string;
  name: string;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyWithToken extends ApiKey {
  fullKey: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: string;
}

/**
 * Create a new API key
 */
export const createApiKey = async (data: CreateApiKeyRequest): Promise<ApiKeyWithToken> => {
  const response = await api.post<{ data: ApiKeyWithToken }>('/api-keys', data);
  return response.data.data;
};

/**
 * List all API keys for the authenticated merchant
 */
export const listApiKeys = async (): Promise<ApiKey[]> => {
  const response = await api.get<{ data: ApiKey[] }>('/api-keys');
  return response.data.data;
};

/**
 * Get details of a specific API key
 */
export const getApiKey = async (id: string): Promise<ApiKey> => {
  const response = await api.get<{ data: ApiKey }>(`/api-keys/${id}`);
  return response.data.data;
};

/**
 * Revoke (deactivate) an API key
 */
export const revokeApiKey = async (id: string): Promise<void> => {
  await api.delete(`/api-keys/${id}`);
};

