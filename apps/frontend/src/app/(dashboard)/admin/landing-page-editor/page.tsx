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
  const [initialData, setInitialData] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sections: [],
    },
    mode: "onChange",
  });

  const { fields, update } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  // Função para buscar os dados da landing page
  useEffect(() => {
    const fetchLandingPageData = async () => {
      try {
        const response = await api.get("/landing-page");
        const data: LandingPageData = response.data;

        // Mapeia o conteúdo JSON para o formato do formulário
        const mappedSections = data.sections.map((section) => ({
          id: section.id,
          order: section.order,
          type: section.type,
          content: section.content, // O conteúdo JSON já está no formato correto
        }));

        setInitialData(data);
        form.reset({ sections: mappedSections });
      } catch (err: any) {
        console.error("Failed to fetch landing page data:", err);
        setError("Falha ao carregar o conteúdo da página de edição.");
        toast.error("Falha ao carregar o conteúdo da página de edição.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLandingPageData();
  }, []);

  // Função para salvar as alterações
  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      await api.patch("/landing-page", { sections: data.sections });
      toast.success("Landing Page atualizada com sucesso!");
      // Opcional: recarregar os dados para garantir que os IDs de novas seções sejam atualizados
      // fetchLandingPageData();
    } catch (err: any) {
      console.error("Failed to save landing page data:", err);
      toast.error(err.response?.data?.message || "Falha ao salvar a Landing Page.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-center p-10">Carregando editor...</p>;
  }

  if (error) {
    return <p className="text-center p-10 text-red-500">{error}</p>;
  }

  if (!initialData || initialData.sections.length === 0) {
    return <p className="text-center p-10">Nenhuma seção configurada para a landing page.</p>;
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Editar Landing Page</h1>
      <p className="text-muted-foreground">
        Edite o conteúdo das seções da sua landing page.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="border-l-4 border-primary">
              <CardHeader>
                <CardTitle className="capitalize">{field.type} Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {field.type === "hero" && (
                  <>
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.title`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input {...subField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.description`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea {...subField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.ctaButtonText`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Texto do Botão CTA</FormLabel>
                          <FormControl>
                            <Input {...subField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.ctaButtonLink`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Link do Botão CTA</FormLabel>
                          <FormControl>
                            <Input {...subField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.secondaryButtonText`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Texto do Botão Secundário</FormLabel>
                          <FormControl>
                            <Input {...subField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.secondaryButtonLink`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Link do Botão Secundário</FormLabel>
                          <FormControl>
                            <Input {...subField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.mainImage`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Imagem Principal</FormLabel>
                          <FormControl>
                            <MediaLibrary
                              onSelect={(mediaId) => subField.onChange(mediaId)}
                              selectedMediaId={subField.value}
                            />
                          </FormControl>
                          {subField.value && (
                            <Image
                              src={`${api.defaults.baseURL}/media/${subField.value}`}
                              alt="Imagem Principal"
                              width={100}
                              height={100}
                              className="mt-2 rounded-md object-cover"
                            />
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Imagens Laterais (IDs)</FormLabel>
                      <FormControl>
                        <Input
                          value={(form.watch(`sections.${index}.content.sideImages`) || []).join(", ")}
                          onChange={(e) =>
                            form.setValue(
                              `sections.${index}.content.sideImages`,
                              e.target.value.split(", ").filter(Boolean)
                            )
                          }
                          placeholder="IDs das imagens separados por vírgula"
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(form.watch(`sections.${index}.content.sideImages`) || []).map((imgId: string) => (
                          <Image
                            key={imgId}
                            src={`${api.defaults.baseURL}/media/${imgId}`}
                            alt="Imagem Lateral"
                            width={80}
                            height={80}
                            className="rounded-md object-cover"
                          />
                        ))}
                      </div>
                    </FormItem>
                  </>
                )}

                {field.type === "features" && (
                  <>
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.title`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input {...subField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content.description`}
                      render={({ field: subField }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea {...subField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <h3 className="text-lg font-semibold mt-4">Itens das Funcionalidades</h3>
                    {/* Mapear e editar itens de funcionalidades */}
                    {(field.content as FeaturesSectionConfig).items.map((item, itemIndex) => (
                      <Card key={itemIndex} className="p-4 bg-muted/50">
                        <FormField
                          control={form.control}
                          name={`sections.${index}.content.items.${itemIndex}.icon`}
                          render={({ field: subField }) => (
                            <FormItem>
                              <FormLabel>Ícone (Lucide React Name)</FormLabel>
                              <FormControl>
                                <Input {...subField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`sections.${index}.content.items.${itemIndex}.title`}
                          render={({ field: subField }) => (
                            <FormItem>
                              <FormLabel>Título do Item</FormLabel>
                              <FormControl>
                                <Input {...subField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`sections.${index}.content.items.${itemIndex}.description`}
                          render={({ field: subField }) => (
                            <FormItem>
                              <FormLabel>Descrição do Item</FormLabel>
                              <FormControl>
                                <Textarea {...subField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </Card>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}