"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    // 1. Limpeza total e bruta sem passar por funções de contexto que podem re-renderizar
    localStorage.clear();
    sessionStorage.clear();

    // 2. Redirecionamento de hardware (ignora o router do Next.js)
    // Isso quebra qualquer loop de estado do React
    window.location.replace("/login");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-slate-500 animate-pulse">Limpando sessão...</p>
    </div>
  );
}
