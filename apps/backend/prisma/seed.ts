import { PrismaClient, TipoContaContabilPrisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

// 1. ESTRUTURA DO NOVO PLANO DE CONTAS
const planoDeContasEstruturado = [
  {
    codigo: '1',
    nome: 'ATIVOS',
    tipo: TipoContaContabilPrisma.ATIVO,
    aceitaLancamento: false,
    subContas: [
      {
        codigo: '1.1',
        nome: 'ATIVO CIRCULANTE',
        tipo: TipoContaContabilPrisma.ATIVO,
        aceitaLancamento: false,
        subContas: [
          {
            codigo: '1.1.1',
            nome: 'Caixa Geral',
            tipo: TipoContaContabilPrisma.ATIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '1.1.2',
            nome: 'Contas Correntes',
            tipo: TipoContaContabilPrisma.ATIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '1.1.3',
            nome: 'Contas a Receber de Clientes',
            tipo: TipoContaContabilPrisma.ATIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '1.1.4',
            nome: 'Empréstimos e Adiantamentos a Terceiros',
            tipo: TipoContaContabilPrisma.ATIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '1.1.5',
            nome: 'Estoque de Produtos',
            tipo: TipoContaContabilPrisma.ATIVO,
            aceitaLancamento: true,
          },
        ],
      },
    ],
  },
  {
    codigo: '2',
    nome: 'PASSIVOS',
    tipo: TipoContaContabilPrisma.PASSIVO,
    aceitaLancamento: false,
    subContas: [
      {
        codigo: '2.1',
        nome: 'PASSIVO CIRCULANTE',
        tipo: TipoContaContabilPrisma.PASSIVO,
        aceitaLancamento: false,
        subContas: [
          {
            codigo: '2.1.1',
            nome: 'Fornecedores',
            tipo: TipoContaContabilPrisma.PASSIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '2.1.2',
            nome: 'Impostos a Pagar',
            tipo: TipoContaContabilPrisma.PASSIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '2.1.3',
            nome: 'Salários a Pagar',
            tipo: TipoContaContabilPrisma.PASSIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '2.1.4',
            nome: 'Empréstimos e Financiamentos',
            tipo: TipoContaContabilPrisma.PASSIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '2.1.5',
            nome: 'Cartões de Crédito a Pagar',
            tipo: TipoContaContabilPrisma.PASSIVO,
            aceitaLancamento: false,
            subContas: [
              {
                codigo: '2.1.5.1',
                nome: 'Fatura Cartão Principal',
                tipo: TipoContaContabilPrisma.PASSIVO,
                aceitaLancamento: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    codigo: '3',
    nome: 'PATRIMÔNIO LÍQUIDO',
    tipo: TipoContaContabilPrisma.PATRIMONIO_LIQUIDO,
    aceitaLancamento: false,
    subContas: [
      {
        codigo: '3.1',
        nome: 'Capital Social e Retiradas',
        tipo: TipoContaContabilPrisma.PATRIMONIO_LIQUIDO,
        aceitaLancamento: false,
        subContas: [
          {
            codigo: '3.1.1',
            nome: 'Capital Social Integralizado',
            tipo: TipoContaContabilPrisma.PATRIMONIO_LIQUIDO,
            aceitaLancamento: true,
          },
          {
            codigo: '3.1.2',
            nome: 'Aportes de Sócios',
            tipo: TipoContaContabilPrisma.PATRIMONIO_LIQUIDO,
            aceitaLancamento: true,
          },
          {
            codigo: '3.1.3',
            nome: 'Retiradas de Sócios / Pró-labore',
            tipo: TipoContaContabilPrisma.PATRIMONIO_LIQUIDO,
            aceitaLancamento: true,
          },
        ],
      },
    ],
  },
  {
    codigo: '4',
    nome: 'RECEITAS',
    tipo: TipoContaContabilPrisma.RECEITA,
    aceitaLancamento: false,
    subContas: [
      {
        codigo: '4.1',
        nome: 'RECEITA OPERACIONAL',
        tipo: TipoContaContabilPrisma.RECEITA,
        aceitaLancamento: false,
        subContas: [
          {
            codigo: '4.1.1',
            nome: 'Venda de Produtos',
            tipo: TipoContaContabilPrisma.RECEITA,
            aceitaLancamento: true,
          },
          {
            codigo: '4.1.2',
            nome: 'Prestação de Serviços',
            tipo: TipoContaContabilPrisma.RECEITA,
            aceitaLancamento: true,
          },
        ],
      },
    ],
  },
  {
    codigo: '5',
    nome: 'DESPESAS E CUSTOS',
    tipo: TipoContaContabilPrisma.DESPESA,
    aceitaLancamento: false,
    subContas: [
      {
        codigo: '5.1',
        nome: 'DESPESAS OPERACIONAIS',
        tipo: TipoContaContabilPrisma.DESPESA,
        aceitaLancamento: false,
        subContas: [
          {
            codigo: '5.1.1',
            nome: 'Salários e Encargos',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.2',
            nome: 'Aluguel e Condomínio',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.3',
            nome: 'Contas de Consumo (Água, Luz, Internet)',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.4',
            nome: 'Marketing e Publicidade',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.5',
            nome: 'Transporte e Deslocamento (Motoboy, etc)',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.6',
            nome: 'Assinaturas e Software',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.7',
            nome: 'Taxas de Cartão e Bancárias',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.8',
            nome: 'Serviços de Terceiros',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.9',
            nome: 'Lançamentos a Classificar',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
        ],
      },
    ],
  },
];

// 2. FUNÇÃO RECURSIVA PARA CRIAR AS CONTAS E SUB-CONTAS
async function seedContas(
  organizationId: string,
  contas: any[],
  contaPaiId: string | null = null,
) {
  for (const conta of contas) {
    const createdConta = await prisma.contaContabil.create({
      data: {
        organizationId,
        codigo: conta.codigo,
        nome: conta.nome,
        tipo: conta.tipo,
        aceitaLancamento: conta.aceitaLancamento,
        contaPaiId: contaPaiId,
      },
    });

    if (conta.subContas && conta.subContas.length > 0) {
      await seedContas(organizationId, conta.subContas, createdConta.id);
    }
  }
}

async function main() {
  console.log('Iniciando o processo de seed...');

  // --- SEÇÃO DE LIMPEZA COMPLETA ---
  console.log('Limpando dados antigos...');
  // Nível mais alto de dependência
  await prisma.creditCardTransaction.deleteMany();
  await prisma.saleInstallment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.stockMovement.deleteMany();

  // Nível intermediário (dependem de Pessoas, Produtos, etc.)
  await prisma.creditCardBill.deleteMany();
  await prisma.accountPay.deleteMany();
  await prisma.accountRec.deleteMany();
  await prisma.transacao.deleteMany();
  await prisma.inventoryLot.deleteMany();
  await prisma.recuperacao.deleteMany();
  await prisma.recoveryOrder.deleteMany(); // Depende de AnaliseQuimica
  await prisma.metalCredit.deleteMany(); // Depende de AnaliseQuimica e Pessoa
  await prisma.analiseQuimica.deleteMany(); // Depende de Pessoa
  await prisma.sale.deleteMany();
  await prisma.purchaseOrder.deleteMany();

  // Nível base (entidades principais)
  await prisma.creditCard.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.funcionario.deleteMany();
  await prisma.pessoa.deleteMany();
  await prisma.contaContabil.deleteMany();
  await prisma.contaCorrente.deleteMany();
  await prisma.paymentTerm.deleteMany();
  await prisma.creditCardFee.deleteMany();
  await prisma.xmlImportLog.deleteMany();

  // Configurações e Usuários
  await prisma.section.deleteMany();
  await prisma.landingPage.deleteMany();
  await prisma.media.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  // ------------------------------------

  console.log('Criando organização principal...');
  const organization = await prisma.organization.create({
    data: {
      name: 'Minha Empresa Principal',
    },
  });

  console.log('Criando cliente de sistema para resíduos...');
  await prisma.pessoa.upsert({
    where: { id: 'SYSTEM_RESIDUE' },
    update: {},
    create: {
      id: 'SYSTEM_RESIDUE',
      organizationId: organization.id,
      name: 'Resíduos do Sistema',
      type: 'JURIDICA',
      razaoSocial: 'Resíduos Internos do Sistema',
    },
  });

  console.log('Criando usuário principal...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Administrador',
      password: hashedPassword,
      organizationId: organization.id,
    },
  });

  console.log('Criando configurações do usuário...');
  await prisma.userSettings.create({
    data: {
      userId: user.id,
    },
  });

  console.log('Criando plano de contas completo...');
  await seedContas(organization.id, planoDeContasEstruturado);

  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });