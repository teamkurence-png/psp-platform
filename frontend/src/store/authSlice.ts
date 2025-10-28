import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types/index';
import { UserRole } from '../types/index';
import api from '../lib/api';

interface AuthState {
  user: User | null;
  merchantId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  merchantId: null,
  loading: true,
  error: null,
};

// Async thunks
export const refreshUser = createAsyncThunk(
  'auth/refreshUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await api.get('/auth/me');
      return {
        user: response.data.data.user,
        merchantId: response.data.data.merchant?._id || null,
      };
    } catch (error: any) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh user');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password, twoFactorToken }: { email: string; password: string; twoFactorToken?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        twoFactorToken,
      });

      if (response.data.requires2FA) {
        return { requires2FA: true };
      }

      const { user, accessToken, refreshToken, merchantId } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      return {
        user,
        merchantId: merchantId || null,
        requires2FA: false,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    { email, password, legalName }: { email: string; password: string; legalName?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
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
          message: response.data.message,
        };
      }

      // For non-merchants or if tokens are provided
      const { user, accessToken, refreshToken } = response.data.data;
      if (accessToken && refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Refresh to get merchant data
        await dispatch(refreshUser());

        return {
          user,
          pendingApproval: false,
        };
      }

      return { pendingApproval: false };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch (error: any) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setMerchantId: (state, action: PayloadAction<string | null>) => {
      state.merchantId = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Refresh user
    builder
      .addCase(refreshUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.merchantId = action.payload.merchantId;
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.user = null;
        state.merchantId = null;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.requires2FA) {
          state.user = action.payload.user!;
          state.merchantId = action.payload.merchantId;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.merchantId = null;
      state.loading = false;
      state.error = null;
    });
  },
});

export const { clearError, setUser, setMerchantId } = authSlice.actions;
export default authSlice.reducer;

