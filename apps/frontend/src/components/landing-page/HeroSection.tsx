import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// REMOVIDO: import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// REMOVIDO: import { LoginForm } from "@/app/page"; // Importe o LoginForm se ele estiver em page.tsx
import { HeroSectionConfig } from "@/config/landing-page";

interface HeroSectionProps {
  config: HeroSectionConfig;
}

export function HeroSection({ config }: HeroSectionProps) {
  return (
    <section className="w-full py-20 md:py-28 lg:py-36 bg-primary-50 dark:bg-gray-800/20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tighter text-primary-800 dark:text-primary-foreground sm:text-4xl md:text-5xl xl:text-6xl/none">
              {config.title}
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
              {config.description}
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
              {/* Botão CTA principal agora é um link */}
              <Link href={config.ctaButtonLink} passHref>
                <Button size="lg">{config.ctaButtonText}</Button>
              </Link>
              <Link href={config.secondaryButtonLink} passHref>
                <Button size="lg" variant="outline">
                  {config.secondaryButtonText}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Imagem Principal */}
            <div className="w-full rounded-lg overflow-hidden shadow-lg">
              <Image
                src={config.mainImage}
                alt={config.title}
                width={600}
                height={400}
                layout="responsive"
                objectFit="cover"
                className="aspect-video"
              />
            </div>
            {/* Imagens Menores */}
            {config.sideImages && config.sideImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4 w-full">
                {config.sideImages.map((imgSrc, index) => (
                  <div key={index} className="rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={imgSrc}
                      alt={`Imagem ${index + 1}`}
                      width={300}
                      height={200}
                      layout="responsive"
                      objectFit="cover"
                      className="aspect-square"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}