import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let getToken: () => string | null = () => null;
let refreshAuth: (() => Promise<string | null>) | null = null;

export const registerApiAuth = (handlers: {
  getToken: () => string | null;
  refreshAuth: () => Promise<string | null>;
}): void => {
  getToken = handlers.getToken;
  refreshAuth = handlers.refreshAuth;
};

export const api = axios.create({
  baseURL,
  timeout: 15_000
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (!config || config._retry || status !== 401 || !refreshAuth) {
      throw error;
    }

    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/signup') || config.url?.includes('/auth/refresh')) {
      throw error;
    }

    config._retry = true;
    const token = await refreshAuth();
    if (!token) {
      throw error;
    }

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return api.request(config);
  }
);
