'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            console.log('🔒 [ProtectedRoute] Usuário não autenticado, redirecionando para login.');
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                    <p className="text-muted-foreground animate-pulse">Verificando acesso...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Evita flash de conteúdo protegido antes do redirecionamento
    }

    return <>{children}</>;
}
