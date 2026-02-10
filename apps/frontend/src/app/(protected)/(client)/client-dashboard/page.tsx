"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogTrigger } from "@/components/ui/dialog"; // Prevenção de erro de referência

export default function ClientDashboardPage() {
  const { hasPermission, isLoading, user } = useAuth();
  const router = useRouter();
  const requiredPermission = "dashboard:client:read";

  useEffect(() => {
    if (!isLoading && !hasPermission(requiredPermission)) {
      toast.error("Você não tem permissão para acessar esta página.");
      router.push("/dashboard");
    }
  }, [isLoading, hasPermission, router]);

  if (isLoading || !hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando ou redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold">Dashboard do Cliente</h1>
      <p>Bem-vindo, {user?.name || user?.email}!</p>
      <p>
        Esta é a sua área exclusiva. Em breve, você verá suas informações aqui.
      </p>
    </div>
  );
}
