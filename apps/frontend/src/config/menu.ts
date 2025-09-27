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
  FlaskConical, // Ícone para Análise Química
  Scale, // Ícone para Cotações
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
        icon: Package, // Reutilizando o ícone de Package, ou encontrar um mais adequado
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
        icon: FlaskConical, // Reusing FlaskConical for now, or find a more appropriate icon
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
      { // ADDED
        title: "Contas de Metais", // ADDED
        href: "/contas-metais", // ADDED
        icon: Wallet, // ADDED - Reusing Wallet icon for now, or find a more appropriate one
        description: "Gerencie suas contas de metais preciosos.", // ADDED
      }, // ADDED
      {
        title: "Cotações",
        href: "/quotations",
        icon: Scale,
        description: "Gerencie as cotações diárias de metais.",
      },
      {
        title: "Importar Vendas Antigas",
        href: "/imports/sales",
        icon: Upload, // Reutilizando o ícone de Upload
        description: "Importe dados de vendas de sistemas legados.",
      },
      {
        title: "Importar Extrato",
        href: "/imports",
        icon: Upload,
        description: "Importe seu extrato bancário (OFX) para conciliação.",
      },
      {
        title: "Importar PDF (Fatura)",
        href: "/dashboard/pdf-import",
        icon: Upload,
        description: "Importe faturas de cartão de crédito em PDF.",
      },
      {
        title: "Faturas de Cartão",
        href: "/credit-card-bills",
        icon: CreditCard,
        description: "Acompanhe e pague as faturas dos seus cartões.",
      },
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
      // 👇 2. NOVO ITEM ADICIONADO AQUI 👇
      {
        title: "Taxas de Cartão",
        href: "/settings/fees",
        icon: Percent,
        description: "Configure as taxas para vendas no cartão de crédito.",
      },
      {
        title: "Configurar Prazos",
        href: "/settings/payment-terms",
        icon: Settings,
        description: "Ajuste as configurações gerais do sistema.",
      },
    ],
  },
];