import axios from "axios";
import { toast } from "sonner";

// 🌐 Configuração dinâmica de API baseada no ambiente
// Desenvolvimento: http://localhost:3001
// Produção: https://api.electrosal.com.br
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://api.electrosal.com.br');

// ✅ Garante que a URL base termine com /api
const resolvedBaseURL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: resolvedBaseURL,
});

// Interceptor de Requisição
api.interceptors.request.use(
  (config) => {
    if (config.headers.skipAuth) {
      delete config.headers.Authorization;
      delete config.headers.skipAuth; // Clean up the custom header
      return config;
    }

    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        toast.error("Sua sessão expirou. Por favor, faça login novamente.");
        localStorage.removeItem("accessToken");
        // Removido o redirecionamento forçado - deixa o AuthContext cuidar disso
      }
    }
    return Promise.reject(error);
  }
);

export default api;
