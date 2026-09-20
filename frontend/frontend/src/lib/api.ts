import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const DEFAULT_API_URL = 'https://elitex-vwym.onrender.com/api';

function normalizeApiUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_API_URL;
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : withoutTrailingSlash + '/api';
}

export const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const url = config.url ?? '';
  const isAuthRoute = [
    '/auth/login',
    '/auth/logout',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
  ].some((path) => url === path || url.startsWith(path + '?'));

  config.headers = config.headers ?? {};

  if (token && !isAuthRoute) {
    config.headers.Authorization = 'Bearer ' + token;
  }

  return config;
});

let refreshing: Promise<string | null> | null = null;

const refreshSafePaths = new Set([
  '/auth/login',
  '/auth/logout',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

function shouldAttemptRefresh(url?: string) {
  if (!url) {
    return true;
  }

  return !Array.from(refreshSafePaths).some((path) => url === path || url.startsWith(path + '?'));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && original && !original._retry && shouldAttemptRefresh(original?.url)) {
      original._retry = true;

      try {
        refreshing = refreshing ?? refreshAccessToken();

        const token = await refreshing;
        refreshing = null;

        if (token) {
          useAuthStore.getState().setAccessToken(token);
          original.headers = original.headers ?? {};
          original.headers.Authorization = 'Bearer ' + token;
          return api(original);
        }
      } catch {
        useAuthStore.getState().clear();
      }
    }

    return Promise.reject(error);
  }
);

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await api.post('/auth/refresh', {});

    return data.accessToken;
  } catch {
    return null;
  }
}
