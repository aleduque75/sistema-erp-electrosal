'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Settings, User, LogOut, FileText, Package, Upload, LayoutPanelLeft, Percent, ArrowRightLeft } from "lucide-react";

export function UserNav() {
  const { user, logout } = useAuth();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile" passHref>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings" passHref>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/audit-logs" passHref>
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              <span>Logs de Auditoria</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/estoque/adjust" passHref>
            <DropdownMenuItem>
              <Package className="mr-2 h-4 w-4" />
              <span>Ajuste Manual de Estoque</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Administração</DropdownMenuLabel>
          <Link href="/landing-page-manager" passHref>
            <DropdownMenuItem>
              <LayoutPanelLeft className="mr-2 h-4 w-4" />
              <span>Editar Landing Page</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings/fees" passHref>
            <DropdownMenuItem>
              <Percent className="mr-2 h-4 w-4" />
              <span>Taxas de Cartão</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings/payment-terms" passHref>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurar Prazos</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Importações</DropdownMenuLabel>
          <Link href="/imports/sales" passHref>
            <DropdownMenuItem>
              <Upload className="mr-2 h-4 w-4" />
              <span>Importar Vendas Antigas</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/imports" passHref>
            <DropdownMenuItem>
              <Upload className="mr-2 h-4 w-4" />
              <span>Importar Extrato</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/pdf-import" passHref>
            <DropdownMenuItem>
              <Upload className="mr-2 h-4 w-4" />
              <span>Importar PDF (Fatura)</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/sales-adjustments" passHref>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Ajuste de Vendas</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/transacoes/reconcile" passHref>
            <DropdownMenuItem>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              <span>Conciliar Transações</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}