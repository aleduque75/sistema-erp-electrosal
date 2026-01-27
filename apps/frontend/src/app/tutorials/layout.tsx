import { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import Image from 'next/image';

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="mr-4 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
                <Image
                    src="/images/logo.png"
                    alt="Sistema Electrosal Logo"
                    width={160}
                    height={32}
                />
            </Link>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main className="flex-grow">{children}</main>
    </div>
  );
}
