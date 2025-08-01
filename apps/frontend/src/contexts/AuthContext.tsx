'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../lib/api';

interface AuthContextType {
  user: any;
  login: (accessToken: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storedAccessToken, setStoredAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setStoredAccessToken(token);
  }, []); // Executa apenas uma vez para obter o token inicial

  useEffect(() => {
    if (storedAccessToken && pathname !== '/') {
      fetchProfile(storedAccessToken);
    } else {
      setLoading(false);
    }
  }, [storedAccessToken, pathname]);

  const fetchProfile = async (accessToken: string) => {
    try {
      const response = await api.get('/users/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status !== 200) {
        localStorage.removeItem('accessToken');
        setUser(null);
        // Não redirecionar para /login aqui, apenas limpar o estado
        return;
      }

      const userData = response.data;
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
      // Não redirecionar para /login aqui, apenas limpar o estado
    } finally {
      setLoading(false);
    }
  };

  const login = (accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    fetchProfile(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    // Não redirecionar para /login aqui, apenas limpar o estado
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