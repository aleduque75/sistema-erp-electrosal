"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation"; // <<< IMPORTADO PARA REDIRECIONAR
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api"; // <<< IMPORTADO PARA FAZER A CHAMADA DE LOGIN

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Componente do Formulário de Login (com a lógica corrigida)
const loginSchema = z.object({
  email: z.string().email("Por favor, insira um email válido."),
  password: z.string().min(1, "A senha é obrigatória."),
});
type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  // <<< CORREÇÃO: Pegamos a função 'login' do contexto, como na sua página que funciona
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // 1. Faz a chamada à API diretamente, como na sua página
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

// Componente da Navbar Pública
export function PublicNavbar() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background border-b">
      <Link href="/" className="flex items-center justify-center">
        <h1 className="text-xl font-bold text-primary">Sistema de Beleza</h1>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Entrar</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Acessar minha conta</DialogTitle>
              <DialogDescription>Bem-vindo(a) de volta!</DialogDescription>
            </DialogHeader>
            <LoginForm />
          </DialogContent>
        </Dialog>
      </nav>
    </header>
  );
}
