"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  LandingPageData,
  HeroNewConfig,
  FeaturesSectionConfig,
  ProcessGalleryConfig,
} from "@/config/landing-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Save, Loader2, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { HeroNewEditor } from "@/components/landing-page-editor/HeroNewEditor";
import { FeaturesSectionEditor } from "@/components/landing-page-editor/FeaturesSectionEditor";
import { ProcessGalleryEditor } from "@/components/landing-page-editor/ProcessGalleryEditor";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function LandingPageManagerPage() {
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [loading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Carregar dados do Banco
  useEffect(() => {
    const fetchLandingPageData = async () => {
      try {
        const response = await api.get("/landing-page/editor");
        setLandingPageData(response.data);
      } catch (err) {
        console.error("Erro ao carregar:", err);
        toast.error("Erro ao carregar dados da página.");
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchLandingPageData();
  }, []);

  // 2. Adicionar Nova Seção com campos COMPLETOS e CORRETOS
  const handleAddSection = (type: "hero-new" | "process-gallery" | "features") => {
    if (!landingPageData) return;

    const tempId = `temp-${Date.now()}`;
    const newOrder = landingPageData.sections.length + 1;

    let defaultContent: HeroNewConfig | ProcessGalleryConfig | FeaturesSectionConfig;

    if (type === "hero-new") {
      // ✅ TODOS os campos que HeroNew espera
      defaultContent = {
        type: "hero-new",
        logoImage: "", // ID da imagem ou path local
        title: "Electrosal",
        subtitle: "Galvanoplastia de Excelência",
        description: "Transformamos metais em obras-primas através de processos químicos de alta precisão.",
        ctaButtonText: "Comece Agora",
        ctaButtonLink: "/entrar",
        secondaryButtonText: "Ver Nossos Processos",
        secondaryButtonLink: "#galeria",
        backgroundImage: "", // ID da imagem ou path local
        stats: {
          years: "20+",
          pieces: "10k+",
          satisfaction: "99%",
        },
      } as HeroNewConfig;
    } else if (type === "process-gallery") {
      // ✅ TODOS os campos que ProcessGallery espera
      defaultContent = {
        type: "process-gallery",
        title: "Nossos Processos",
        description: "Conheça a tecnologia e os processos que fazem da Electrosal referência em galvanoplastia",
        ctaButtonText: "Entre em Contato",
        ctaButtonLink: "/entrar",
        processes: [
          {
            image: "", // ID da imagem ou path local
            title: "Banho Químico de Precisão",
            description: "Processos controlados com máxima precisão para garantir acabamentos perfeitos e duradouros.",
            icon: "Zap", // Nome do ícone do lucide-react
          },
        ],
      } as ProcessGalleryConfig;
    } else {
      // type === "features"
      // ✅ TODOS os campos que Features espera
      defaultContent = {
        type: "features",
        title: "Recursos Incríveis",
        description: "Descubra tudo o que podemos fazer por você",
        items: [
          {
            icon: "Zap", // Nome do ícone do lucide-react
            title: "Rapidez",
            description: "Processos ágeis e eficientes",
          },
        ],
      } as FeaturesSectionConfig;
    }

    const newSection = {
      id: tempId,
      order: newOrder,
      type: type,
      content: defaultContent,
    };

    setLandingPageData({
      ...landingPageData,
      sections: [...landingPageData.sections, newSection]
    });
    toast.success(`Seção ${type} adicionada! Role para baixo para editar.`);
  };

  // 3. Salvar no Banco
  const handleSave = async () => {
    if (!landingPageData) return;
    setIsSaving(true);
    try {
      const sectionsToSave = landingPageData.sections.map((section) => ({
        order: section.order,
        type: section.type,
        content: section.content,
        // Só inclui ID se não for temporário
        ...(section.id && !section.id.startsWith('temp-') ? { id: section.id } : {})
      }));

      await api.patch("/landing-page", {
        sections: sectionsToSave,
        logoText: landingPageData.logoText,
        logoImageId: landingPageData.logoImageId,
      });

      toast.success("✅ Landing Page salva com sucesso!");

      // Recarrega para pegar os IDs reais do banco
      const response = await api.get("/landing-page/editor");
      setLandingPageData(response.data);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      toast.error("❌ Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Remover Seção
  const handleRemoveSection = (index: number) => {
    if (!landingPageData) return;
    const updated = [...landingPageData.sections];
    updated.splice(index, 1);
    // Reordena as seções
    const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
    setLandingPageData({ ...landingPageData, sections: reordered });
    toast.info("Seção removida. Clique em 'Salvar' para confirmar.");
  };

  // 5. Atualizar conteúdo de uma seção
  const handleSectionChange = (index: number, newConfig: any) => {
    if (!landingPageData) return;
    const updated = [...landingPageData.sections];
    updated[index].content = newConfig;
    setLandingPageData({ ...landingPageData, sections: updated });
  };

  // 6. Mover seção para cima
  const handleMoveUp = (index: number) => {
    if (!landingPageData || index === 0) return;
    const updated = [...landingPageData.sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Atualiza os números de ordem
    const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
    setLandingPageData({ ...landingPageData, sections: reordered });
    toast.info("Seção movida para cima. Clique em 'Salvar' para confirmar.");
  };

  // 7. Mover seção para baixo
  const handleMoveDown = (index: number) => {
    if (!landingPageData || index === landingPageData.sections.length - 1) return;
    const updated = [...landingPageData.sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Atualiza os números de ordem
    const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
    setLandingPageData({ ...landingPageData, sections: reordered });
    toast.info("Seção movida para baixo. Clique em 'Salvar' para confirmar.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header com Título e Ações */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Editor da Landing Page
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as seções da sua página inicial
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank">
            <Button variant="outline" size="lg">
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Toolbar de Ações - Adicionar Seções */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-dashed border-2 border-blue-300 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="text-lg">Adicionar Nova Seção</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button
            variant="default"
            onClick={() => handleAddSection("hero-new")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Hero Principal
          </Button>
          <Button
            variant="default"
            onClick={() => handleAddSection("process-gallery")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Galeria de Processos
          </Button>
          <Button
            variant="default"
            onClick={() => handleAddSection("features")}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Seção de Features
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Seções Ativas */}
      {landingPageData?.sections.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <p className="text-muted-foreground text-lg">
            Nenhuma seção adicionada ainda. Clique nos botões acima para começar!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {landingPageData?.sections.map((section, index) => (
            <Card
              key={section.id || index}
              className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <CardTitle className="text-base font-mono uppercase text-slate-700 dark:text-slate-300">
                    {section.type === "hero-new" && "🎨 Hero Principal"}
                    {section.type === "process-gallery" && "🖼️ Galeria de Processos"}
                    {section.type === "features" && "⚡ Features"}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botões de Reordenação */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-30"
                    title="Mover para cima"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === landingPageData.sections.length - 1}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSection(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    title="Remover seção"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {section.type === "hero-new" && (
                  <HeroNewEditor
                    config={section.content as HeroNewConfig}
                    onChange={(c) => handleSectionChange(index, c)}
                  />
                )}
                {section.type === "process-gallery" && (
                  <ProcessGalleryEditor
                    config={section.content as ProcessGalleryConfig}
                    onChange={(c) => handleSectionChange(index, c)}
                  />
                )}
                {section.type === "features" && (
                  <FeaturesSectionEditor
                    config={section.content as FeaturesSectionConfig}
                    onChange={(c) => handleSectionChange(index, c)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
