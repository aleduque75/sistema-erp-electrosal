import { StaticImageData } from "next/image";

// --- Tipos de Seções ---

export type HeroSectionConfig = {
  type: "hero";
  title: string;
  description: string;
  mainImage: string; // Agora será o ID da mídia ou URL
  sideImages: string[]; // Array de IDs da mídia ou URLs
  ctaButtonText: string;
  ctaButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
};

export type FeaturesSectionConfig = {
  type: "features";
  title: string;
  description: string;
  items: {
    icon: string; // Nome do ícone do lucide-react (ex: "CalendarCheck")
    title: string;
    description: string;
  }[];
};

// Adicione outros tipos de seção aqui conforme necessário (ex: TestimonialsSectionConfig, ContactSectionConfig)

export type SectionConfig = HeroSectionConfig | FeaturesSectionConfig; // | OutrosTiposDeSecao

interface CustomThemeConfig {
  light?: {
    navbar?: Record<string, string>;
    hero?: Record<string, string>;
    features?: Record<string, string>;
    // Add other sections as needed
  };
  dark?: {
    navbar?: Record<string, string>;
    hero?: Record<string, string>;
    features?: Record<string, string>;
    // Add other sections as needed
  };
}

export interface LandingPageData {
  id: string;
  name: string;
  logoText?: string; // Novo campo para o texto do logotipo
  logoImageId?: string; // Novo campo para o ID da imagem do logotipo
  logoImage?: { id: string; path: string; filename: string; }; // Detalhes da imagem do logotipo
  customThemeName?: string; // Novo campo para o nome do tema personalizado
  customTheme?: CustomThemeConfig; // Added customTheme
  sections: { // As seções virão com o ID do banco de dados
    id?: string; // Make id optional for new sections
    order: number;
    type: string;
    content: any; // O conteúdo JSON será mapeado para os tipos de seção acima
  }[];
}
