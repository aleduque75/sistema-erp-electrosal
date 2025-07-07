// Arquivo: apps/frontend/src/app/components/Sidebar.tsx

"use client"; // Necessário porque usamos hooks como o usePathname

import Link from "next/link";
import { usePathname } from "next/navigation";

// Importando os ícones que acabamos de instalar
import {
  Home,
  Package,
  Users,
  LifeBuoy,
  CreditCard,
  ArrowRightLeft,
} from "lucide-react";

// Array com os links de navegação para deixar o código mais limpo
const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Contas a Pagar", href: "/accounts-pay", icon: CreditCard },
  { name: "Transações", href: "/transacoes", icon: ArrowRightLeft },
  { name: "Central de Ajuda", href: "/ajuda", icon: LifeBuoy },
];

export function Sidebar() {
  // Hook do Next.js para saber qual é a rota atual (ex: "/dashboard")
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col p-4 shadow-lg">
      <div className="text-2xl font-bold mb-10 pl-2">Sistema Beleza</div>
      <nav className="flex flex-col space-y-2">
        {navLinks.map((link) => {
          // Verifica se o link deve estar ativo
          // ex: se a URL for /products/new, o link /products ficará ativo
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 p-3 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-700 text-white" // Estilo do link ativo
                  : "text-gray-400 hover:bg-gray-700 hover:text-white" // Estilo do link inativo
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
