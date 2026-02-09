"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { ProcessGalleryConfig } from "@/config/landing-page";
import { API_BASE_URL } from "@/lib/api";

interface ProcessGalleryProps {
  config?: ProcessGalleryConfig;
}

// Valores padrão (fallback)
const DEFAULT_CONFIG: ProcessGalleryConfig = {
  type: "process-gallery",
  title: "Nossos Processos",
  description:
    "Conheça a tecnologia e os processos que fazem da Electrosal referência em galvanoplastia",
  ctaButtonText: "Entre em Contato",
  ctaButtonLink: "/entrar",
  processes: [
    {
      image: "/images/landing/banner-banho.png",
      title: "Banho Químico de Precisão",
      description:
        "Processos controlados com máxima precisão para garantir acabamentos perfeitos e duradouros.",
      icon: "Zap",
    },
    {
      image: "/images/landing/banner-bijou.png",
      title: "Joias de Alta Qualidade",
      description:
        "Revestimentos nobres em ouro, prata e ródio para joias que encantam e resistem ao tempo.",
      icon: "Sparkles",
    },
    {
      image: "/images/landing/banner-lab.png",
      title: "Tecnologia e Sustentabilidade",
      description:
        "Equipamentos modernos e processos eco-friendly para resultados excepcionais com responsabilidade.",
      icon: "Shield",
    },
  ],
};

const colorGradients = [
  "from-blue-500/20 to-cyan-500/20",
  "from-amber-500/20 to-yellow-500/20",
  "from-green-500/20 to-emerald-500/20",
];

export function ProcessGalleryDynamic({ config }: ProcessGalleryProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Merge config com default
  const data = { ...DEFAULT_CONFIG, ...config };

  // Função para obter URL de imagem (SEMPRE retorna string válida, NUNCA undefined)
  const getImageUrl = (path: string | undefined | null): string => {
    // Se não tem path, retorna string vazia
    if (!path || path === 'undefined' || path === 'null') return "";
    if (path.startsWith("/")) return path;
    // Se parece com ID (uuid), busca do backend usando o endpoint público
    if (path.match(/^[0-9a-f-]{36}$/i)) return `${API_BASE_URL}/public-media/${path}`;
    return path;
  };

  return (
    <section
      id="galeria"
      ref={ref}
      className="relative w-full py-20 md:py-32 bg-muted/30 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground">
            {data.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {data.title.split(" ").slice(-1)[0]}
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            {data.description}
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {data.processes.map((process, index) => {
            const Icon = LucideIcons[
              process.icon as keyof typeof LucideIcons
            ] as LucideIcon;
            const colorGradient =
              colorGradients[index % colorGradients.length];
            const imageUrl = getImageUrl(process.image);
            // Proteção: só renderiza imagem se tiver URL válida
            const hasValidImageUrl = imageUrl && imageUrl !== "" && !imageUrl.includes("undefined");

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
                }
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group"
              >
                <div className="relative h-full bg-card border border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500">
                  {/* Image Container with Hover Effect */}
                  {hasValidImageUrl && (
                    <div className="relative h-72 overflow-hidden">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full h-full"
                      >
                        <Image
                          src={imageUrl}
                          alt={process.title}
                          fill
                          className="object-cover"
                        />
                      </motion.div>

                      {/* Gradient Overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t ${colorGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      />

                      {/* Icon Badge */}
                      {Icon && (
                        <div className="absolute top-4 right-4 w-12 h-12 bg-primary/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                          <Icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl md:text-2xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
                      {process.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {process.description}
                    </p>
                  </div>

                  {/* Bottom Accent Line */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-muted-foreground mb-6">
            Quer conhecer mais sobre nossos processos?
          </p>
          <a
            href={data.ctaButtonLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <LucideIcons.Sparkles className="w-5 h-5" />
            {data.ctaButtonText}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
