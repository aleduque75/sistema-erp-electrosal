import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  CreditCard,
  FileText,
  Wallet,
  ArrowRightLeft,
  ListChecks,
  ArrowDownToLine,
  ArrowUpToLine,
  PlusCircle,
  FilePlus2,
  Upload,
  Settings,
  LayoutPanelLeft,
  Percent,
  FlaskConical,
  Scale,
  ClipboardList, // Ícone para PCP
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
        title: "Cadastros Empresa",
        href: "/pessoas",
        icon: Users,
        description: "Cadastre e gerencie seus clientes.",
      },
      {
        title: "Plano de Contas",
        href: "/contas-contabeis",
        icon: FileText,
        description: "Organize suas finanças com um plano de contas.",
      },
      {
        title: "Meus Cartões",
        href: "/credit-cards",
        icon: CreditCard,
        description: "Cadastre e gerencie seus cartões de crédito.",
      },
      {
        title: "Grupos de Produtos",
        href: "/product-groups",
        icon: Package,
        description: "Gerencie os grupos de produtos para comissionamento.",
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
      {
        title: "Pedidos de Compra",
        href: "/purchase-orders",
        icon: ShoppingCart,
        description: "Gerencie seus pedidos de compra de fornecedores.",
      },
      {
        title: "Análises Químicas",
        href: "/analises-quimicas",
        icon: FlaskConical,
        description: "Controle e lance resultados de análises químicas.",
      },
      {
        title: "Recuperações",
        href: "/recovery-orders",
        icon: FlaskConical,
        description: "Gerencie as ordens de recuperação de metais.",
      },
      {
        title: "Reações Químicas",
        href: "/producao/reacoes-quimicas",
        icon: FlaskConical,
        description: "Inicie e finalize reações para produção de lotes.",
      },
      {
        title: "Lançar Compra no Cartão",
        href: "/credit-card-transactions",
        icon: ArrowRightLeft,
        description: "Registre uma nova compra ou despesa no cartão.",
      },
    ],
  },
  {
    title: "PCP",
    href: "#",
    icon: ClipboardList,
    subItems: [
      {
        title: "Pedidos a Separar",
        href: "/pcp/a-separar",
        icon: ListChecks,
        description: "Visualize e processe pedidos prontos para separação.",
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
        title: "Configurar Contas",
        href: "/dashboard/financeiro/contas",
        icon: Settings,
        description: "Ajuste os saldos iniciais e outras configurações das contas.",
      },
      {
        title: "Transações",
        href: "/transacoes",
        icon: ArrowRightLeft,
        description: "Visualize todos os lançamentos financeiros.",
      },
      { 
        title: "Contas de Metais",
        href: "/contas-metais",
        icon: Wallet,
        description: "Gerencie suas contas de metais preciosos.",
      },
      {
        title: "Registrar Depósito em Metal",
        href: "/metal-deposits/new",
        icon: ArrowUpToLine, // Placeholder icon
        description: "Converta um pagamento em R$ para um crédito em metal na conta de um cliente.",
      },
      {
        title: "Cotações",
        href: "/quotations",
        icon: Scale,
        description: "Gerencie as cotações diárias de metais.",
      },
      {
        title: "Gerar Fatura Manual",
        href: "/credit-card-bills/new",
        icon: FilePlus2,
        description: "Agrupe transações em aberto para criar uma nova fatura.",
      },
      {
        title: "Recebimentos de Metal",
        href: "/financeiro/recebimentos-metais",
        icon: Wallet, // Re-using icon, can be changed
        description: "Gerencie os recebimentos de metal pendentes.",
      },
      {
        title: "Ajuste de Transação",
        href: "/financeiro/ajuste-transacao",
        icon: Settings, // Re-using icon
        description: "Corrija o valor ou a conta de uma transação de recebimento existente.",
      },
    ],
  },
];
