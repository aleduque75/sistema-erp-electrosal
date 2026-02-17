"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Por favor, insira um email válido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    // 🔍 LOG 1: Veja no F12 do Chrome se o e-mail e senha estão certos aqui
    console.log("1. DADOS ENVIADOS:", data);
    
    setLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      
      // 🔍 LOG 2: Veja se o servidor respondeu com sucesso
      console.log("2. RESPOSTA SUCESSO:", response.data);

      const token = response.data.accessToken || response.data.token;

      if (token) {
        login(token);
        toast.success("Bem-vindo de volta!");
        if (onLoginSuccess) onLoginSuccess();
        
        // Pequeno refresh para o Chrome "acordar" os cookies/localStorage
        router.refresh();
        router.push("/dashboard");
      }
    } catch (error: any) {
      // 🔍 LOG 3: Se der erro, o motivo real vai aparecer aqui
      console.error("3. ERRO NO LOGIN:", error.response?.data || error.message);
      
      const msg = error.response?.data?.message || "Erro ao conectar com o servidor.";
      toast.error(msg);
    } finally {
      setLoading(false);
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
                {/* autoComplete="username" ajuda o Chrome a não se confundir */}
                <Input placeholder="email@exemplo.com" autoComplete="username" {...field} />
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
                <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              "Entrar"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
