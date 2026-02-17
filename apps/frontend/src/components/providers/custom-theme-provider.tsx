"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  callback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => Promise<void>;
  toggleTheme: () => void;
  updateLiveColors: (colors: any) => void;
  setCustomTheme: (config: any) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME = {
  light: {
    colors: {
      foreground: "222 47% 11%",
      "muted-foreground": "215 16% 47%",
      background: "0 0% 100%",
      card: "0 0% 100%",
      "card-border": "214 32% 91%",
      border: "214 32% 91%",
      input: "210 40% 98%",
      "input-foreground": "222 47% 11%",
      ring: "221 83% 70%",
      primary: "221 83% 53%",
      "primary-foreground": "0 0% 100%",
      "primary-hover": "221 83% 45%",
      cancel: "215 16% 47%",
      "cancel-hover": "215 16% 40%",
      "cancel-foreground": "0 0% 100%",
    },
  },
  dark: {
    colors: {
      foreground: "210 40% 98%",
      "muted-foreground": "215 20% 65%",
      background: "222 47% 11%",
      card: "222 47% 12%",
      "card-border": "217 33% 25%",
      border: "217 33% 17%",
      input: "217 33% 18%",
      "input-foreground": "210 40% 98%",
      ring: "221 83% 70%",
      primary: "221 83% 60%",
      "primary-foreground": "0 0% 100%",
      "primary-hover": "221 83% 70%",
      cancel: "215 16% 55%",
      "cancel-hover": "215 16% 65%",
      "cancel-foreground": "0 0% 100%",
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [theme, setInternalTheme] = useState<string>("light");
  const [mounted, setMounted] = useState(false);
  const [customThemeData, setCustomThemeData] = useState<any>(null);

  // Ref para evitar que o init sobrescreva dados injetados pelo Hydrator
  const skipInit = useRef(false);

  const applyColors = (colors: any) => {
    if (!colors || typeof window === "undefined") return;
    const root = document.documentElement;
    Object.entries(colors).forEach(([k, v]) => {
      // Converte camelCase para kebab-case para variáveis CSS
      const cssVarName = k.replace(/([A-Z])/g, "-$1").toLowerCase();
      root.style.setProperty(`--${cssVarName}`, v as string);
    });
  };

  // ✅ Função para o Hydrator ou a página de Appearance injetar o tema
  const updateCustomTheme = (config: any) => {
    if (!config) return;
    skipInit.current = true; // Avisa o init que já temos dados
    setCustomThemeData(config);
  };

  useEffect(() => {
    if (authLoading || skipInit.current) {
      if (!authLoading) setMounted(true);
      return;
    }

    const init = async () => {
      if (user?.settings?.theme) {
        setInternalTheme(user.settings.theme);
      }

      try {
        const { data } = await api.get(`/settings/appearance?t=${Date.now()}`);

        if (data?.customTheme) {
          setCustomThemeData(data.customTheme);
          // Se o backend retornou um themeName (Preferência da Org), usamos ele
          if (data.themeName) setInternalTheme(data.themeName);
        } else {
          setCustomThemeData(DEFAULT_THEME);
        }
      } catch (error: any) {
        setCustomThemeData(DEFAULT_THEME);
      } finally {
        setMounted(true);
      }
    };

    init();
  }, [authLoading, user]);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;

    // ✅ Aplica a classe Dark para o Tailwind
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    // ✅ Aplica as cores HSL customizadas
    if (customThemeData && customThemeData[theme]?.colors) {
      applyColors(customThemeData[theme].colors);
    }
  }, [theme, mounted, customThemeData]);

  const setTheme = async (t: string) => {
    setInternalTheme(t);
    if (user) {
      try {
        await api.put("/settings", { theme: t });
      } catch (error) {
        console.warn("⚠️ Erro ao salvar preferência:", error);
      }
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        updateLiveColors: applyColors,
        setCustomTheme: updateCustomTheme,
      }}
    >
      <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.2s" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  return context;
};
