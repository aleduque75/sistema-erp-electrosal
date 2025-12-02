"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { themes } from '@/config/themes';

interface ThemeContextType {
  theme: string;
  setTheme: (themeKey: string) => void;
  toggleMode: () => void; // Nova função para alternar entre claro/escuro
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState('light'); // 'light' ou 'dark' ou 'modern-blue-light' etc.

  // Função para definir o tema, garantindo que o modo (claro/escuro) seja mantido
  const setTheme = (themeKey: string) => {
    setThemeState(themeKey);
    localStorage.setItem('theme', themeKey);
  };

  // Função para alternar entre o modo claro e escuro do tema atual
  const toggleMode = () => {
    const currentTheme = theme;
    let newThemeKey = '';

    if (currentTheme.includes('dark')) {
      newThemeKey = currentTheme.replace('-dark', '-light');
      if (!themes[newThemeKey]) { // Fallback se não houver versão light explícita
        newThemeKey = currentTheme.replace('dark', 'light');
      }
    } else {
      newThemeKey = currentTheme.replace('-light', '-dark');
      if (!themes[newThemeKey]) { // Fallback se não houver versão dark explícita
        newThemeKey = currentTheme.replace('light', 'dark');
      }
    }

    // Se o tema atual for apenas 'light' ou 'dark' (sem sufixo), alternar para o outro
    if (currentTheme === 'light') newThemeKey = 'dark';
    if (currentTheme === 'dark') newThemeKey = 'light';

    // Garante que o newThemeKey exista, senão volta para o padrão
    if (!themes[newThemeKey]) {
      newThemeKey = 'light'; // Fallback para light se o tema alternado não existir
    }

    setTheme(newThemeKey);
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && themes[storedTheme]) {
      setThemeState(storedTheme);
    } else {
      // Define um tema padrão se não houver nenhum armazenado
      setThemeState('light');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove todas as classes de tema existentes
    root.classList.remove(...Object.keys(themes).filter(t => t.includes('-')).map(t => `theme-${t}`));

    // Adiciona a classe 'dark' se o tema atual for escuro
    if (theme.includes('dark')) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Se o tema atual não for 'light' ou 'dark' (ou seja, um tema customizado como 'fuchsia-light'),
    // aplica as variáveis CSS. Caso contrário, o Tailwind CSS cuidará das cores padrão.
    if (!['light', 'dark'].includes(theme)) {
      const currentThemeData = themes[theme] || themes['light'];
      Object.entries(currentThemeData.colors).forEach(([name, value]) => {
        root.style.setProperty(`--${name}`, value);
      });
      root.classList.add(`theme-${theme}`); // Adiciona uma classe específica para temas customizados
    } else {
      // Limpa as variáveis CSS customizadas se estivermos nos temas 'light' ou 'dark' padrão
      Object.keys(themes['light'].colors).forEach(name => {
        root.style.removeProperty(`--${name}`);
      });
    }

  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
