"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useState } from "react";
import api, { API_BASE_URL } from "@/lib/api"; // Added 'api' import


interface PublicNavbarProps {
  logoText?: string | null;
  logoImage?: {
    id: string;
    path: string;
    filename: string;
    width?: number | null;
    height?: number | null;
  } | null;
}

// Componente da Barra de Navegação Pública
export function PublicNavbar({ logoText, logoImage }: PublicNavbarProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // --- Lógica de Renderização do Logotipo ---
  const renderLogo = () => {
    // Caso 1: Tem imagem
    // Caso 1: Tem imagem
    if (logoImage) {
      const isSquare =
        logoImage.width &&
        logoImage.height &&
        Math.abs(logoImage.width / logoImage.height - 1) < 0.1;
      const showTextWithImage = isSquare;

      // FIX: Check if it's a local path (starts with /images) or use API URL
      const imageSrc = logoImage.path?.startsWith('/images/')
        ? logoImage.path
        : `/api/public-media/${logoImage.id}`;

      return (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={logoText || 'Logo'}
            className="h-8 w-auto object-contain"
          />

        </div>
      );
    }

    // Caso 2: Não tem imagem, mas tem texto
    if (logoText) {
      return <span className="font-bold text-lg">{logoText}</span>;
    }

    // Caso 3: Fallback (sem imagem e sem texto do backend)
    return (
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Sistema Electrosal Logo"
          className="h-8 w-auto object-contain"
          onError={(e) => {
            // Se falhar, esconde a imagem
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  };

  return (
    <nav className="flex items-center justify-between p-4 border-b bg-background text-foreground">
      <Link href="/" className="flex items-center space-x-2">
        {renderLogo()}
      </Link>
      <div className="flex items-center space-x-4">
        <ThemeSwitcher />
        <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost">Login</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Entrar</DialogTitle>
            </DialogHeader>
            <LoginForm onLoginSuccess={() => setIsLoginModalOpen(false)} />
          </DialogContent>
        </Dialog>


      </div>
    </nav>
  );
}