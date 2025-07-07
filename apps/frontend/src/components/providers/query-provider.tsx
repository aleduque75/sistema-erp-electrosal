"use client"; // Este componente deve rodar no cliente

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Crie o QueryClient fora do componente para que ele não seja recriado a cada renderização
const queryClient = new QueryClient();

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
