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
      if (user?.settings?.theme) setInternalTheme(user.settings.theme);
      try {
                const { data } = await api.get("/settings/appearance");
                if (data?.customTheme) {
                  console.log("CustomTheme recebido do backend no ThemeProvider:", data.customTheme); // <-- Garantir que seja exibido
                  setCustomThemeData(data.customTheme);
                  const currentMode = user?.settings?.theme || "light";
                  applyColors(data.customTheme[currentMode]?.colors);
                } else {
                  console.log("CustomTheme NÃO recebido do backend no ThemeProvider. Data:", data); // <-- Adicionar para ver quando não há customTheme
                }      } catch (e) {
        console.warn("Usando fallback de cores");
      } finally {
        setMounted(true);
      }
    };
    init();
  }, [user, theme]); // Adicionado 'theme' como dependência para garantir que as cores corretas sejam aplicadas na inicialização se o tema mudar enquanto o user não muda.

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
    } catch (e) {}
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
