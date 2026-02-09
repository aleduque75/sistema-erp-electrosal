// src/components/landing-page/FeaturesSection.tsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FeaturesSectionConfig } from "@/config/landing-page";
import * as LucideIcons from "lucide-react";
// Importar o tipo de Icone para tipagem correta
import { LucideIcon } from "lucide-react";

interface FeaturesSectionProps {
  config: FeaturesSectionConfig;
}

export function FeaturesSection({ config }: FeaturesSectionProps) {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50 dark:bg-background"> {/* Enhanced light mode contrast */}
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-foreground mb-4">
            {config.title}
          </h2>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
            {config.description}
          </p>
        </div>
        <div className="grid items-stretch gap-8 sm:grid-cols-2 md:grid-cols-3 lg:gap-12">
          {config.items.map((item, index) => {
            // 1. OBTEMOS O COMPONENTE E TIPAMOS ELE CORRETAMENTE
            const IconComponent = LucideIcons[item.icon as keyof typeof LucideIcons] as LucideIcon;

            return (
              <Card key={index} className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-border bg-card"> {/* Changed bg-white to bg-card, border-gray-100 to border-border */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="flex flex-col items-center gap-6 pb-2 relative z-10 pt-8">
                  <div className="bg-primary/10 group-hover:bg-primary/20 rounded-full p-4 transition-colors duration-300">
                    {/* 2. USAMOS O NOME COM LETRA MAIÚSCULA DENTRO DO JSX */}
                    {IconComponent && <IconComponent className="w-10 h-10 text-primary" />}
                  </div>
                  <CardTitle className="text-xl font-bold text-center text-card-foreground">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 pb-8 text-center px-6">
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}