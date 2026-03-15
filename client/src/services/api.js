import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
};

export const projectAPI = {
    create: (data) => api.post('/projects', data),
    getAll: () => api.get('/projects'),
    uploadCode: (projectId, data) => api.post(`/projects/${projectId}/upload`, data),
    migrate: (projectId, data) => api.post(`/projects/${projectId}/migrate`, data),
    getMigrations: (projectId) => api.get(`/projects/${projectId}/migrations`),
    delete: (projectId) => api.delete(`/projects/${projectId}`),
};

export default api;
