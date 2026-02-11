"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ProcessGalleryConfig } from "@/config/landing-page";
import { MediaSelector } from "./MediaSelector";
import { IconPicker } from "./IconPicker";
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const processGallerySchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  ctaButtonText: z.string().min(1, "Texto do botão CTA é obrigatório"),
  ctaButtonLink: z.string().min(1, "Link do botão CTA é obrigatório"),
  processes: z.array(
    z.object({
      image: z.string().optional(),
      title: z.string().min(1, "Título do processo é obrigatório"),
      description: z.string().min(1, "Descrição do processo é obrigatória"),
      icon: z.string().min(1, "Ícone é obrigatório"),
    })
  ),
});

interface ProcessGalleryEditorProps {
  config: ProcessGalleryConfig;
  onChange: (newConfig: ProcessGalleryConfig) => void;
}

export const ProcessGalleryEditor: React.FC<ProcessGalleryEditorProps> = ({
  config,
  onChange,
}) => {
  const form = useForm<ProcessGalleryConfig>({
    resolver: zodResolver(processGallerySchema),
    defaultValues: config,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "processes",
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onChange(value as ProcessGalleryConfig);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="gallery-title">Título da Galeria</Label>
        <Input
          id="gallery-title"
          {...form.register("title")}
          placeholder="Nossos Processos"
        />
        {form.formState.errors.title && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="gallery-description">Descrição</Label>
        <Textarea
          id="gallery-description"
          {...form.register("description")}
          placeholder="Conheça a tecnologia e os processos..."
        />
        {form.formState.errors.description && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gallery-cta-text">Texto do Botão CTA</Label>
          <Input
            id="gallery-cta-text"
            {...form.register("ctaButtonText")}
            placeholder="Entre em Contato"
          />
        </div>
        <div>
          <Label htmlFor="gallery-cta-link">Link do Botão CTA</Label>
          <Input
            id="gallery-cta-link"
            {...form.register("ctaButtonLink")}
            placeholder="/entrar"
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Processos</h3>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              append({
                image: "",
                title: "Novo Processo",
                description: "Descrição do processo",
                icon: "Zap",
              })
            }
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Processo
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Processo {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <MediaSelector
                  label="Imagem do Processo"
                  value={form.watch(`processes.${index}.image`)}
                  onChange={(id) =>
                    form.setValue(`processes.${index}.image`, id as string)
                  }
                  multiple={false}
                  sizeRecommendations="Recomendado: 800x600 pixels"
                />

                <div>
                  <Label htmlFor={`process-title-${index}`}>Título</Label>
                  <Input
                    id={`process-title-${index}`}
                    {...form.register(`processes.${index}.title`)}
                    placeholder="Banho Químico de Precisão"
                  />
                </div>

                <div>
                  <Label htmlFor={`process-description-${index}`}>
                    Descrição
                  </Label>
                  <Textarea
                    id={`process-description-${index}`}
                    {...form.register(`processes.${index}.description`)}
                    placeholder="Processos controlados com máxima precisão..."
                  />
                </div>

                <IconPicker
                  value={form.watch(`processes.${index}.icon`)}
                  onChange={(icon) =>
                    form.setValue(`processes.${index}.icon`, icon)
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
