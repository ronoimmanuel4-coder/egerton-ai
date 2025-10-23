import axios from 'axios';

const DEFAULT_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

const resolveBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalNetwork =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.endsWith('.local');

    if (isLocalNetwork && DEFAULT_BACKEND_URL.includes('onrender')) {
      console.warn(
        '🔄 Overriding backend URL for local development. Using http://localhost:5001 instead of remote Render endpoint.'
      );
      return 'http://localhost:5001';
    }
  }

  return DEFAULT_BACKEND_URL;
};

const resolvedBackendUrl = resolveBackendUrl();

// Create axios instance with base URL
const api = axios.create({
  baseURL: resolvedBackendUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to ensure all requests use the baseURL
api.interceptors.request.use(config => {
  const backendUrl = resolveBackendUrl();

  // Update baseURL dynamically in case environment changed after initialization
  config.baseURL = backendUrl;

  // If the URL doesn't start with http, prepend the baseURL
  if (!config.url.startsWith('http') && !config.url.startsWith(backendUrl)) {
    config.url = `${backendUrl}${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  }
  return config;
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // Avoid full page reloads; let app-level logic handle navigation
      // Optionally emit an event to let the app react (e.g., logout, route change)
      try {
        const logoutEvent = new CustomEvent('auth:unauthorized');
        window.dispatchEvent(logoutEvent);
      } catch (_) {
        // no-op: CustomEvent may not be supported in some environments
      }
    }
    return Promise.reject(error);
  }
);

export default api;
