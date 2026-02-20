// 🌐 Versão Corrigida do api.ts
import axios from "axios";
import { toast } from "sonner";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.electrosal.com.br";

// REMOVEMOS a lógica de adicionar /api automaticamente aqui, 
// pois o GlobalPrefix do Nest + Rewrites do Next já cuidam disso.
const api = axios.create({
  // No navegador, usamos caminhos relativos para aproveitar o proxy/rewrites do Next.js
  // Isso evita problemas de CORS e garante o envio de headers.
  baseURL: typeof window !== "undefined" ? "" : API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    // Garante prefixo /api se não for URL absoluta
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/api')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    // Tratamento de skipAuth de forma robusta
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
// ... resto do seu código de interceptor de resposta ...
export default api;