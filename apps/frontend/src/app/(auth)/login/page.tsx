"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, User, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface LandingPageData {
  logoText?: string;
  logoImageId?: string;
}

async function getLandingPageLogo(): Promise<LandingPageData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/landing-page`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar logo:", error);
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoData, setLogoData] = useState<LandingPageData | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verifica se já está autenticado
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Verifica se o token é válido
          const response = await api.get("/auth/me");
          if (response.status === 200) {
            // Usuário já autenticado, redireciona para o editor
            router.push("/dashboard");
            return;
          }
        }
      } catch (error) {
        // Token inválido, remove do localStorage
        localStorage.removeItem("token");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [router]);

  // Carrega o logo da empresa
  useEffect(() => {
    const fetchLogo = async () => {
      const data = await getLandingPageLogo();
      setLogoData(data);
    };
    fetchLogo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        toast.success("Login realizado com sucesso!");
        // Redireciona para o editor de landing page
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error(
        error.response?.data?.message || "Credenciais inválidas. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getLogoUrl = (logoImageId: string | undefined) => {
    if (!logoImageId) return "";
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL;
    return `${baseUrl}/api/media/public-media/${logoImageId}`;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <p className="text-slate-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo da Empresa */}
        <div className="text-center mb-8">
          {logoData?.logoImageId ? (
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24">
                <Image
                  src={getLogoUrl(logoData.logoImageId)}
                  alt={logoData.logoText || "Logo"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
              <Lock className="w-12 h-12 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">
            {logoData?.logoText || "Sistema ERP"}
          </h1>
          <p className="text-slate-600 mt-2">Acesso ao Painel Administrativo</p>
        </div>

        {/* Formulário de Login */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center text-slate-700">
              Fazer Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no Sistema"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Link para voltar ao site */}
        <div className="text-center mt-6">
          <Button
            variant="link"
            className="text-slate-600 hover:text-slate-800"
            onClick={() => router.push("/")}
          >
            ← Voltar ao site público
          </Button>
        </div>
      </div>
    </div>
  );
}
