"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HeroNewConfig } from "@/config/landing-page";
import { MediaSelector } from "./MediaSelector";

const heroNewSchema = z.object({
  logoImage: z.string().optional(),
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: z.string().min(1, "Subtítulo é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  ctaButtonText: z.string().min(1, "Texto do botão CTA é obrigatório"),
  ctaButtonLink: z.string().min(1, "Link do botão CTA é obrigatório"),
  secondaryButtonText: z.string().optional(),
  secondaryButtonLink: z.string().optional(),
  backgroundImage: z.string().optional(),
  stats: z
    .object({
      years: z.string().optional(),
      pieces: z.string().optional(),
      satisfaction: z.string().optional(),
    })
    .optional(),
});

interface HeroNewEditorProps {
  config: HeroNewConfig;
  onChange: (newConfig: HeroNewConfig) => void;
}

export const HeroNewEditor: React.FC<HeroNewEditorProps> = ({
  config,
  onChange,
}) => {
  const form = useForm<HeroNewConfig>({
    resolver: zodResolver(heroNewSchema),
    defaultValues: config,
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onChange(value as HeroNewConfig);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div className="space-y-4">
      <MediaSelector
        label="Logo da Empresa"
        value={form.watch("logoImage")}
        onChange={(id) => form.setValue("logoImage", id as string)}
        multiple={false}
        sizeRecommendations="Recomendado: 512x512 pixels (quadrado)"
      />

      <div>
        <Label htmlFor="hero-new-title">Título Principal</Label>
        <Input
          id="hero-new-title"
          {...form.register("title")}
          placeholder="Ex: Electrosal"
        />
        {form.formState.errors.title && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="hero-new-subtitle">Subtítulo</Label>
        <Input
          id="hero-new-subtitle"
          {...form.register("subtitle")}
          placeholder="Ex: Galvanoplastia de Excelência"
        />
        {form.formState.errors.subtitle && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.subtitle.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="hero-new-description">Descrição</Label>
        <Textarea
          id="hero-new-description"
          {...form.register("description")}
          placeholder="Transformamos metais em obras-primas..."
        />
        {form.formState.errors.description && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <MediaSelector
        label="Imagem de Fundo"
        value={form.watch("backgroundImage")}
        onChange={(id) => form.setValue("backgroundImage", id as string)}
        multiple={false}
        sizeRecommendations="Recomendado: 1920x1080 pixels (landscape)"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hero-new-cta-text">Texto do Botão Principal</Label>
          <Input
            id="hero-new-cta-text"
            {...form.register("ctaButtonText")}
            placeholder="Comece Agora"
          />
        </div>
        <div>
          <Label htmlFor="hero-new-cta-link">Link do Botão Principal</Label>
          <Input
            id="hero-new-cta-link"
            {...form.register("ctaButtonLink")}
            placeholder="/entrar"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hero-new-secondary-text">
            Texto do Botão Secundário
          </Label>
          <Input
            id="hero-new-secondary-text"
            {...form.register("secondaryButtonText")}
            placeholder="Ver Nossos Processos"
          />
        </div>
        <div>
          <Label htmlFor="hero-new-secondary-link">
            Link do Botão Secundário
          </Label>
          <Input
            id="hero-new-secondary-link"
            {...form.register("secondaryButtonLink")}
            placeholder="#galeria"
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-3">Estatísticas (opcional)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="stats-years">Anos de Experiência</Label>
            <Input
              id="stats-years"
              {...form.register("stats.years")}
              placeholder="20+"
            />
          </div>
          <div>
            <Label htmlFor="stats-pieces">Peças Processadas</Label>
            <Input
              id="stats-pieces"
              {...form.register("stats.pieces")}
              placeholder="10k+"
            />
          </div>
          <div>
            <Label htmlFor="stats-satisfaction">Satisfação</Label>
            <Input
              id="stats-satisfaction"
              {...form.register("stats.satisfaction")}
              placeholder="99%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
