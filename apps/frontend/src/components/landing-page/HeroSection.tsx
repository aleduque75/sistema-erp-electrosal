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


interface HeroSectionProps {
  config: HeroSectionConfig;
}

export function HeroSection({ config }: HeroSectionProps) {
  console.log("HeroSection config.mainImage:", config.mainImage);
  console.log("HeroSection config.sideImages:", config.sideImages);
  const mainImageUrl = config.mainImage ? `${API_BASE_URL}${config.mainImage}` : null;
  const sideImageUrls = (config.sideImages || []).map(path => `${API_BASE_URL}${path}`);
  
  // Combina todas as imagens para o carrossel, removendo valores nulos
  const carouselImages = [mainImageUrl, ...sideImageUrls].filter(Boolean) as string[];

  return (
    <section className="w-full py-20 md:py-28 lg:py-36 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-6xl/none text-foreground">
              {config.title}
            </h1>
            <p className="max-w-[600px] md:text-xl mx-auto lg:mx-0 text-muted-foreground">
              {config.description}
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
              {config.ctaButtonLink && config.ctaButtonText && (
                <Link href={config.ctaButtonLink} passHref>
                  <Button size="lg">{config.ctaButtonText}</Button>
                </Link>
              )}
              {config.secondaryButtonLink && config.secondaryButtonText && (
                <Link href={config.secondaryButtonLink} passHref>
                  <Button size="lg" variant="outline">
                    {config.secondaryButtonText}
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            {carouselImages.length > 0 && (
              <Carousel className="w-full rounded-lg overflow-hidden shadow-lg">
                <CarouselContent>
                  {carouselImages.map((imageSrc, index) => (
                    <CarouselItem key={index}>
                      <Image
                        src={imageSrc}
                        alt={`${config.title} - Imagem ${index + 1}`}
                        width={600}
                        height={400}
                        layout="responsive"
                        objectFit="cover"
                        className="aspect-video"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}