"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroNewConfig } from "@/config/landing-page";
import { API_BASE_URL } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/LoginForm";
import { useState } from "react";

interface HeroNewProps {
  config?: HeroNewConfig;
}

// Valores padrão (fallback)
const DEFAULT_CONFIG: HeroNewConfig = {
  type: "hero-new",
  logoImage: "/images/landing/logo.png",
  title: "Electrosal",
  subtitle: "Galvanoplastia de Excelência",
  description:
    "Transformamos metais em obras-primas através de processos químicos de alta precisão, oferecendo acabamentos que combinam beleza, durabilidade e inovação.",
  ctaButtonText: "Comece Agora",
  ctaButtonLink: "/entrar",
  secondaryButtonText: "Ver Nossos Processos",
  secondaryButtonLink: "#galeria",
  backgroundImage: "/images/landing/banner-galvano.png",
  stats: {
    years: "20+",
    pieces: "10k+",
    satisfaction: "99%",
  },
};

export function HeroNew({ config }: HeroNewProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Merge config com default
  const data = { ...DEFAULT_CONFIG, ...config };

  // Função para obter URL de imagem (SEMPRE retorna string válida, NUNCA undefined)
  const getImageUrl = (path: string | undefined | null): string => {
    // Se não tem path, retorna imagem padrão
    if (!path || path === 'undefined' || path === 'null') {
      return DEFAULT_CONFIG.backgroundImage || "";
    }
    // Se começa com /, é caminho local
    if (path.startsWith("/")) return path;
    // Se parece com ID (uuid), busca do backend usando o endpoint público
    if (path.match(/^[0-9a-f-]{36}$/i)) return `${API_BASE_URL}/public-media/${path}`;
    return path;
  };

  const logoUrl = getImageUrl(data.logoImage || DEFAULT_CONFIG.logoImage);
  const bgUrl = getImageUrl(data.backgroundImage || DEFAULT_CONFIG.backgroundImage);

  // Proteção: só renderiza imagens se tiver URL válida
  const hasValidLogoUrl = logoUrl && logoUrl !== "" && !logoUrl.includes("undefined");
  const hasValidBgUrl = bgUrl && bgUrl !== "" && !bgUrl.includes("undefined");

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {hasValidBgUrl && (
          <Image
            src={bgUrl}
            alt="Processo de Galvanoplastia"
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15)_0%,transparent_50%)]" />
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Logo */}
          {hasValidLogoUrl && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex justify-center mb-8"
            >
              <div className="relative w-48 h-48 md:w-64 md:h-64">
                <Image
                  src={logoUrl}
                  alt={`${data.title} Logo`}
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </motion.div>
          )}

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Tecnologia de Ponta
              </span>
            </div>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight"
          >
            <span className="block text-foreground drop-shadow-lg">
              {data.title}
            </span>
            <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              {data.subtitle}
            </span>
          </motion.h1>

          {/* Descrição */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-3xl mx-auto text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed"
          >
            {data.description}
          </motion.p>

          {/* Botões */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-8 py-6 text-lg rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-primary/50"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative flex items-center gap-2">
                    {data.ctaButtonText}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Entrar no Sistema</DialogTitle>
                </DialogHeader>
                <LoginForm onLoginSuccess={() => setIsLoginModalOpen(false)} />
              </DialogContent>
            </Dialog>

            {data.secondaryButtonText && (
              <Link href={data.secondaryButtonLink} passHref>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-card/50 backdrop-blur-sm text-foreground border-2 border-primary/30 hover:bg-primary/10 hover:border-primary font-semibold px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105"
                >
                  {data.secondaryButtonText}
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Stats */}
          {data.stats && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {data.stats.years}
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  Anos de Experiência
                </div>
              </div>
              <div className="text-center border-x border-border/50">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {data.stats.pieces}
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  Peças Processadas
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {data.stats.satisfaction}
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  Satisfação
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-sm font-medium">Role para explorar</span>
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
