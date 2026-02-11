"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthRedirector({ children }: { children: ReactNode }) {
  const { user, isLoading: isLoading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; // Aguarda a autenticação carregar
    }

    const isPublicPage = pathname === "/"; // A home é a única página pública

    // Se o usuário está logado
    if (user) {
      // e está na página pública, redireciona para o dashboard correto
      if (isPublicPage) {
        if (hasPermission("dashboard:client:read") && !hasPermission("role:create")) {
          router.push("/client-dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } 
    // Se o usuário NÃO está logado
    else {
      // e está tentando acessar uma página protegida, redireciona para a home
      if (!isPublicPage) {
        router.push("/");
      }
    }
  }, [user, isLoading, hasPermission, router, pathname]);

  return <>{children}</>; // Renderiza os children
}
