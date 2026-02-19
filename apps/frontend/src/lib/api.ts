// 🌐 Versão Corrigida do api.ts
import axios from "axios";
import { toast } from "sonner";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.electrosal.com.br";

// REMOVEMOS a lógica de adicionar /api automaticamente aqui, 
// pois o GlobalPrefix do Nest + Rewrites do Next já cuidam disso.
const api = axios.create({
  baseURL: API_BASE_URL.endsWith("/api") ? API_BASE_URL : API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    // Garante que toda requisição comece com /api se não tiver
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/api')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    if (config.headers.skipAuth) {
      delete config.headers.Authorization;
      delete config.headers.skipAuth;
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
// ... resto do seu código de interceptor de resposta ...
export default api;