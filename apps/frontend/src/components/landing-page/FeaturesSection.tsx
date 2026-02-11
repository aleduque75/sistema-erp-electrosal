// src/components/landing-page/FeaturesSection.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FeaturesSectionConfig } from "@/config/landing-page";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface FeaturesSectionProps {
  config?: FeaturesSectionConfig;
}

export function FeaturesSection({ config }: FeaturesSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Proteção: se não há config ou items, não renderiza nada
  if (!config || !config.items || config.items.length === 0) {
    return null;
  }

  return (
    <section ref={ref} className="w-full py-16 md:py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-foreground mb-4">
            {config.title}
          </h2>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
            {config.description}
          </p>
        </motion.div>

        <div className="grid items-stretch gap-8 sm:grid-cols-2 md:grid-cols-3 lg:gap-12">
          {config.items.map((item, index) => {
            const IconComponent = LucideIcons[item.icon as keyof typeof LucideIcons] as LucideIcon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="group relative overflow-hidden h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-border bg-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="flex flex-col items-center gap-6 pb-2 relative z-10 pt-8">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className="bg-primary/10 group-hover:bg-primary/20 rounded-full p-4 transition-colors duration-300"
                    >
                      {IconComponent && <IconComponent className="w-10 h-10 text-primary" />}
                    </motion.div>
                    <CardTitle className="text-xl font-bold text-center text-card-foreground">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 pb-8 text-center px-6">
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}