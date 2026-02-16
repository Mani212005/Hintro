import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '@/services/api';
import { clearSession, loadSession, saveSession } from '@/services/session';
import type { ApiSuccess, AuthResponseData, AuthUser } from '@/types/api';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;
  mode: 'login' | 'signup';
  initialized: boolean;
}

const existing = loadSession();

const initialState: AuthState = {
  token: existing?.token ?? null,
  refreshToken: existing?.refreshToken ?? null,
  user: existing?.user ?? null,
  status: existing?.token ? 'authenticated' : 'idle',
  error: null,
  mode: 'login',
  initialized: false
};

export const signup = createAsyncThunk(
  'auth/signup',
  async (payload: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiSuccess<AuthResponseData>>('/auth/signup', payload);
      return response.data.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message || 'Signup failed'
        : 'Signup failed';
      return rejectWithValue(message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiSuccess<AuthResponseData>>('/auth/login', payload);
      return response.data.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message || 'Login failed'
        : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const loadMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiSuccess<{ user: AuthUser }>>('/auth/me');
    return response.data.data.user;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message || 'Session check failed'
      : 'Session check failed';
    return rejectWithValue(message);
  }
});

export const refreshSessionThunk = createAsyncThunk(
  'auth/refresh',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const response = await axios.post<ApiSuccess<AuthResponseData>>(`${baseURL}/auth/refresh`, {
        refresh_token: refreshToken
      });
      return response.data.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message || 'Refresh failed'
        : 'Refresh failed';
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (refreshToken: string | null) => {
  if (!refreshToken) {
    return;
  }

  try {
    await api.post('/auth/logout', {
      refresh_token: refreshToken
    });
  } catch {
    // Ignore logout API failures and clear local session regardless.
  }
});

const persistSession = (state: AuthState): void => {
  if (state.token && state.refreshToken) {
    saveSession({
      token: state.token,
      refreshToken: state.refreshToken,
      user: state.user
    });
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthMode: (state, action: { payload: 'login' | 'signup' }) => {
      state.mode = action.payload;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearAuthSession: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      clearSession();
    },
    markInitialized: (state) => {
      state.initialized = true;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.token = action.payload.token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
        persistSession(state);
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.token = action.payload.token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
        persistSession(state);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      .addCase(loadMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        persistSession(state);
      })
      .addCase(loadMe.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      .addCase(refreshSessionThunk.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.status = 'authenticated';
        state.error = null;
        persistSession(state);
      })
      .addCase(refreshSessionThunk.rejected, (state) => {
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.status = 'idle';
        clearSession();
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.status = 'idle';
        state.error = null;
        clearSession();
      });
  }
});

export const { setAuthMode, clearAuthError, clearAuthSession, markInitialized } = authSlice.actions;
export default authSlice.reducer;
