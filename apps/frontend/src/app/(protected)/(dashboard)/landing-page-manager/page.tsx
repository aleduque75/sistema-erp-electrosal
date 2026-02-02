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
import { useTheme } from "next-themes"; // CORREÇÃO: Importação adicionada
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// CORREÇÃO: Força a página a ser dinâmica para evitar erro no build
export const dynamic = 'force-dynamic';

export default function LandingPageManagerPage() {
  const { setTheme } = useTheme(); 
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [loading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ... (restante do código permanece igual)
  const handleLogoTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!landingPageData) return;
    setLandingPageData({ ...landingPageData, logoText: e.target.value });
  };

  const handleLogoImageChange = (imageId: string | string[]) => {
    if (!landingPageData) return;
    setLandingPageData({ ...landingPageData, logoImageId: imageId as string });
  };

  useEffect(() => {
    const fetchLandingPageData = async () => {
      try {
        const response = await api.get("/landing-page/editor");
        const processedData = {
          ...response.data,
          sections: response.data.sections.map((section: any) => ({
            ...section,
            content: section.content || {},
          })),
        };
        setLandingPageData(processedData);
      } catch (err: any) {
        console.error("Failed to fetch landing page data:", err);
        setError("Falha ao carregar o conteúdo da página para edição.");
        toast.error("Falha ao carregar o conteúdo da página para edição.");
      } finally {
        setIsPageLoading(false);
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
      order: landingPageData.sections.length + 1,
      type: type,
      content: {},
    };

    if (type === "hero") {
      newSection.content = {
        type: "hero",
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
        type: "features",
        title: "Novas Funcionalidades",
        description: "Descrição das novas funcionalidades",
        items: [{ icon: "", title: "", description: "" }],
      } as FeaturesSectionConfig;
    }

    setLandingPageData({
      ...landingPageData,
      sections: [...landingPageData.sections, newSection],
    });
  };

  const handleRemoveSection = (idToRemove: string) => {
    if (!landingPageData) return;
    const updatedSections = landingPageData.sections.filter((s) => s.id !== idToRemove);
    const reorderedSections = updatedSections.map((s, i) => ({ ...s, order: i + 1 }));
    setLandingPageData({ ...landingPageData, sections: reorderedSections });
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (!landingPageData) return;
    const sections = [...landingPageData.sections];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < sections.length) {
      const [movedSection] = sections.splice(index, 1);
      sections.splice(newIndex, 0, movedSection);
      const reorderedSections = sections.map((s, i) => ({ ...s, order: i + 1 }));
      setLandingPageData({ ...landingPageData, sections: reorderedSections });
    }
  };

  const handleSave = async () => {
    if (!landingPageData) return;
    setIsSaving(true);
    try {
      const sectionsToSave = landingPageData.sections.map(s => ({
        order: s.order,
        type: s.type,
        content: s.content,
        ...(s.id && { id: s.id })
      }));
      await api.patch("/landing-page", {
        sections: sectionsToSave,
        logoText: landingPageData.logoText,
        logoImageId: landingPageData.logoImageId,
      });
      toast.success("Landing Page salva com sucesso!");
    } catch (err) {
      console.error("Failed to save:", err);
      toast.error("Falha ao salvar a Landing Page.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p className="text-center p-10">Carregando...</p>;
  if (error) return <p className="text-center p-10 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Landing Page</h1>
      <Card className="mb-6">
        <CardHeader><CardTitle>Configurações Gerais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logo-text">Texto do Logotipo</Label>
            <Input id="logo-text" value={landingPageData?.logoText || ""} onChange={handleLogoTextChange} />
          </div>
          <MediaSelector label="Imagem do Logotipo" value={landingPageData?.logoImageId || ""} onChange={handleLogoImageChange} multiple={false} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={() => handleAddSection("hero")}><PlusCircle className="h-4 w-4 mr-2" /> Hero</Button>
        <Button onClick={() => handleAddSection("features")}><PlusCircle className="h-4 w-4 mr-2" /> Features</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar
        </Button>
      </div>

      <div className="space-y-6">
        {landingPageData?.sections.map((section, index) => (
          <Card key={section.id || index}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Seção: {section.type} ({section.order})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleMoveSection(index, "up")} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => handleMoveSection(index, "down")} disabled={index === landingPageData.sections.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => section.id && handleRemoveSection(section.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {section.type === "hero" && <HeroSectionEditor config={section.content as HeroSectionConfig} onChange={(c) => handleSectionChange(index, c)} />}
              {section.type === "features" && <FeaturesSectionEditor config={section.content as FeaturesSectionConfig} onChange={(c) => handleSectionChange(index, c)} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}