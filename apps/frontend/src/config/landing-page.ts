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

// --- Tipos para a Landing Page completa (vindo do backend) ---
export interface LandingPageData {
  id: string;
  name: string;
  sections: { // As seções virão com o ID do banco de dados
    id: string;
    order: number;
    type: string;
    content: any; // O conteúdo JSON será mapeado para os tipos de seção acima
  }[];
}
