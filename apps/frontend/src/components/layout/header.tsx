import Link from "next/link";
import { MainMenu } from "./main-menu";
import { MobileMenu } from "./mobile-menu";
import { UserNav } from "./user-nav";
import { ThemeToggle } from "../ui/theme-toggle";
import { Leaf } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">Sistema Beleza</span>
          </Link>
        </div>

        {/* Menu Desktop */}
        <div className="hidden flex-1 md:flex">
          <MainMenu />
        </div>

        {/* Itens da Direita */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          <div className="hidden md:flex">
            {" "}
            <UserNav />{" "}
          </div>
          <div className="md:hidden">
            {" "}
            <MobileMenu />{" "}
          </div>
        </div>
      </div>
    </header>
  );
}
