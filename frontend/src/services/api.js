import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
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

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => {
    const formData = new FormData();
    formData.append('username', data.email);
    formData.append('password', data.password);
    return api.post('/auth/login', formData);
  },
  getMe: () => api.get('/auth/me'),
};

// Digests API
export const digestsAPI = {
  getDigests: (limit = 10, skip = 0) => 
    api.get(`/digests/?limit=${limit}&skip=${skip}`),
  getDigest: (id) => api.get(`/digests/${id}`),
  getLatestDigest: (edition) => api.get(`/digests/latest/${edition}`),
};

// Articles API
export const articlesAPI = {
  saveArticle: (articleId) => 
    api.post('/articles/save', { article_id: articleId }),
  unsaveArticle: (articleId) => 
    api.delete(`/articles/save/${articleId}`),
  getSavedArticles: () => api.get('/articles/saved'),
  getArticle: (id) => api.get(`/articles/${id}`),
};

export default api;
