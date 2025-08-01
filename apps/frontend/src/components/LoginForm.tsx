"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext"; // Ajuste o caminho se necessário
import translations from "../../public/locales/pt/common.json"; // Ajuste o caminho
import api from "../lib/api"; // Ajuste o caminho

// Renomeie a função para LoginForm
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- INÍCIO DO DEBUG ---
    console.log("--- 1. Função handleSubmit do login foi chamada ---");
    console.log("Dados do formulário:", { email, password });
    // --------------------

    try {
      console.log("--- 2. Tentando enviar para a API... ---");
      const response = await api.post("/auth/login", { email, password });

      console.log("--- 3. Sucesso! Resposta recebida da API. ---", response.data);
      login(response.data.accessToken);
      router.push("/dashboard");

    } catch (err: any) {
      console.error("--- 4. ERRO! A chamada à API falhou. ---", err);
      const errorMessage = err.response?.data?.message || err.message || "Falha no login.";
      setError(errorMessage);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {translations.login.title}
      </h1>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label
            htmlFor="email-login"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            {translations.login.email}:
          </label>
          <input
            type="email"
            id="email-login"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="password-login"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            {translations.login.password}:
          </label>
          <input
            type="password"
            id="password-login"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {translations.login.loginButton}
          </button>
        </div>
      </form>
    </div>
  );
}