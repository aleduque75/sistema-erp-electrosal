// apps/frontend/src/app/(dashboard)/landing-page-manager/page.tsx

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { LandingPageData, SectionConfig, HeroSectionConfig, FeaturesSectionConfig } from "@/config/landing-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, ArrowUp, ArrowDown, Save, Loader2 } from "lucide-react";
import { HeroSectionEditor } from "@/components/landing-page-editor/HeroSectionEditor";
import { FeaturesSectionEditor } from "@/components/landing-page-editor/FeaturesSectionEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaSelector } from "@/components/landing-page-editor/MediaSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { themes } from "@/config/themes";


export default function LandingPageManagerPage() {
  const { setTheme } = useTheme(); // Usar o contexto do tema global
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!landingPageData) return;
    setLandingPageData({ ...landingPageData, logoText: e.target.value });
  };

  const handleLogoImageChange = (imageId: string | string[]) => {
    if (!landingPageData) return;
    setLandingPageData({ ...landingPageData, logoImageId: imageId as string });
  };

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
        // Certifica-se de que cada seção tem um ID para manipulação no frontend
        const processedData = {
          ...response.data,
          sections: response.data.sections.map((section: any) => ({
            ...section,
            // REMOVIDO: id: section.id || uuidv4(), // Não gere IDs para seções existentes
            content: section.content || {}, // Garante que content não seja null
          })),
        };
        setLandingPageData(processedData);
      } catch (err: any) {
        console.error("Failed to fetch landing page data for manager:", err);
        setError("Falha ao carregar o conteúdo da página para edição.");
        toast.error("Falha ao carregar o conteúdo da página para edição.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLandingPageData();
  }, []);

  const handleSectionChange = (index: number, newConfig: SectionConfig) => {
    if (!landingPageData) return;
    const updatedSections = [...landingPageData.sections];
    updatedSections[index] = { ...updatedSections[index], content: newConfig };
    setLandingPageData({ ...landingPageData, sections: updatedSections });
  };

  const handleAddSection = (type: "hero" | "features") => {
    if (!landingPageData) return;

    const newSection: LandingPageData["sections"][0] = {
      // REMOVIDO: id: uuidv4(), // O backend irá gerar o ID
      order: landingPageData.sections.length + 1,
      type: type,
      content: {},
    };

    // Inicializa o conteúdo com base no tipo
    if (type === "hero") {
      newSection.content = {
        type: "hero", // Added missing type property
        title: "Novo Título Hero",
        description: "Nova Descrição Hero",
        mainImage: "",
        sideImages: [],
        ctaButtonText: "",
        ctaButtonLink: "",
        secondaryButtonText: "",
        secondaryButtonLink: "",
      } as HeroSectionConfig;
    } else if (type === "features") {
      newSection.content = {
        type: "features", // Added missing type property
        title: "Novas Funcionalidades",
        description: "Descrição das novas funcionalidades",
        items: [
          { icon: "", title: "", description: "" },
        ],
      } as FeaturesSectionConfig;
    }

    setLandingPageData({
      ...landingPageData,
      sections: [...landingPageData.sections, newSection],
    });
  };

  const handleRemoveSection = (idToRemove: string) => {
    if (!landingPageData) return;
    const updatedSections = landingPageData.sections.filter(
      (section) => section.id !== idToRemove
    );
    // Reajusta a ordem
    const reorderedSections = updatedSections.map((section, index) => ({
      ...section,
      order: index + 1,
    }));
    setLandingPageData({ ...landingPageData, sections: reorderedSections });
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (!landingPageData) return;
    const sections = [...landingPageData.sections];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < sections.length) {
      const [movedSection] = sections.splice(index, 1);
      sections.splice(newIndex, 0, movedSection);

      // Reajusta a ordem
      const reorderedSections = sections.map((section, idx) => ({
        ...section,
        order: idx + 1,
      }));
      setLandingPageData({ ...landingPageData, sections: reorderedSections });
    }
  };

  const handleSave = async () => {
    if (!landingPageData) return;

    setIsSaving(true);
    try {
      const sectionsToSave = landingPageData.sections.map(section => {
        const sectionData: any = {
          order: section.order,
          type: section.type,
          content: section.content,
        };
        // APENAS INCLUI O ID SE ELE JÁ EXISTIR (vindo do banco de dados)
        if (section.id) {
          sectionData.id = section.id;
        }
        return sectionData;
      });

      await api.patch("/landing-page", {
        sections: sectionsToSave,
        logoText: landingPageData.logoText,
        logoImageId: landingPageData.logoImageId,
        customThemeName: landingPageData.customThemeName, // Inclui o customThemeName
      });
      toast.success("Landing Page salva com sucesso!");
    } catch (err) {
      console.error("Failed to save landing page:", err);
      toast.error("Falha ao salvar a Landing Page.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-center p-10">Carregando dados da Landing Page para edição...</p>;
  }

  if (error) {
    return <p className="text-center p-10 text-red-500">{error}</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Landing Page</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logo-text">Texto do Logotipo</Label>
            <Input
              id="logo-text"
              value={landingPageData?.logoText || ""}
              onChange={handleLogoTextChange}
            />
          </div>
          <MediaSelector
            label="Imagem do Logotipo"
            value={landingPageData?.logoImageId || ""}
            onChange={handleLogoImageChange}
            multiple={false}
            sizeRecommendations="Recomendado: 64x64 pixels (largura x altura) para ícones pequenos"
          />
        </CardContent>
      </Card>

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

      

      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={() => handleAddSection("hero")}>
          <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Seção Hero
        </Button>
        <Button onClick={() => handleAddSection("features")}>
          <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Seção Features
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
          )}
        </Button>
      </div>

      {landingPageData && landingPageData.sections.length > 0 ? (
        <div className="space-y-6">
          {landingPageData.sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  Seção: {section.type.charAt(0).toUpperCase() + section.type.slice(1)} (Ordem: {section.order})
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveSection(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveSection(index, "down")}
                    disabled={index === landingPageData.sections.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => section.id && handleRemoveSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {section.type === "hero" && (
                  <HeroSectionEditor
                    config={section.content as HeroSectionConfig}
                    onChange={(newConfig) => handleSectionChange(index, newConfig)}
                  />
                )}
                {section.type === "features" && (
                  <FeaturesSectionEditor
                    config={section.content as FeaturesSectionConfig}
                    onChange={(newConfig) => handleSectionChange(index, newConfig)}
                  />
                )}
                {/* Adicione outros tipos de seção aqui */}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">Nenhuma seção configurada. Adicione uma nova seção para começar.</p>
      )}
    </div>
  );
}