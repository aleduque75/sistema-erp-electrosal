// 🌐 Versão Corrigida do api.ts
import axios from "axios";
import { toast } from "sonner";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.electrosal.com.br";

const api = axios.create({
  baseURL: typeof window !== "undefined" ? "" : API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/api')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    if (config.headers && (config.headers as any).skipAuth) {
      delete (config.headers as any).skipAuth;
      return config;
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const isPublicPage = window.location.pathname === '/' || window.location.pathname === '/login';
        localStorage.removeItem("token");
        if (!isPublicPage) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;