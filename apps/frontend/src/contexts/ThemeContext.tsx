"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { themes as defaultThemes } from '@/config/themes';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

interface ThemeContextType {
  theme: string;
  setTheme: (themeKey: string) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [themes, setThemes] = useState(defaultThemes);
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    async function fetchAndApplyTheme() {
      if (user) {
        try {
          const { data: org } = await api.get('/organization');
          if (org.appearanceSettings?.customTheme) {
            const customTheme = org.appearanceSettings.customTheme;
            setThemes((prevThemes) => ({
              ...prevThemes,
              [customTheme.name.toLowerCase().replace(" (padrão)", "").replace(" ", "-")]: customTheme,
            }));
          }
          if (org.appearanceSettings?.themeName) {
            setThemeState(org.appearanceSettings.themeName);
            localStorage.setItem('theme', org.appearanceSettings.themeName); // Update localStorage
          }
        } catch (error) {
          console.error("Failed to fetch and apply custom theme:", error);
        }
      }
    }

    fetchAndApplyTheme();
  }, [user]);

  const setTheme = (themeKey: string) => {
    const sanitizedThemeKey = themeKey.toLowerCase().replace(" (padrão)", "").replace(/\s+/g, '-');
    setThemeState(sanitizedThemeKey);
    localStorage.setItem('theme', sanitizedThemeKey);
  };

  const toggleMode = () => {
    const currentTheme = theme;
    let newThemeKey = '';

    if (currentTheme.includes('dark')) {
      newThemeKey = currentTheme.replace('-dark', '-light');
      if (!themes[newThemeKey]) {
        newThemeKey = currentTheme.replace('dark', 'light');
      }
    } else {
      newThemeKey = currentTheme.replace('-light', '-dark');
      if (!themes[newThemeKey]) {
        newThemeKey = currentTheme.replace('light', 'dark');
      }
    }

    if (currentTheme === 'light') newThemeKey = 'dark';
    if (currentTheme === 'dark') newThemeKey = 'light';

    if (!themes[newThemeKey]) {
      newThemeKey = 'light';
    }

    setTheme(newThemeKey);
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) { // Check only if storedTheme exists
      setThemeState(storedTheme);
    } else {
      setThemeState('light');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // First, remove all theme-related classes to ensure a clean state
    // This needs to account for both sanitized and unsanitized theme names that might have been added
    // dynamically or from initial load.
    Object.keys(themes).forEach(t => {
      const sanitizedT = t.toLowerCase().replace(" (padrão)", "").replace(/\s+/g, '-');
      root.classList.remove(`theme-${sanitizedT}`);
    });

    if (theme.includes('dark')) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const currentThemeData = themes[theme] || themes['light'];
    
    // Apply default theme colors
    Object.entries(currentThemeData.colors).forEach(([name, value]) => {
      root.style.setProperty(`--${name}`, value);
    });

    // Apply custom colors if they exist in customTheme
    if (currentThemeData.colors.textColorPrimary) {
      root.style.setProperty('--text-color-primary', currentThemeData.colors.textColorPrimary);
    }
    if (currentThemeData.colors.menuSelectedBackgroundColor) {
      root.style.setProperty('--menu-selected-bg', currentThemeData.colors.menuSelectedBackgroundColor);
    }
    if (currentThemeData.colors.menuSelectedTextColor) {
      root.style.setProperty('--menu-selected-text', currentThemeData.colors.menuSelectedTextColor);
    }
    if (currentThemeData.colors.menuHoverBackgroundColor) {
      root.style.setProperty('--menu-hover-bg', currentThemeData.colors.menuHoverBackgroundColor);
    }
    if (currentThemeData.colors.menuHoverTextColor) {
      root.style.setProperty('--menu-hover-text', currentThemeData.colors.menuHoverTextColor);
    }

    // Apply the new theme class after sanitizing
    if (!['light', 'dark'].includes(theme)) {
      const sanitizedTheme = theme.toLowerCase().replace(" (padrão)", "").replace(/\s+/g, '-');
      root.classList.add(`theme-${sanitizedTheme}`);
    }

  }, [theme, themes]);

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
