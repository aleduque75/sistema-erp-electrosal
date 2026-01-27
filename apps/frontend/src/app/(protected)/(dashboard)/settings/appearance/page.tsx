// apps/frontend/src/app/(dashboard)/settings/appearance/page.tsx

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { LandingPageData } from "@/config/landing-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { themes } from "@/config/themes";

export default function AppearanceManagerPage() {
  const { setTheme } = useTheme(); // Usar o contexto do tema global
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [loading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função genérica para lidar com mudanças no customTheme
  const handleCustomThemeChange = (
    mode: 'light' | 'dark',
    section: 'navbar' | 'hero' | 'features', // Adicione outras seções conforme necessário
    key: string,
    value: string
  ) => {
    if (!landingPageData) return;

    setLandingPageData(prevData => {
      const newData = { ...prevData! };
      if (!newData.customTheme) {
        newData.customTheme = {};
      }
      if (!newData.customTheme[mode]) {
        newData.customTheme[mode] = {};
      }
      if (!newData.customTheme[mode]![section]) {
        newData.customTheme[mode]![section] = {};
      }
      // @ts-ignore
      newData.customTheme[mode]![section][key] = value;
      return newData;
    });
  };

  const handleCustomThemeNameChange = (themeName: string) => {
    if (!landingPageData) return;
    // Atualiza o estado local para salvar no banco
    setLandingPageData({ ...landingPageData, customThemeName: themeName });
    // Atualiza o tema global da aplicação em tempo real
    setTheme(themeName);
  };

  useEffect(() => {
    const fetchLandingPageData = async () => {
      try {
        const response = await api.get("/landing-page/editor");
        setLandingPageData(response.data);
      } catch (err: any) {
        console.error("Failed to fetch landing page data for manager:", err);
        setError("Falha ao carregar o conteúdo da página para edição.");
        toast.error("Falha ao carregar o conteúdo da página para edição.");
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchLandingPageData();
  }, []);

  const handleSave = async () => {
    if (!landingPageData) return;

    setIsSaving(true);
    try {
      await api.patch("/landing-page", {
        customThemeName: landingPageData.customThemeName,
        customTheme: landingPageData.customTheme,
      });
      toast.success("Aparência salva com sucesso!");
    } catch (err) {
      console.error("Failed to save appearance:", err);
      toast.error("Falha ao salvar a aparência.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center p-10">Carregando dados de aparência para edição...</p>;
  }

  if (error) {
    return <p className="text-center p-10 text-red-500">{error}</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gerenciar Aparência</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
          )}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tema da Aplicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="landing-page-theme">Selecionar Tema</Label>
            <Select
              value={landingPageData?.customThemeName || ""}
              onValueChange={handleCustomThemeNameChange}
            >
              <SelectTrigger id="landing-page-theme">
                <SelectValue placeholder="Selecione um tema" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, theme]) => (
                  <SelectItem key={key} value={key}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Esta configuração altera o tema de toda a aplicação.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customização de Cores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Modo Claro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Navbar - Fundo</Label>
                <Input
                  type="color"
                  value={landingPageData?.customTheme?.light?.navbar?.background || '#ffffff'}
                  onChange={(e) => handleCustomThemeChange('light', 'navbar', 'background', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hero - Fundo</Label>
                <Input
                  type="color"
                  value={landingPageData?.customTheme?.light?.hero?.background || '#ffffff'}
                  onChange={(e) => handleCustomThemeChange('light', 'hero', 'background', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Features - Fundo</Label>
                <Input
                  type="color"
                  value={landingPageData?.customTheme?.light?.features?.background || '#f0f0f0'}
                  onChange={(e) => handleCustomThemeChange('light', 'features', 'background', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Modo Escuro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Navbar - Fundo</Label>
                <Input
                  type="color"
                  value={landingPageData?.customTheme?.dark?.navbar?.background || '#000000'}
                  onChange={(e) => handleCustomThemeChange('dark', 'navbar', 'background', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hero - Fundo</Label>
                <Input
                  type="color"
                  value={landingPageData?.customTheme?.dark?.hero?.background || '#000000'}
                  onChange={(e) => handleCustomThemeChange('dark', 'hero', 'background', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Features - Fundo</Label>
                <Input
                  type="color"
                  value={landingPageData?.customTheme?.dark?.features?.background || '#1a1a1a'}
                  onChange={(e) => handleCustomThemeChange('dark', 'features', 'background', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
