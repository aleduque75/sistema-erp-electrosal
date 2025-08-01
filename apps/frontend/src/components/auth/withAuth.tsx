"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const AuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        toast.error("Você precisa estar logado para acessar esta página.");
        router.replace('/'); // Redireciona para a landing page
      }
    }, [user, loading, router]);

    if (loading || !user) {
      // Você pode renderizar um spinner de carregamento aqui
      return <div>Carregando...</div>;
    }

    return <WrappedComponent {...props} />;
  };

  // Adiciona um nome de exibição para facilitar a depuração
  AuthComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return AuthComponent;
}
