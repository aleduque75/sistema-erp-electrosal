import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FeaturesSectionConfig } from "@/config/landing-page";
import * as LucideIcons from "lucide-react"; // Importa todos os ícones do lucide-react

interface FeaturesSectionProps {
  config: FeaturesSectionConfig;
}

export function FeaturesSection({ config }: FeaturesSectionProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            {config.title}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-xl">
            {config.description}
          </p>
        </div>
        <div className="grid items-start gap-8 sm:grid-cols-2 md:grid-cols-3 lg:gap-12">
          {config.items.map((item, index) => {
            const Icon = LucideIcons[item.icon as keyof typeof LucideIcons]; // Acessa o ícone dinamicamente
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 rounded-full p-3">
                    {Icon && <Icon className="h-6 w-6 text-primary" />}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
