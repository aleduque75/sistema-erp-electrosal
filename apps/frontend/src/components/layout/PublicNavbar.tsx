"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/LoginForm";
import { useState } from "react";

interface PublicNavbarProps {
  logoText?: string | null;
  logoImage?: { id: string; path: string; filename: string; } | null;
}

// Componente da Barra de Navegação Pública
export function PublicNavbar({ logoText, logoImage }: PublicNavbarProps) {
  const displayedLogoText = logoText || "Sistema Beleza";
  const displayedLogoImageSrc = logoImage ? `${api.defaults.baseURL}${logoImage.path}` : "/images/logo.png";
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between p-4 bg-background border-b">
      <Link href="/" className="flex items-center space-x-2">
        {displayedLogoImageSrc && (
          <Image
            src={displayedLogoImageSrc}
            alt={displayedLogoText || "Logo"}
            width={logoText ? 32 : 100}
            height={logoText ? 32 : 32}
            objectFit={logoText ? "cover" : "contain"}
          />
        )}
        {displayedLogoText && (
          <span className="font-bold text-lg">
            {displayedLogoText}
          </span>
        )}
      </Link>
      <div className="space-x-4">
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

        <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
          <DialogTrigger asChild>
            <Button>Registrar</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Formulário de registro virá aqui...</p>
              {/* Aqui você integraria seu componente de formulário de registro */}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}