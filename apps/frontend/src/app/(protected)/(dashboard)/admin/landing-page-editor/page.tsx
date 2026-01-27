"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  LandingPageData,
  HeroSectionConfig,
  FeaturesSectionConfig,
} from "@/config/landing-page"; // Importa os tipos do frontend

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react"; // Importação corrigida
import { MediaLibrary } from "@/components/media/MediaLibrary";
import Image from "next/image";

// Esquema de validação para o conteúdo das seções
const heroContentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório."),
  description: z.string().min(1, "Descrição é obrigatória."),
  mainImage: z.string().optional(), // Agora é opcional e pode ser um ID de mídia
  sideImages: z.array(z.string()).optional(), // Array de IDs de mídia
  ctaButtonText: z.string().min(1, "Texto do botão CTA é obrigatório."),
  ctaButtonLink: z.string().min(1, "Link do botão CTA é obrigatório."),
  secondaryButtonText: z.string().min(1, "Texto do botão secundário é obrigatório."),
  secondaryButtonLink: z.string().min(1, "Link do botão secundário é obrigatório."),
});

const featureItemSchema = z.object({
  icon: z.string().min(1, "Ícone é obrigatório."),
  title: z.string().min(1, "Título do item é obrigatório."),
  description: z.string().min(1, "Descrição do item é obrigatória."),
});

const featuresContentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório."),
  description: z.string().min(1, "Descrição é obrigatória."),
  items: z.array(featureItemSchema),
});

// Esquema principal para o formulário
const formSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().optional(), // ID do banco de dados
      order: z.number(),
      type: z.string(),
      content: z.union([heroContentSchema, featuresContentSchema, z.record(z.any())]), // Permite outros tipos de conteúdo JSON
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

export default function LandingPageEditorPage() {
  // Conteúdo da página comentado para focar no modal de login.
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Editor da Landing Page</h1>
      <p className="text-muted-foreground mt-2">
        O conteúdo desta página foi temporariamente desativado para permitir o teste de outras funcionalidades.
      </p>
    </div>
  );
}