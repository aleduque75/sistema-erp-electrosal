import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Proxy para o backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export { apiClient };
