import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
};

// Institution endpoints
export const institutionAPI = {
  getAll: (params = {}) => api.get('/institutions', { params }),
  getById: (id) => api.get(`/institutions/${id}`),
};

// AI endpoints
export const aiAPI = {
  chat: (message, context) => api.post('/ai/chat', { message, context }),
  generateMnemonic: (topic) => api.post('/ai/mnemonic', { topic }),
  predictExam: (courseId) => api.get(`/ai/predict-exam/${courseId}`),
  analyzeProgress: () => api.get('/ai/progress'),
};

// Course endpoints
export const courseAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  getByInstitution: (institutionId, params = {}) =>
    api.get('/courses', { params: { institution: institutionId, ...params } }),
  enroll: (courseId) => api.post(`/courses/${courseId}/enroll`),
  getMaterials: (courseId) => api.get(`/courses/${courseId}/materials`),
  getUnitsForYear: (courseId, year) => api.get(`/courses/${courseId}/units/${year}`),
};

// Study planner endpoints
export const plannerAPI = {
  getEvents: () => api.get('/planner/events'),
  createEvent: (event) => api.post('/planner/events', event),
  updateEvent: (id, event) => api.put(`/planner/events/${id}`, event),
  deleteEvent: (id) => api.delete(`/planner/events/${id}`),
};

export default api;
