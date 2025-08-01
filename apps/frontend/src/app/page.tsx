"use client";

import { useEffect, useState } from "react"; // Adicionado useEffect e useState
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Removidos ícones não utilizados diretamente aqui
// import { ArrowRight, CalendarCheck, Users, BarChart3, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// Importações dos novos componentes e tipos de configuração
import { LandingPageData, SectionConfig } from "@/config/landing-page";
import { HeroSection } from "@/components/landing-page/HeroSection";
import { FeaturesSection } from "@/components/landing-page/FeaturesSection";

// Componente do Formulário de Login (com os logs de depuração)
const loginSchema = z.object({
  email: z.string().email("Por favor, insira um email válido."),
  password: z.string().min(1, "A senha é obrigatória."),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    // --- INÍCIO DO DEBUG ---
    console.log("--- 1. Função onSubmit do login foi chamada ---");
    console.log("Dados do formulário:", data);
    // -----------------------

    try {
      console.log("--- 2. Tentando enviar para a API... ---");
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      console.log(
        "--- 3. Sucesso! Resposta recebida da API. ---",
        response.data
      );
      login(response.data.accessToken);
      router.push("/dashboard");
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      console.error("--- 4. ERRO! A chamada à API falhou. ---", error);
      toast.error("Falha no login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Form>
  );
}

// Componente Principal da Página
export default function HomePage() {
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLandingPageData = async () => {
      try {
        const response = await api.get("/landing-page");
        setLandingPageData(response.data);
      } catch (err: any) {
        console.error("Failed to fetch landing page data:", err);
        setError("Falha ao carregar o conteúdo da página.");
        toast.error("Falha ao carregar o conteúdo da página.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLandingPageData();
  }, []);

  if (isLoading) {
    return <p className="text-center p-10">Carregando página...</p>;
  }

  if (error) {
    return <p className="text-center p-10 text-red-500">{error}</p>;
  }

  if (!landingPageData || landingPageData.sections.length === 0) {
    return <p className="text-center p-10">Nenhuma seção configurada para a landing page.</p>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicNavbar />

      <main className="flex-1">
        {landingPageData.sections.map((section) => {
          // Mapeia o conteúdo JSON para o tipo de configuração correto
          const sectionConfig: SectionConfig = {
            ...section.content,
            type: section.type,
          } as SectionConfig; // Type assertion para garantir compatibilidade

          switch (section.type) {
            case "hero":
              return <HeroSection key={section.id} config={sectionConfig as HeroSectionConfig} />;
            case "features":
              return <FeaturesSection key={section.id} config={sectionConfig as FeaturesSectionConfig} />;
            default:
              return null;
          }
        })}
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 Sistema de Beleza. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}