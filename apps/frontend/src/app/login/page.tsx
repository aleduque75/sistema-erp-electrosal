"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import translations from "../../../public/locales/pt/common.json";
import api from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await api.post("/auth/login", { email, password });

      login(response.data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      // Extrai a mensagem de erro específica do backend.
      // Se não existir, usa uma mensagem padrão.
      const errorMessage =
        err.response?.data?.message || err.message || "Falha no login.";
      setError(errorMessage);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {translations.login.title}
        </h1>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-danger text-sm mb-4">{error}</p>}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {translations.login.email}:
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {translations.login.password}:
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className="btn-primary w-full">
              {translations.login.loginButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
