import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/index';
import { UserRole } from '../types/index';
import api from './api';

interface AuthContextType {
  user: User | null;
  merchantId: string | null;
  loading: boolean;
  login: (email: string, password: string, twoFactorToken?: string) => Promise<{ requires2FA?: boolean }>;
  register: (email: string, password: string, legalName?: string) => Promise<{ pendingApproval?: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
      if (response.data.data.merchant) {
        setMerchantId(response.data.data.merchant._id);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    const response = await api.post('/auth/login', { 
      email, 
      password, 
      twoFactorToken 
    });

    if (response.data.requires2FA) {
      return { requires2FA: true };
    }

    const { user, accessToken, refreshToken, merchantId } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    if (merchantId) {
      setMerchantId(merchantId);
    }
    return {};
  };

  const register = async (email: string, password: string, legalName?: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      role: UserRole.MERCHANT,
      legalName,
    });

    // Check if merchant registration is pending approval
    if (response.data.message && response.data.message.includes('pending')) {
      return { 
        pendingApproval: true, 
        message: response.data.message 
      };
    }

    // For non-merchants or if tokens are provided
    const { user, accessToken, refreshToken } = response.data.data;
    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      
      // Refresh to get merchant data
      await refreshUser();
    }

    return {};
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setMerchantId(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, merchantId, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

