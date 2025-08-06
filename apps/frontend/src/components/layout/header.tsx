"use client";

import Link from "next/link";
import Image from "next/image";
import { MainMenu } from "./main-menu";
import { MobileMenu } from "./mobile-menu";
import { UserNav } from "./user-nav";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";


import { API_BASE_URL } from "@/lib/api";


interface HeaderProps {
  logoText?: string | null;
  logoImage?: {
    id: string;
    path: string;
    filename: string;
    width?: number | null;
    height?: number | null;
  } | null;
}

export function Header({ logoText, logoImage }: HeaderProps) {
  // --- Lógica de Renderização do Logotipo ---
  const renderLogo = () => {
    // Caso 1: Tem imagem
    if (logoImage) {
      const isSquare =
        logoImage.width &&
        logoImage.height &&
        Math.abs(logoImage.width / logoImage.height - 1) < 0.1;
      const showTextWithImage = isSquare;
      const imageSrc = `${API_BASE_URL}${logoImage.path}`;

      return (
        <>
          <Image
            src={imageSrc}
            alt={logoText || 'Logo'}
            width={showTextWithImage ? 32 : 160}
            height={32}
            className="object-contain"
          />
          {showTextWithImage && (
            <span className="font-bold sm:inline-block">{logoText}</span>
          )}
        </>
      );
    }

    // Caso 2: Não tem imagem, mas tem texto
    if (logoText) {
      return <span className="font-bold sm:inline-block">{logoText}</span>;
    }

    // Caso 3: Fallback (sem imagem e sem texto do backend)
    return (
      <>
        <Image
          src="/images/logo.png"
          alt="Sistema Beleza Logo"
          width={160}
          height={32}
        />
        <span className="font-bold sm:inline-block">Sistema Beleza</span>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center flex-grow lg:flex-grow-0"> {/* Logo - ocupa espaço em telas pequenas, mas não em grandes */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            {renderLogo()}
          </Link>
        </div>

        {/* Menu Desktop */}
        <div className="hidden lg:flex"> {/* Garante que o MainMenu seja visível apenas em telas grandes */}
          <MainMenu />
        </div>

        {/* Itens da Direita */}
        <div className="flex items-center justify-end space-x-2">
          <ThemeSwitcher />
          <div className="hidden lg:flex">
            {" "}
            <UserNav />{" "}
          </div>
          <div className="lg:hidden"> {/* MobileMenu visível em mobile e tablet */}
            {" "}
            <MobileMenu />{" "}
          </div>
        </div>
      </div>
    </header>
  );
}