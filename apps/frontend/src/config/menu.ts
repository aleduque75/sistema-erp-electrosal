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
  HandCoins,
  BarChart2, // Adicionado para Créditos de Clientes
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
        href: "/cadastros/grupos-de-produto",
        icon: Package,
        description: "Gerencie grupos e configure o método de cálculo de ajuste.",
      },
      {
        title: "Matérias-Primas",
        href: "/raw-materials",
        icon: Package,
        description: "Gerencie suas matérias-primas.",
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
    title: "Estoque",
    href: "#",
    icon: Package,
    subItems: [
      {
        title: "Extrato de Estoque",
        href: "/estoque/extrato",
        icon: FileText,
        description: "Visualize o extrato de movimentação de um produto.",
      },
      {
        title: "Ajuste Manual",
        href: "/estoque/adjust",
        icon: PlusCircle,
        description: "Faça uma entrada ou saída manual no estoque.",
      },
      { // Novo item
        title: "Lotes de Metal Puro",
        href: "/pure-metal-lots",
        icon: Package, // Pode ser outro ícone se preferir
        description: "Gerencie os lotes de metal puro disponíveis.",
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
        title: "Créditos de Clientes",
        href: "/creditos-clientes",
        icon: HandCoins,
        description: "Consulte o saldo de metal que a empresa deve aos clientes.",
      },
      {
        title: "Contas Correntes",
        href: "/contas-correntes",
        icon: Wallet,
        description: "Acompanhe o saldo e o fluxo de caixa.",
      },
      {
        title: "Configurar Contas",
        href: "/financeiro/contas",
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
        title: "Pagar Cliente com Metal",
        href: "/metal-payments/pay-client",
        icon: HandCoins, // Re-using icon, can be changed
        description: "Registre o pagamento a um cliente utilizando metal do estoque.",
      },
      {
        title: "Ajuste de Transação",
        href: "/financeiro/ajuste-transacao",
        icon: Settings, // Re-using icon
                  description: "Corrija o valor ou a conta de uma transação de recebimento existente.",
                },
              ],
            },
                {
                  title: "Relatórios",
                  href: "#",
                  icon: BarChart2,
                  subItems: [
                    {
                      title: "Extrato de Contas a Pagar",
                      href: "/relatorios/contas-a-pagar",
                      icon: ArrowDownToLine,
                      description: "Relatório de contas a pagar por fornecedor e período.",
                    },
                    { // NOVO ITEM
                      title: "Balancete de Verificação",
                      href: "/relatorios/balancete",
                      icon: ListChecks, // Usando ListChecks, pode ser alterado
                      description: "Visualize o balancete de verificação por período.",
                    },
                  ],
                },          ];
