// apps/frontend/src/components/landing-page-editor/HeroSectionEditor.tsx

"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HeroSectionConfig } from "@/config/landing-page";
import { MediaSelector } from "../MediaSelector";

const heroSectionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  mainImage: z.string().optional(),
  sideImages: z.array(z.string()).optional(),
  ctaButtonText: z.string().optional(),
  ctaButtonLink: z.string().optional(),
  secondaryButtonText: z.string().optional(),
  secondaryButtonLink: z.string().optional(),
});

interface HeroSectionEditorProps {
  config: HeroSectionConfig;
  onChange: (newConfig: HeroSectionConfig) => void;
}

export const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({
  config,
  onChange,
}) => {
  const form = useForm<HeroSectionConfig>({
    resolver: zodResolver(heroSectionSchema),
    defaultValues: config,
  });

  // Watch for changes and call onChange
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onChange(value as HeroSectionConfig);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="hero-title">Título</Label>
        <Input id="hero-title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="hero-description">Descrição</Label>
        <Textarea id="hero-description" {...form.register("description")} />
        {form.formState.errors.description && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>
      <MediaSelector
        label="Imagem Principal"
        value={form.watch("mainImage")}
        onChange={(id) => form.setValue("mainImage", id as string)}
        multiple={false}
        sizeRecommendations="Recomendado: 1920x1080 pixels (largura x altura)"
      />
      <MediaSelector
        label="Imagens Laterais"
        value={form.watch("sideImages")}
        onChange={(ids) => form.setValue("sideImages", ids as string[])}
        multiple={true}
        sizeRecommendations="Recomendado: 800x600 pixels (largura x altura) para cada imagem"
      />
      <div>
        <Label htmlFor="hero-cta-text">Texto do Botão CTA</Label>
        <Input id="hero-cta-text" {...form.register("ctaButtonText")} />
      </div>
      <div>
        <Label htmlFor="hero-cta-link">Link do Botão CTA</Label>
        <Input id="hero-cta-link" {...form.register("ctaButtonLink")} />
      </div>
      <div>
        <Label htmlFor="hero-secondary-text">Texto do Botão Secundário</Label>
        <Input id="hero-secondary-text" {...form.register("secondaryButtonText")} />
      </div>
      <div>
        <Label htmlFor="hero-secondary-link">Link do Botão Secundário</Label>
        <Input id="hero-secondary-link" {...form.register("secondaryButtonLink")} />
      </div>
    </div>
  );
};
