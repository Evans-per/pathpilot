import axios from 'axios';

// Fetch base URL from environment or fallback to relative paths (Vite proxy handles dev)
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pathpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth revocation/expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized. Cleared local tokens.');
      localStorage.removeItem('pathpilot_token');
      localStorage.removeItem('pathpilot_user');
      
      // Dispatch custom event to notify auth context
      window.dispatchEvent(new Event('auth_expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
