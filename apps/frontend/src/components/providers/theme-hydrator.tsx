"use client";

import { useEffect } from "react";
import { useTheme } from "./custom-theme-provider";

interface ThemeHydratorProps {
  appearance: {
    themeName?: string;
    customTheme?: any;
  };
}

export function ThemeHydrator({ appearance }: ThemeHydratorProps) {
  const { setTheme, setCustomTheme, updateLiveColors } = useTheme();

  useEffect(() => {
    if (!appearance) return;

    // 1. Aplica o Modo (Light/Dark)
    if (appearance.themeName) {
      setTheme(appearance.themeName);
    }

    // 2. Injeta o Objeto de Cores Customizadas
    if (appearance.customTheme) {
      setCustomTheme(appearance.customTheme);

      // 3. Força a atualização das variáveis CSS (CSS Variables)
      const currentMode = appearance.themeName || "light";
      const activeColors = appearance.customTheme[currentMode]?.colors;

      if (activeColors && updateLiveColors) {
        updateLiveColors(activeColors);
      }
    }
  }, [appearance, setTheme, setCustomTheme, updateLiveColors]);

  return null;
}
