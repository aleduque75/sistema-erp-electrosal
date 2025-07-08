
'use client';

import Link from 'next/link';
import translations from '../../../public/locales/pt/common.json';
import { ThemeToggle } from '../ui/theme-toggle';

export function PublicNavbar() {
  return (
    <nav className="bg-primary-700 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-primary-foreground text-xl font-bold tracking-wide">
          Sistema Beleza
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-primary-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
            {translations.navbar.login}
          </Link>
          <Link href="/register" className="text-primary-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
            {translations.navbar.register}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
