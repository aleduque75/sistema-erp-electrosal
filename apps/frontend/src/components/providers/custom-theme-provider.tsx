"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
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

export const DEFAULT_THEME = {
  light: {
    colors: {
      foreground: "222 47% 11%",
      "muted-foreground": "215 16% 47%",
      muted: "210 40% 96%",
      background: "0 0% 100%",
      card: "0 0% 100%",
      "card-foreground": "222 47% 11%",
      "card-border": "214 32% 91%",
      border: "214 32% 91%",
      input: "210 40% 98%",
      "input-foreground": "222 47% 11%",
      ring: "221 83% 70%",
      primary: "221 83% 53%",
      "primary-foreground": "0 0% 100%",
      "primary-hover": "221 83% 45%",
      secondary: "210 40% 96%",
      "secondary-foreground": "222 47% 11%",
      accent: "210 40% 96%",
      "accent-foreground": "222 47% 11%",
      destructive: "0 84% 60%",
      "destructive-foreground": "0 0% 100%",
      success: "142 76% 36%",
      "success-foreground": "0 0% 100%",
      warning: "38 92% 50%",
      "warning-foreground": "0 0% 100%",
      cancel: "215 16% 47%",
      "cancel-hover": "215 16% 40%",
      "cancel-foreground": "0 0% 100%",
      popover: "0 0% 100%",
      "popover-foreground": "222 47% 11%",
      "badge-background": "221 83% 53%",
      "badge-text": "0 0% 100%",
      "table-header-background": "210 40% 96%",
      "table-header-foreground": "215 25% 27%",
      "table-row-hover": "210 40% 98%",
      "table-border": "214 32% 91%",
      divider: "214 32% 88%",
    },
  },
  dark: {
    colors: {
      foreground: "210 40% 98%",
      "muted-foreground": "215 20% 65%",
      muted: "217 33% 17%",
      background: "222 47% 11%",
      card: "222 47% 12%",
      "card-foreground": "210 40% 98%",
      "card-border": "217 33% 25%",
      border: "217 33% 17%",
      input: "217 33% 18%",
      "input-foreground": "210 40% 98%",
      ring: "221 83% 70%",
      primary: "221 83% 60%",
      "primary-foreground": "0 0% 100%",
      "primary-hover": "221 83% 70%",
      secondary: "217 33% 17%",
      "secondary-foreground": "210 40% 98%",
      accent: "217 33% 17%",
      "accent-foreground": "210 40% 98%",
      destructive: "0 63% 31%",
      "destructive-foreground": "210 40% 98%",
      success: "142 76% 20%",
      "success-foreground": "210 40% 98%",
      warning: "38 92% 30%",
      "warning-foreground": "210 40% 98%",
      cancel: "215 16% 55%",
      "cancel-hover": "215 16% 65%",
      "cancel-foreground": "0 0% 100%",
      popover: "222 47% 12%",
      "popover-foreground": "210 40% 98%",
      "badge-background": "221 83% 60%",
      "badge-text": "0 0% 100%",
      "table-header-background": "222 47% 15%",
      "table-header-foreground": "210 40% 98%",
      "table-row-hover": "222 47% 18%",
      "table-border": "217 33% 15%",
      divider: "217 33% 20%",
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
      // Converte camelCase → kebab-case com suporte a todos os padrões
      // Exemplo: primaryForeground → primary-foreground, menuBgHover → menu-bg-hover
      const cssVarName = k
        .replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`)
        .replace(/^-/, ""); // remove leading dash if any
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
          console.log("[ThemeDebug] Custom theme loaded from backend:", data.customTheme);
          // Faz o MERGE com os padrões para garantir que variáveis novas não fiquem vazias
          const merged = {
            light: {
              colors: {
                ...DEFAULT_THEME.light.colors,
                ...(data.customTheme.light?.colors || {})
              }
            },
            dark: {
              colors: {
                ...DEFAULT_THEME.dark.colors,
                ...(data.customTheme.dark?.colors || {})
              }
            }
          };
          setCustomThemeData(merged);

          if (data.themeName) {
            console.log("[ThemeDebug] Preference detected:", data.themeName);
            setInternalTheme(data.themeName);
          }
        } else {
          console.log("[ThemeDebug] No custom theme found, using defaults.");
          setCustomThemeData(DEFAULT_THEME);
        }
      } catch (error: any) {
        console.error("[ThemeDebug] Error loading theme:", error);
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
