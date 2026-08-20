import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const session = window.localStorage.getItem('auth.session');

    if (session) {
      const parsedSession = JSON.parse(session);
      if (parsedSession.accessToken) {
        config.headers.Authorization = `Bearer ${parsedSession.accessToken}`;
      }
    }
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Silent automatic token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints (login, register, refresh itself)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/forgot-password');

    if (error.response?.status === 401 && !isAuthEndpoint && originalRequest && !originalRequest._retry) {
      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }

      const rawSession = window.localStorage.getItem('auth.session');
      let session = null;
      try {
        session = rawSession ? JSON.parse(rawSession) : null;
      } catch (_e) {
        session = null;
      }

      const refreshToken = session?.refreshToken;

      // If no refresh token exists, redirect to login
      if (!refreshToken) {
        const currentPath = window.location.pathname;
        if (!['/login', '/register', '/'].includes(currentPath)) {
          window.localStorage.removeItem('auth.session');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const refreshResponse = await axios.post(`${refreshBaseUrl}/auth/refresh`, {
          refreshToken
        });

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.data?.refreshToken || refreshToken;

        if (newAccessToken) {
          const updatedSession = {
            ...session,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          };
          window.localStorage.setItem('auth.session', JSON.stringify(updatedSession));
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(originalRequest);
        } else {
          throw new Error('Refresh response missing access token');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        const currentPath = window.location.pathname;
        if (!['/login', '/register', '/'].includes(currentPath)) {
          window.localStorage.removeItem('auth.session');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);