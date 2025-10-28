import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login as loginAction, register as registerAction, logout as logoutAction, refreshUser as refreshUserAction } from '../store/authSlice';
import type { User } from '../types/index';

interface UseAuthReturn {
  user: User | null;
  merchantId: string | null;
  loading: boolean;
  login: (email: string, password: string, twoFactorToken?: string) => Promise<{ requires2FA?: boolean }>;
  register: (email: string, password: string, legalName?: string) => Promise<{ pendingApproval?: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const { user, merchantId, loading } = useAppSelector((state) => state.auth);

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    const result = await dispatch(loginAction({ email, password, twoFactorToken }));
    
    if (loginAction.fulfilled.match(result)) {
      if (result.payload.requires2FA) {
        return { requires2FA: true };
      }
      return {};
    }
    
    throw new Error('Login failed');
  };

  const register = async (email: string, password: string, legalName?: string) => {
    const result = await dispatch(registerAction({ email, password, legalName }));
    
    if (registerAction.fulfilled.match(result)) {
      if (result.payload.pendingApproval) {
        return {
          pendingApproval: true,
          message: result.payload.message,
        };
      }
      return {};
    }
    
    throw new Error('Registration failed');
  };

  const logout = async () => {
    await dispatch(logoutAction());
  };

  const refreshUser = async () => {
    await dispatch(refreshUserAction());
  };

  return {
    user,
    merchantId,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };
};

