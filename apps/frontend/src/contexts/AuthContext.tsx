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
  name?: string; // Adiciona name como opcional
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
  const isAuthenticated = !!user;

  const loadUser = async () => {
    setIsPageLoading(true);
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Falha ao buscar o usuário:', error);
        localStorage.removeItem('accessToken');
        setUser(null);
      }
    }
    setIsPageLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = (accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    loadUser();
  };

  const hasPermission = (permission: string) => {
    if (!user || !Array.isArray(user.permissions)) return false;
    return user.permissions.includes(permission);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    window.location.href = '/logout';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading: loading, hasPermission, login, logout }}>
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
