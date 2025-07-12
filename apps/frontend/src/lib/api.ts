import axios from "axios";

// A variável de ambiente é lida aqui. Se não existir, usa o fallback.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://192.168.15.2:8080";

const api = axios.create({
  // Use a constante que já tem a lógica de fallback.
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
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
