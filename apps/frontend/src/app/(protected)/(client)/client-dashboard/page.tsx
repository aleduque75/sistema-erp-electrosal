'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ClientDashboardPage() {
  const { hasPermission, isLoading: isLoading, user } = useAuth();
  const router = useRouter();

  // Permissão necessária para ver este dashboard
  const requiredPermission = 'dashboard:client:read'; 

  // Proteção da Rota
  useEffect(() => {
    if (!isLoading && !hasPermission(requiredPermission)) {
      toast.error('Você não tem permissão para acessar esta página.');
      router.push('/dashboard'); // Redireciona para o dashboard principal
    }
  }, [isLoading, hasPermission, router]);

  // Não renderiza nada até que a verificação de autenticação/permissão seja concluída
  if (isLoading || !hasPermission(requiredPermission)) {
    return <p>Carregando ou redirecionando...</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold">Dashboard do Cliente</h1>
      <p>Bem-vindo, {user?.email}!</p>
      <p>Esta é a sua área exclusiva. Em breve, você verá suas informações aqui.</p>
    </div>
  );
}
