import axios from "axios";
import { toast } from "sonner";

// 🌐 Mantém sua lógica dinâmica de URL (Perfeito para VPS)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://api.electrosal.com.br");

const resolvedBaseURL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: resolvedBaseURL,
});

api.interceptors.request.use(
  (config) => {
    if (config.headers.skipAuth) {
      delete config.headers.Authorization;
      delete config.headers.skipAuth;
      return config;
    }

    if (typeof window !== "undefined") {
      // ✅ ALTERADO: Mudamos de 'accessToken' para 'token' para alinhar com o novo AuthContext
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
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        // ✅ ALTERADO: Limpa a chave correta 'token'
        const hasToken = localStorage.getItem("token");

        if (hasToken) {
          toast.error("Sua sessão expirou. Por favor, faça login novamente.");
          localStorage.removeItem("token");

          // Limpeza de segurança da chave antiga para não sobrar lixo na VPS
          localStorage.removeItem("accessToken");

          if (window.location.pathname !== "/login") {
            setTimeout(() => {
              window.location.href = "/login";
            }, 1000);
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
