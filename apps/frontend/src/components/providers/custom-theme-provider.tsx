"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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

// Tema padrão de fallback caso o backend não responda
const DEFAULT_THEME = {
  light: {
    colors: {
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      card: "0 0% 100%",
      "card-foreground": "222.2 84% 4.9%",
      popover: "0 0% 100%",
      "popover-foreground": "222.2 84% 4.9%",
      primary: "222.2 47.4% 11.2%",
      "primary-foreground": "210 40% 98%",
      secondary: "210 40% 96.1%",
      "secondary-foreground": "222.2 47.4% 11.2%",
      muted: "210 40% 96.1%",
      "muted-foreground": "215.4 16.3% 46.9%",
      accent: "210 40% 96.1%",
      "accent-foreground": "222.2 47.4% 11.2%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "210 40% 98%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "222.2 84% 4.9%",
      radius: "0.5rem",
    },
  },
  dark: {
    colors: {
      background: "222.2 84% 4.9%",
      foreground: "210 40% 98%",
      card: "222.2 84% 4.9%",
      "card-foreground": "210 40% 98%",
      popover: "222.2 84% 4.9%",
      "popover-foreground": "210 40% 98%",
      primary: "210 40% 98%",
      "primary-foreground": "222.2 47.4% 11.2%",
      secondary: "217.2 32.6% 17.5%",
      "secondary-foreground": "210 40% 98%",
      muted: "217.2 32.6% 17.5%",
      "muted-foreground": "215 20.2% 65.1%",
      accent: "217.2 32.6% 17.5%",
      "accent-foreground": "210 40% 98%",
      destructive: "0 62.8% 30.6%",
      "destructive-foreground": "210 40% 98%",
      border: "217.2 32.6% 17.5%",
      input: "217.2 32.6% 17.5%",
      ring: "212.7 26.8% 83.9%",
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setInternalTheme] = useState<string>("light");
  const [mounted, setMounted] = useState(false);
  const [customThemeData, setCustomThemeData] = useState<any>(null);

  const applyColors = (colors: any) => {
    if (!colors || typeof window === "undefined") return;
    const root = document.documentElement;
    Object.entries(colors).forEach(([k, v]) => {
      const cssVarName = k.replace(/([A-Z])/g, "-$1").toLowerCase();
      root.style.setProperty(`--${cssVarName}`, v as string);
    });
  };

  const updateCustomTheme = (config: any) => {
    setCustomThemeData(config);
    const currentMode = theme || "light";
    applyColors(config[currentMode]?.colors);
  };

  useEffect(() => {
    const init = async () => {
      // Define o tema do usuário se disponível
      if (user?.settings?.theme) {
        setInternalTheme(user.settings.theme);
      }

      try {
        const { data } = await api.get("/settings/appearance");
        if (data?.customTheme) {
          console.log("✅ CustomTheme recebido do backend:", data.customTheme);
          setCustomThemeData(data.customTheme);
          const currentMode = user?.settings?.theme || "light";
          applyColors(data.customTheme[currentMode]?.colors);
        } else {
          console.log("⚠️ CustomTheme não encontrado, usando tema padrão");
          setCustomThemeData(DEFAULT_THEME);
          const currentMode = user?.settings?.theme || "light";
          applyColors(DEFAULT_THEME[currentMode]?.colors);
        }
      } catch (error: any) {
        // Tratamento específico para erro 401 ou qualquer outro erro
        if (error?.response?.status === 401) {
          console.warn("⚠️ Não autenticado, usando tema padrão");
        } else {
          console.warn("⚠️ Erro ao buscar configurações de aparência:", error?.message);
        }
        
        // Aplica tema padrão em caso de erro
        setCustomThemeData(DEFAULT_THEME);
        const currentMode = user?.settings?.theme || "light";
        applyColors(DEFAULT_THEME[currentMode]?.colors);
      } finally {
        setMounted(true);
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;

    // ✅ Aplica a classe Dark do Tailwind
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    // ✅ Aplica as cores específicas do banco para o modo atual
    if (customThemeData) {
      applyColors(customThemeData[theme]?.colors);
    }
  }, [theme, mounted, customThemeData]);

  const setTheme = async (t: string) => {
    setInternalTheme(t);
    try {
      await api.put("/settings", { theme: t });
    } catch (error) {
      console.warn("⚠️ Erro ao salvar preferência de tema:", error);
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
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
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
