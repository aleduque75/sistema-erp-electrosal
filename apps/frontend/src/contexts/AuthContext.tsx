'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import api from '@/lib/api';
import { UserSettings } from '@sistema-erp-electrosal/core';

interface AuthUser {
  sub: string;
  email: string;
  orgId: string;
  permissions: string[];
  name?: string;
  settings?: UserSettings | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setIsPageLoading] = useState(true);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const isAuthenticated = !!user;

  const loadUser = async (force = false) => {
    if (hasAttemptedLoad && !force) {
      console.log('ℹ️ [AuthContext] Usuário já carregado ou tentativa realizada, pulando.');
      setIsPageLoading(false);
      return;
    }

    setIsPageLoading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('ℹ️ [AuthContext] Nenhum token encontrado no localStorage.');
      setUser(null);
      setIsPageLoading(false);
      setHasAttemptedLoad(true);
      return;
    }

    try {
      console.log('🔍 [AuthContext] Buscando perfil do usuário...');
      const response = await api.get(`/auth/me?t=${Date.now()}`);
      const rawUser = response.data;

      if (!rawUser || typeof rawUser !== 'object') {
        throw new Error('Dados do usuário vazios ou inválidos');
      }

      // ✅ Mapeamento Crucial: O Backend do Prisma usa 'id' e 'organizationId', 
      // mas o Frontend espera 'sub', 'orgId' e 'permissions'.
      const mappedUser: AuthUser = {
        sub: rawUser.id,
        email: rawUser.email,
        orgId: rawUser.organizationId,
        name: rawUser.name,
        permissions: rawUser.role ? [rawUser.role] : ['USER'], // Sempre garante uma permissão base
        settings: rawUser.settings
      };

      console.log('✅ [AuthContext] Sucesso:', mappedUser.email, mappedUser.permissions);
      setUser(mappedUser);
    } catch (error: any) {
      console.error('❌ [AuthContext] Falha no loadUser:', error?.response?.status, error?.message);

      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setIsPageLoading(false);
      setHasAttemptedLoad(true);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    loadUser(true);
  };

  const hasPermission = (permission: string) => {
    if (!user || !Array.isArray(user.permissions)) return false;
    // ✅ ADMIN sempre tem permissão (ou se a permissão estiver explicitamente na lista)
    return user.permissions.includes('ADMIN') || user.permissions.includes(permission);
  };

  const logout = () => {
    // ✅ 1. Limpa tudo
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    setUser(null);
    setHasAttemptedLoad(true); // Impede que o loadUser tente rodar de novo

    // ✅ 2. REDIRECIONA PARA O LOGIN (Nunca para o logout, para evitar o loop)
    // Se o usuário já estiver na página de logout, ele não fará nada.
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading: loading,
      hasPermission,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}