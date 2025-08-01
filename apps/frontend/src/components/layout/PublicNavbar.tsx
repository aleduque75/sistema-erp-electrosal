"use client";

import Image from "next/image";
import Link from "next/link";

// Componente da Barra de Navegação Pública
export function PublicNavbar() {
  const defaultLogoText = "Sistema Beleza";
  const defaultLogoImage = "/images/logo.png"; // Certifique-se de que esta imagem exista em public/images

  return (
    <nav className="flex items-center justify-between p-4 bg-background border-b">
      <Link href="/" className="flex items-center space-x-2">
        {defaultLogoImage && (
          <Image
            src={defaultLogoImage}
            alt={defaultLogoText || "Logo"}
            width={32}
            height={32}
          />
        )}
        {defaultLogoText && (
          <span className="font-bold text-lg">
            {defaultLogoText}
          </span>
        )}
      </Link>
      {/* O botão de login será renderizado na HeroSection, não aqui */}
    </nav>
  );
}