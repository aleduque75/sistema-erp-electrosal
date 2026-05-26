'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
    children: ReactNode;
}

// Mapeamento de prefixos de rotas para setores obrigatórios
const SECTOR_ROUTES: Record<string, string> = {
    '/pcp': 'PCP',
    '/recovery-orders': 'PCP',
    '/recuperacoes': 'PCP',
    '/chemical-reactions': 'PCP',
    '/financial': 'FINANCEIRO',
    '/transacoes': 'FINANCEIRO',
    '/credit-cards': 'FINANCEIRO',
    '/admin': 'ADMINISTRACAO',
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                console.log('🔒 [ProtectedRoute] Usuário não autenticado, redirecionando para login.');
                router.push('/login');
                return;
            }

            // Se for ADMIN, tem acesso total a tudo
            if (user?.role === 'ADMIN') {
                return;
            }

            // Validar proteção de rota por setor
            if (pathname) {
                const matchedRoute = Object.keys(SECTOR_ROUTES).find(route => 
                    pathname.startsWith(route)
                );

                if (matchedRoute) {
                    const requiredSector = SECTOR_ROUTES[matchedRoute];
                    
                    // Se o usuário não pertence ao setor necessário para esta rota
                    if (user?.sector !== requiredSector) {
                        console.warn(`🚫 [ProtectedRoute] Acesso negado para a rota ${pathname}. Requer setor: ${requiredSector}`);
                        toast.error('Você não tem permissão para acessar esta área.');
                        router.push('/dashboard');
                    }
                }
            }
        }
    }, [isLoading, isAuthenticated, user, pathname, router]);

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

    // Verificar se está tentando acessar uma rota não autorizada
    if (pathname && user?.role !== 'ADMIN') {
        const matchedRoute = Object.keys(SECTOR_ROUTES).find(route => 
            pathname.startsWith(route)
        );
        if (matchedRoute && user?.sector !== SECTOR_ROUTES[matchedRoute]) {
            return null; // Evita renderização antes do redirect
        }
    }

    return <>{children}</>;
}
