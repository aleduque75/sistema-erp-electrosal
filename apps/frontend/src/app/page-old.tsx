"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// Importações dos novos componentes e tipos de configuração
import { LandingPageData, SectionConfig, HeroSectionConfig, FeaturesSectionConfig } from "@/config/landing-page";
import { HeroSection } from "@/components/landing-page/HeroSection";
import { FeaturesSection } from "@/components/landing-page/FeaturesSection";


// Componente Principal da Página
export default function HomePage() {
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchLandingPageData() {
      try {
        const response = await api.get('/landing-page');
        setLandingPageData(response.data);
      } catch (err) {
        console.error("Failed to fetch landing page data:", err);
        setError("Não foi possível carregar os dados da página inicial.");
        toast.error("Erro ao carregar a página inicial.");
        // Opcional: redirecionar para uma página de erro ou mostrar um fallback
        // router.push('/error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLandingPageData();
  }, []);

  if (isLoading) {
    return <p className="text-center p-10">Carregando...</p>;
  }

  if (error) {
    return <p className="text-center p-10 text-red-500">{error}</p>;
  }

  if (!landingPageData || landingPageData.sections.length === 0) {
    return <p className="text-center p-10">Nenhuma seção configurada para a landing page.</p>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <PublicNavbar
        logoText={landingPageData.logoText}
        logoImage={landingPageData.logoImage}
      />

      <main className="flex-1">
        {landingPageData.sections.map((section) => {
          // Mapeia o conteúdo JSON para o tipo de configuração correto
          const sectionConfig: SectionConfig = {
            ...section.content,
            type: section.type,
          } as SectionConfig; // Type assertion para garantir compatibilidade

          switch (section.type) {
            case "hero":
              return <HeroSection key={section.id} config={sectionConfig as HeroSectionConfig} />;
            case "features":
              return <FeaturesSection key={section.id} config={sectionConfig as FeaturesSectionConfig} />;
            default:
              return null;
          }
        })}
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 Sistema de Beleza. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}