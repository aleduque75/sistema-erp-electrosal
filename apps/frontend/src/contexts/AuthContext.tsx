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
  login: (accessToken: string) => void; // Added login function
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setIsPageLoading] = useState(true);
  const isAuthenticated = !!user;

  const loadUser = async () => {
    setIsPageLoading(true); // Set loading to true when starting to load user
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
    setIsPageLoading(false); // Set loading to false after user is loaded or failed
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = (accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    loadUser(); // Load user after successful login
  };

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
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading: loading, hasPermission, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  // console.log('useAuth called, context:', context);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
