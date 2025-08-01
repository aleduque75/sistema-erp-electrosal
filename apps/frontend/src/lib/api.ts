import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://192.168.15.6:3001";

// ✅ CORREÇÃO FINAL: Garante que a URL base termine com /api
const resolvedBaseURL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: resolvedBaseURL,
});

// Interceptor de Requisição
api.interceptors.request.use(
  (config) => {
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
        // Adicionado redirecionamento explícito para a landing page
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

export default api;