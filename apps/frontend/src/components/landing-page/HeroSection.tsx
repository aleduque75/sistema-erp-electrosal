import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { HeroSectionConfig } from "@/config/landing-page";
import { API_BASE_URL } from "@/lib/api";
import Autoplay from "embla-carousel-autoplay"; // Import Autoplay

interface HeroSectionProps {
  config: HeroSectionConfig;
}

export function HeroSection({ config }: HeroSectionProps) {
  // Simplificação radical para debug
  const getImageUrl = (path: string) => {
    // Se for caminho local absoluto (começa com /), usa direto.
    // O Next.js serve arquivos de 'public' na raiz.
    // Ex: /images/landing/banner.png -> http://localhost:3000/images/landing/banner.png
    return path;
  };

  const mainImageUrl = config.mainImage ? getImageUrl(config.mainImage) : null;
  const sideImageUrls = (config.sideImages || []).map(getImageUrl);

  // Combine all images for the carousel
  const carouselImages = [mainImageUrl, ...sideImageUrls].filter(Boolean) as string[];

  console.log('HeroSection Debug FIXED:', { carouselImages });

  return (
    <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden bg-background">
      {/* Background Carousel */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Carousel
          className="w-full h-full"
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
        >
          <CarouselContent className="h-full ml-0">
            {carouselImages.map((imageSrc, index) => (
              <CarouselItem key={index} className="pl-0 h-full relative w-full">
                <div className="relative w-full h-full">
                  {/* Usando <img> tag normal para garantir que não é erro do Next/Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt={`Slide ${index}`}
                    className="w-full h-full object-cover"
                    style={{ minHeight: '100%' }} // Force height
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

        </Carousel>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 h-full flex flex-col justify-center items-center text-center">
        <div className="max-w-4xl space-y-6 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-foreground drop-shadow-md">
            {config.title}
          </h1>
          <p className="max-w-[800px] mx-auto text-lg md:text-xl text-muted-foreground drop-shadow-sm leading-relaxed">
            {config.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {config.ctaButtonLink && config.ctaButtonText && (
              <Link href={config.ctaButtonLink} passHref>
                <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground border-none font-bold px-8 py-6 text-lg rounded-full shadow-lg transform transition hover:scale-105">
                  {config.ctaButtonText}
                </Button>
              </Link>
            )}
            {config.secondaryButtonLink && config.secondaryButtonText && (
              <Link href={config.secondaryButtonLink} passHref>
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary/20 hover:text-primary-foreground font-semibold px-8 py-6 text-lg rounded-full backdrop-blur-sm">
                  {config.secondaryButtonText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section >
  );
}