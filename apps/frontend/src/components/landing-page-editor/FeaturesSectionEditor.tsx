// apps/frontend/src/components/landing-page-editor/FeaturesSectionEditor.tsx

"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FeaturesSectionConfig } from "@/config/landing-page";
import { PlusCircle, MinusCircle } from "lucide-react";
import { IconPicker } from "./IconPicker"; // Import IconPicker

const featureItemSchema = z.object({
  icon: z.string().min(1, "Ícone é obrigatório"),
  title: z.string().min(1, "Título do item é obrigatório"),
  description: z.string().min(1, "Descrição do item é obrigatória"),
});

const featuresSectionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  items: z.array(featureItemSchema).min(1, "Pelo menos um item é obrigatório"),
});

interface FeaturesSectionEditorProps {
  config: FeaturesSectionConfig;
  onChange: (newConfig: FeaturesSectionConfig) => void;
}

export const FeaturesSectionEditor: React.FC<FeaturesSectionEditorProps> = ({
  config,
  onChange,
}) => {
  const form = useForm<FeaturesSectionConfig>({
    resolver: zodResolver(featuresSectionSchema),
    defaultValues: config,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch for changes and call onChange
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onChange(value as FeaturesSectionConfig);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="features-title">Título</Label>
        <Input id="features-title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="features-description">Descrição</Label>
        <Textarea id="features-description" {...form.register("description")} />
        {form.formState.errors.description && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <h3 className="text-lg font-semibold mt-6">Itens da Seção</h3>
      {fields.map((item, index) => (
        <div key={item.id} className="border p-4 rounded-md space-y-2 relative">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => remove(index)}
            className="absolute top-2 right-2"
          >
            <MinusCircle className="h-4 w-4 mr-2" /> Remover Item
          </Button>
          <div>
            <Label htmlFor={`items.${index}.icon`}>Ícone (Nome do Lucide Icon)</Label>
            <IconPicker
              value={form.watch(`items.${index}.icon`) || ""}
              onChange={(iconName) => form.setValue(`items.${index}.icon`, iconName)}
            />
            {form.formState.errors.items?.[index]?.icon && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.items[index]?.icon?.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor={`items.${index}.title`}>Título do Item</Label>
            <Input id={`items.${index}.title`} {...form.register(`items.${index}.title`)} />
            {form.formState.errors.items?.[index]?.title && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.items[index]?.title?.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor={`items.${index}.description`}>Descrição do Item</Label>
            <Textarea id={`items.${index}.description`} {...form.register(`items.${index}.description`)} />
            {form.formState.errors.items?.[index]?.description && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.items[index]?.description?.message}
              </p>
            )}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ icon: "", title: "", description: "" })}
        className="w-full"
      >
        <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Item
      </Button>
    </div>
  );
};
