import { HeroNew } from "@/components/landing-page/HeroNew";
import { ProcessGalleryDynamic } from "@/components/landing-page/ProcessGalleryDynamic";
import { FeaturesSection } from "@/components/landing-page/FeaturesSection";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import {
  LandingPageData,
  HeroNewConfig,
  ProcessGalleryConfig,
  FeaturesSectionConfig,
} from "@/config/landing-page";

// 🌐 Configuração dinâmica de API para SSR/ISR
// Usa variável de ambiente ou fallback para produção
const getApiUrl = () => {
  // Em build time, usa a variável de ambiente
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Fallback para produção (nunca usa localhost no build)
  return "https://api.electrosal.com.br";
};

const API_BASE_URL = getApiUrl();
const resolvedBaseURL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

// Função para buscar dados da Landing Page do backend
async function getLandingPageData(): Promise<LandingPageData | null> {
  try {
    const response = await fetch(`${resolvedBaseURL}/landing-page`, {
      next: { revalidate: 60 }, // Revalida a cada 60 segundos (ISR)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch landing page data: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching landing page data:", error);
    // Em caso de erro, retorna null para usar fallback estático
    return null;
  }
}

export default async function LandingPage() {
  const data = await getLandingPageData();

  // Renderiza componentes estáticos se não houver dados do backend
  if (!data || !data.sections || data.sections.length === 0) {
    return (
      <>
        <PublicNavbar logoText={data?.logoText} logoImage={data?.logoImage} />
        <main className="flex min-h-screen flex-col items-center justify-between">
          <HeroNew />
          <ProcessGalleryDynamic />
        </main>
      </>
    );
  }

  // Ordena as seções por ordem
  const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);

  return (
    <>
      <PublicNavbar logoText={data.logoText} logoImage={data.logoImage} />
      <main className="flex min-h-screen flex-col items-center justify-between">
        {sortedSections.map((section, index) => {
          switch (section.type) {
            case "hero-new":
              return <HeroNew key={section.id || index} config={section.content as HeroNewConfig} />;

            case "process-gallery":
              return (
                <ProcessGalleryDynamic
                  key={section.id || index}
                  config={section.content as ProcessGalleryConfig}
                />
              );

            case "features":
              return (
                <FeaturesSection
                  key={section.id || index}
                  config={section.content as FeaturesSectionConfig}
                />
              );

            default:
              console.warn(`Unknown section type: ${section.type}`);
              return null;
          }
        })}
      </main>
    </>
  );
}
