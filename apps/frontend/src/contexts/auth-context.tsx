'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import api from '@/lib/api';

interface AuthUser {
  sub: string;
  email: string;
  orgId: string;
  permissions: string[];
  name?: string; // Adiciona name como opcional
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setIsPageLoading] = useState(true);
  const isAuthenticated = !!user;

  console.log('AuthProvider rendered'); // Added console.log

  useEffect(() => {
    async function loadUser() {
      // O token de acesso é necessário para a chamada /auth/me
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          console.log('User data from /auth/me:', response.data); // DEBUGGING
          setUser(response.data);
        } catch (error) {
          console.error('Falha ao buscar o usuário:', error);
          // Limpa o estado se o token for inválido
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      }
      setIsPageLoading(false);
    }

    loadUser();
  }, []);

  const hasPermission = (permission: string) => {
    if (!user || !Array.isArray(user.permissions)) return false; // Verificação de segurança
    return user.permissions.includes(permission);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    window.location.href = '/logout';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading: loading, hasPermission, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  console.log('useAuth called, context:', context); // Added console.log
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
