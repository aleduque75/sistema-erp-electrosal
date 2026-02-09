"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// Importações dos componentes e tipos
import {
  LandingPageData,
  SectionConfig,
  HeroSectionConfig,
  FeaturesSectionConfig,
  HeroNewConfig,
  ProcessGalleryConfig,
} from "@/config/landing-page";
import { HeroSection } from "@/components/landing-page/HeroSection";
import { FeaturesSection } from "@/components/landing-page/FeaturesSection";
import { HeroNew } from "@/components/landing-page/HeroNew";
import { ProcessGalleryDynamic } from "@/components/landing-page/ProcessGalleryDynamic";

// Componente Principal da Página
export default function HomePage() {
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchLandingPageData() {
      try {
        const response = await api.get("/landing-page");
        setLandingPageData(response.data);
      } catch (err) {
        console.error("Failed to fetch landing page data:", err);
        setError("Não foi possível carregar os dados da página inicial.");
        toast.error("Erro ao carregar a página inicial.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLandingPageData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-center text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  if (!landingPageData || landingPageData.sections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-center text-muted-foreground">
          Nenhuma seção configurada para a landing page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <PublicNavbar
        logoText={landingPageData.logoText || "Electrosal"}
        logoImage={landingPageData.logoImage?.path || "/images/landing/logo.png"}
      />

      <main className="flex-1">
        {landingPageData.sections.map((section) => {
          // Mapeia o conteúdo JSON para o tipo de configuração correto
          const sectionConfig: SectionConfig = {
            ...section.content,
            type: section.type,
          } as SectionConfig;

          switch (section.type) {
            case "hero":
              return (
                <HeroSection
                  key={section.id}
                  config={sectionConfig as HeroSectionConfig}
                />
              );
            case "features":
              return (
                <FeaturesSection
                  key={section.id}
                  config={sectionConfig as FeaturesSectionConfig}
                />
              );
            case "hero-new":
              return (
                <HeroNew
                  key={section.id}
                  config={sectionConfig as HeroNewConfig}
                />
              );
            case "process-gallery":
              return (
                <ProcessGalleryDynamic
                  key={section.id}
                  config={sectionConfig as ProcessGalleryConfig}
                />
              );
            default:
              return null;
          }
        })}
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t bg-card/50">
        <p className="text-xs text-muted-foreground">
          © 2025 Electrosal - Tecnologia em Galvanoplastia. Todos os direitos reservados.
        </p>
        <div className="flex gap-4 sm:ml-auto">
          <a
            href="#"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Política de Privacidade
          </a>
          <a
            href="#"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Termos de Uso
          </a>
        </div>
      </footer>
    </div>
  );
}
