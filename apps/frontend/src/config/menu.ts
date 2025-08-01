import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  CreditCard, // Ícone que já temos
  FileText,
  Wallet,
  ArrowRightLeft, // Ícone para transações
  ListChecks,
  ArrowDownToLine,
  ArrowUpToLine,
  PlusCircle,
  FilePlus2,
  Upload,
  Settings,
  LayoutPanelLeft,
} from "lucide-react";
import React from "react";

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  icon?: React.ElementType;
  description?: string;
  subItems?: NavItem[];
}

export const menuConfig: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Cadastros",
    href: "#",
    icon: Users,
    subItems: [
      {
        title: "Produtos",
        href: "/products",
        icon: Package,
        description: "Gerencie seus produtos, estoque e preços.",
      },
      {
        title: "Clientes",
        href: "/clients",
        icon: Users,
        description: "Cadastre e gerencie seus clientes.",
      },
      {
        title: "Plano de Contas",
        href: "/contas-contabeis",
        icon: FileText,
        description: "Organize suas finanças com um plano de contas.",
      },
      // ✅ NOVO ITEM AQUI
      {
        title: "Meus Cartões",
        href: "/credit-cards",
        icon: CreditCard,
        description: "Cadastre e gerencie seus cartões de crédito.",
      },
    ],
  },
  {
    title: "Operações",
    href: "#",
    icon: ShoppingCart,
    subItems: [
      {
        title: "Realizar Venda",
        href: "/sales/new",
        icon: PlusCircle,
        description: "Registre uma nova venda de produtos ou serviços.",
      },
      {
        title: "Lista de Vendas",
        href: "/sales",
        icon: ListChecks,
        description: "Acompanhe o histórico de todas as suas vendas.",
      },
      // ✅ NOVO ITEM AQUI
      {
        title: "Lançar Compra no Cartão",
        href: "/credit-card-transactions",
        icon: ArrowRightLeft,
        description: "Registre uma nova compra ou despesa no cartão.",
      },
    ],
  },
  {
    title: "Financeiro",
    href: "#",
    icon: DollarSign,
    subItems: [
      {
        title: "Contas a Pagar",
        href: "/accounts-pay",
        icon: ArrowDownToLine,
        description: "Controle suas contas a pagar.",
      },
      {
        title: "Contas a Receber",
        href: "/accounts-rec",
        icon: ArrowUpToLine,
        description: "Gerencie suas contas a receber.",
      },
      {
        title: "Contas Correntes",
        href: "/contas-correntes",
        icon: Wallet,
        description: "Acompanhe o saldo e o fluxo de caixa.",
      },
      {
        title: "Importar Extrato",
        href: "/imports", // O link para a página que criamos
        icon: Upload,
        description: "Importe seu extrato bancário (OFX) para conciliação.",
      },
      {
        title: "Faturas de Cartão",
        href: "/credit-card-bills",
        icon: CreditCard,
        description: "Acompanhe e pague as faturas dos seus cartões.",
      },
      // ✅ NOVO ITEM ADICIONADO
      {
        title: "Gerar Fatura Manual",
        href: "/credit-card-bills/new",
        icon: FilePlus2,
        description: "Agrupe transações em aberto para criar uma nova fatura.",
      },
    ],
  },
  {
    title: "Administração",
    href: "#",
    icon: Settings,
    subItems: [
      {
        title: "Editar Landing Page",
        href: "/landing-page-manager",
        icon: LayoutPanelLeft,
        description: "Gerencie o conteúdo da página inicial do sistema.",
      },
    ],
  },
];
