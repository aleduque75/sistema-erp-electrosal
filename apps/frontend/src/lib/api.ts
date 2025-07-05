import axios from 'axios';

const api = axios.create({
  // A URL base deve apontar apenas para o servidor, sem /api
  baseURL: 'http://localhost:3000', 
});

// O interceptor continuará funcionando normalmente
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;