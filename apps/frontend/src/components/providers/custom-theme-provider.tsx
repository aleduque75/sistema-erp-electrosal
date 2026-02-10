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

// Tema padrão de fallback caso o backend não responda
// ALINHADO COM globals.css
const DEFAULT_THEME = {
  light: {
    colors: {
      // TEXTOS
      foreground: "222 47% 11%",
      "muted-foreground": "215 16% 47%",

      // ESTRUTURA
      background: "0 0% 100%",
      card: "0 0% 100%",
      "card-foreground": "222 47% 11%",
      "card-border": "214 32% 91%",
      border: "214 32% 91%",

      // INPUTS
      input: "210 40% 98%",
      "input-foreground": "222 47% 11%",
      ring: "221 83% 70%",

      // BOTÕES
      primary: "221 83% 53%",
      "primary-foreground": "0 0% 100%",
      "primary-hover": "221 83% 45%",
      cancel: "215 16% 47%",
      "cancel-hover": "215 16% 40%",
      "cancel-foreground": "0 0% 100%",

      // POPOVER
      popover: "0 0% 100%",
      "popover-foreground": "222 47% 11%",

      // SECONDARY, ACCENT, DESTRUCTIVE (mantém compatibilidade shadcn)
      secondary: "210 40% 96%",
      "secondary-foreground": "222 47% 11%",
      muted: "210 40% 96%",
      accent: "210 40% 96%",
      "accent-foreground": "222 47% 11%",
      destructive: "0 84% 60%",
      "destructive-foreground": "0 0% 100%",
    },
  },
  dark: {
    colors: {
      // TEXTOS DARK
      foreground: "210 40% 98%",
      "muted-foreground": "215 20% 65%",

      // ESTRUTURA DARK
      background: "222 47% 11%",
      card: "222 47% 12%",
      "card-foreground": "210 40% 98%",
      "card-border": "217 33% 25%",
      border: "217 33% 17%",

      // INPUTS DARK
      input: "217 33% 18%",
      "input-foreground": "210 40% 98%",
      ring: "221 83% 70%",

      // BOTÕES DARK
      primary: "221 83% 60%",
      "primary-foreground": "0 0% 100%",
      "primary-hover": "221 83% 70%",
      cancel: "215 16% 55%",
      "cancel-hover": "215 16% 65%",
      "cancel-foreground": "0 0% 100%",

      // POPOVER DARK
      popover: "222 47% 12%",
      "popover-foreground": "210 40% 98%",

      // SECONDARY, ACCENT, DESTRUCTIVE (mantém compatibilidade shadcn)
      secondary: "217 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "217 33% 17%",
      accent: "217 33% 17%",
      "accent-foreground": "210 40% 98%",
      destructive: "0 63% 31%",
      "destructive-foreground": "210 40% 98%",
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [theme, setInternalTheme] = useState<string>("light");
  const [mounted, setMounted] = useState(false);
  const [customThemeData, setCustomThemeData] = useState<any>(null);
  const hasLoadedTheme = useRef(false);

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
    // Se ainda está carregando auth, aguarda
    if (authLoading) return;

    const init = async () => {
      // Se tiver settings no user, já aplica pra evitar flash
      if (user?.settings?.theme) {
        setInternalTheme(user.settings.theme);
      }

      try {
        // Tenta buscar as configurações da organização
        // Como o AuthGuard agora suporta opcional, mandamos request sempre.
        // Se tiver logado, o interceptor põe o token e o backend retorna o tema da org.
        // Se não, retorna o padrão ou público (se implementado).
        const { data } = await api.get(`/settings/appearance?t=${Date.now()}`);

        if (data?.customTheme) {
          console.log("✅ CustomTheme recebido:", data.customTheme);
          setCustomThemeData(data.customTheme);
          const currentMode = user?.settings?.theme || "light";
          applyColors(data.customTheme[currentMode]?.colors);
        } else {
          console.log("⚠️ CustomTheme não encontrado, usando padrão");
          setCustomThemeData(DEFAULT_THEME);
          const currentMode = user?.settings?.theme || "light";
          applyColors(DEFAULT_THEME[currentMode]?.colors);
        }
      } catch (error: any) {
        console.warn("⚠️ Erro ao buscar tema (usando padrão):", error?.message);
        setCustomThemeData(DEFAULT_THEME);
        const currentMode = user?.settings?.theme || "light";
        applyColors(DEFAULT_THEME[currentMode]?.colors);
      } finally {
        setMounted(true);
      }
    };

    // Sempre tenta iniciar se o authLoading acabou.
    // A logica dentro do init e do backend vai decidir se retorna o específico ou default.
    init();

  }, [authLoading, user]); // Re-executa se authLoading terminar ou user mudar

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
    // Only save to API if user is logged in to avoid 401
    if (user) {
      try {
        await api.put("/settings", { theme: t });
      } catch (error) {
        console.warn("⚠️ Erro ao salvar preferência de tema:", error);
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
