"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight,
  CalendarCheck,
  Users,
  BarChart3,
  Star,
} from "lucide-react";

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
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// Componente do Formulário de Login (pode ser movido para um arquivo separado depois)
const loginSchema = z.object({
  email: z.string().email("Por favor, insira um email válido."),
  password: z.string().min(1, "A senha é obrigatória."),
});
type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  // CORREÇÃO: Usando 'login' em vez de 'signIn'
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // 1. Faz a chamada à API diretamente
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      // 2. Chama a função de login do contexto com o token
      login(response.data.accessToken);

      // 3. Redireciona para o dashboard
      router.push("/dashboard");
      toast.success("Login realizado com sucesso!");
    } catch (error) {
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
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicNavbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="w-full py-24 md:py-32 lg:py-40 bg-primary-50 dark:bg-gray-800/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-6">
                <h1 className="text-4xl font-bold tracking-tighter text-primary-800 dark:text-primary-foreground sm:text-5xl xl:text-6xl/none">
                  Gestão Completa para seu Salão de Beleza
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Agendamentos, clientes, estoque e financeiro em um só lugar.
                  Foque na beleza, nós cuidamos da organização.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  {/* Botão que abre o Modal de Login */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg">Entrar no Sistema</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Acessar minha conta</DialogTitle>
                        <DialogDescription>
                          Bem-vindo(a) de volta! Insira seus dados para
                          continuar.
                        </DialogDescription>
                      </DialogHeader>
                      <LoginForm />
                    </DialogContent>
                  </Dialog>
                  <Button size="lg" variant="outline">
                    Ver Funcionalidades
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {/* Você pode substituir este div por uma tag <Image> do Next.js com uma foto do seu sistema ou de um salão */}
                <div className="bg-primary-200/50 rounded-lg w-full h-64 md:h-80 lg:h-96 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-primary/10 rounded-full p-4">
                  <CalendarCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Agenda Inteligente</h3>
                <p className="text-muted-foreground">
                  Organize seus horários, evite conflitos e envie lembretes
                  automáticos para seus clientes.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-primary/10 rounded-full p-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Cadastro de Clientes</h3>
                <p className="text-muted-foreground">
                  Mantenha um histórico completo de serviços, preferências e
                  informações de contato para um atendimento VIP.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-primary/10 rounded-full p-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Financeiro Descomplicado</h3>
                <p className="text-muted-foreground">
                  Controle suas contas a pagar, receber, faturas de cartão e
                  veja gráficos que mostram a saúde do seu negócio.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 Sistema de Beleza. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
