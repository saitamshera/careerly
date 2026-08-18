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

// Auto-redirect to login on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Don't redirect if already on auth pages
      if (!['/login', '/register', '/'].includes(currentPath)) {
        window.localStorage.removeItem('auth.session');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);