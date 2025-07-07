// apps/frontend/src/components/layout/header.tsx

import Link from 'next/link';
import { MainMenu } from './main-menu';
import { MobileMenu } from './mobile-menu';
import { Leaf } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Sistema Beleza
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <MainMenu />
          </nav>
        </div>

        {/* --- Menu Mobile --- */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:hidden">
           <Link href="/" className="flex items-center space-x-2">
             <Leaf className="h-6 w-6 text-primary" />
             <span className="font-bold">
              Sistema Beleza
             </span>
           </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}