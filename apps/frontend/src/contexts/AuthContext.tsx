'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: any;
  login: (accessToken: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ['/', '/register', '/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');

      if (accessToken) {
        try {
          const response = await api.get('/users/profile', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.status === 200) {
            setUser(response.data);
          } else {
            localStorage.removeItem('accessToken');
            setUser(null);
            if (!publicPaths.includes(pathname ?? "")) {
              toast.error("Sua sessão expirou. Por favor, faça login novamente.");
              router.push('/');
            }
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          localStorage.removeItem('accessToken');
          setUser(null);
          if (!publicPaths.includes(pathname ?? "")) {
            toast.error("Sua sessão expirou. Por favor, faça login novamente.");
            router.push('/');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [pathname]); // Dependência de pathname para re-executar se a rota mudar

  const login = (accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    // Após o login, re-inicializa a autenticação para buscar o perfil
    setLoading(true); // Define loading como true para mostrar feedback
    const initializeAuthAfterLogin = async () => {
      try {
        const response = await api.get('/users/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (response.status === 200) {
          setUser(response.data);
        } else {
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch profile after login:', error);
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuthAfterLogin();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}