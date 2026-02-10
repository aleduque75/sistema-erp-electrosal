"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext"; // Ajuste o caminho se necessário
import translations from "../../public/locales/pt/common.json"; // Ajuste o caminho
import api from "../lib/api"; // Ajuste o caminho

// Renomeie a função para RegisterForm
export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await api.post("/auth/register", { name, email, password });
      login(response.data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Falha no registro.";
      setError(errorMessage);
    }
  };

  // Retornamos apenas o formulário, sem o container da página
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {translations.register.title}
      </h1>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label
            htmlFor="name-register" // ID alterado
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            {translations.register.name}:
          </label>
          <input
            type="text"
            id="name-register" // ID alterado
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="email-register" // ID alterado
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            {translations.register.email}:
          </label>
          <input
            type="email"
            id="email-register" // ID alterado
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="password-register" // ID alterado
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            {translations.register.password}:
          </label>
          <input
            type="password"
            id="password-register" // ID alterado
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {translations.register.registerButton}
          </button>
        </div>
      </form>
    </div>
  );
}