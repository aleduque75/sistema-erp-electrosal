// apps/frontend/src/components/Header.tsx
import Link from 'next/link';
import { MainMenu } from '@/components/layout/main-menu'; // Importe o menu desktop
import { MobileMenu } from '@/components/layout/mobile-menu'; // Importe o menu mobile
import { Leaf } from 'lucide-react';

// Você pode adicionar outras coisas aqui, como um dropdown de usuário, etc.

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        
        {/* Logo/Nome - visível em desktop */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Sistema Beleza
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
             {/* O Menu Desktop é renderizado aqui */}
            <MainMenu />
          </nav>
        </div>

        {/* --- Menu Mobile --- */}
        <div className="flex flex-1 items-center justify-end space-x-2 md:hidden">
           {/* O Menu Mobile é renderizado aqui */}
          <MobileMenu />
        </div>

        {/* Aqui você pode adicionar um Avatar/Dropdown do usuário no futuro */}
        {/* <div className="flex flex-1 items-center justify-end space-x-4"> ... </div> */}

      </div>
    </header>
  );
}