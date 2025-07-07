// apps/frontend/src/config/menu.ts

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  subItems?: NavItem[];
}

export const menuConfig: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Cadastros',
    href: '#', // Não tem link direto, pois é um gatilho para o submenu
    subItems: [
      {
        title: 'Produtos',
        href: '/products',
        subItems: [ // Sub-sub-itens para descrição no menu desktop
          { title: 'Listar Produtos', href: '/products' },
          { title: 'Novo Produto', href: '/products/new' },
          { title: 'Relatórios de Produtos', href: '/products/reports' },
        ],
      },
      {
        title: 'Clientes',
        href: '/clients',
        subItems: [
          { title: 'Listar Clientes', href: '/clients' },
          { title: 'Novo Cliente', href: '/clients/new' },
          { title: 'Relatórios de Clientes', href: '/clients/reports' },
        ],
      },
      {
        title: 'Plano de Contas',
        href: '/contas-contabeis',
        subItems: [
          { title: 'Visualizar Plano', href: '/accounting/chart-of-accounts' },
          { title: 'Nova Conta', href: '/accounting/chart-of-accounts/new' },
        ],
      },
    ],
  },
  {
    title: 'Vendas',
    href: '#',
    subItems: [
      {
        title: 'Lista de Vendas',
        href: '/sales',
      },
      {
        title: 'Relatórios de Vendas',
        href: '/sales/reports',
      },
    ],
  },
  {
    title: 'Financeiro',
    href: '#',
    subItems: [
      {
        title: 'Contas a Pagar',
        href: '/accounts-pay',
      },
      {
        title: 'Contas a Receber',
        href: '/accounts-rec',
      },
      {
        title: 'Extratos Bancários',
        href: '/financial/statements',
      },
      {
        title: 'Fluxo de Caixa',
        href: '/contas-correntes',
      },
    ],
  },
  {
    title: 'Configurações',
    href: '#',
    subItems: [
      {
        title: 'Central de Ajuda',
        href: '/help-center',
      },
       {
        title: 'Meu Perfil',
        href: '/profile',
      },
      {
        title: 'Configurações',
        href: '/settings',
      },
      {
        title: 'Sobre',
        href: '/about',
      },
    ],
  },
];