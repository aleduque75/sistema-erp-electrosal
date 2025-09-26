import { PrismaClient, TipoContaContabilPrisma, ContaCorrenteType } from '@prisma/client';
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
            nome: 'Estoque de Metais em Processo',
            tipo: TipoContaContabilPrisma.ATIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '1.1.5',
            nome: 'Empréstimos e Adiantamentos a Terceiros',
            tipo: TipoContaContabilPrisma.ATIVO,
            aceitaLancamento: true,
          },
          {
            codigo: '1.1.6',
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
            subContas: [
              {
                codigo: '2.1.4.01',
                nome: 'Empréstimo - Eladio (Principal)',
                tipo: TipoContaContabilPrisma.PASSIVO,
                aceitaLancamento: true,
              },
            ],
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
            nome: 'Salários e Encargos (Administrativo)',
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
          {
            codigo: '5.1.10',
            nome: 'Despesas Gerais',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.11',
            nome: 'Transferências Internas',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
        ],
      },
      {
        codigo: '5.2',
        nome: 'CUSTOS DE PRODUÇÃO',
        tipo: TipoContaContabilPrisma.DESPESA,
        aceitaLancamento: false,
        subContas: [
          {
            codigo: '5.2.1',
            nome: 'Custos de Recuperação de Metais',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: false,
            subContas: [
              {
                codigo: '5.2.1.1',
                nome: 'Matérias-Primas (Recuperação)',
                tipo: TipoContaContabilPrisma.DESPESA,
                aceitaLancamento: true,
              },
              {
                codigo: '5.2.1.2',
                nome: 'Mão de Obra Direta (Recuperação)',
                tipo: TipoContaContabilPrisma.DESPESA,
                aceitaLancamento: true,
              },
              {
                codigo: '5.2.1.3',
                nome: 'Custos Indiretos (Recuperação)',
                tipo: TipoContaContabilPrisma.DESPESA,
                aceitaLancamento: true,
              },
            ],
          },
          {
            codigo: '5.2.2',
            nome: 'Custos de Reação Química',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: false,
            subContas: [
              {
                codigo: '5.2.2.1',
                nome: 'Matérias-Primas (Reação)',
                tipo: TipoContaContabilPrisma.DESPESA,
                aceitaLancamento: true,
              },
              {
                codigo: '5.2.2.2',
                nome: 'Mão de Obra Direta (Reação)',
                tipo: TipoContaContabilPrisma.DESPESA,
                aceitaLancamento: true,
              },
              {
                codigo: '5.2.2.3',
                nome: 'Custos Indiretos (Reação)',
                tipo: TipoContaContabilPrisma.DESPESA,
                aceitaLancamento: true,
              },
            ],
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
  await prisma.quotation.deleteMany();

  // Configurações e Usuários
  await prisma.section.deleteMany();
  await prisma.landingPage.deleteMany();
  await prisma.media.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productGroup.deleteMany(); // Adicionado
  await prisma.organization.deleteMany();
  console.log('Criando contas correntes de exemplo...');
  await prisma.contaCorrente.create({
    data: {
      organizationId: organization.id,
      nome: 'Banco Principal',
      numeroConta: '12345-6',
      agencia: '0001',
      initialBalanceBRL: 10000.00,
      type: ContaCorrenteType.BANCO,
      moeda: 'BRL',
    },
  });

  await prisma.contaCorrente.create({
    data: {
      organizationId: organization.id,
      nome: 'BSA - Fornecedor de Metal',
      numeroConta: 'BSA-001',
      agencia: 'METAL',
      initialBalanceBRL: 0.00,
      type: ContaCorrenteType.FORNECEDOR_METAL,
      moeda: 'BRL',
    },
  });

  await prisma.contaCorrente.create({
    data: {
      organizationId: organization.id,
      nome: 'Eladio - Empréstimo',
      numeroConta: 'EMP-ELADIO',
      agencia: 'LOAN',
      initialBalanceBRL: 50000.00,
      type: ContaCorrenteType.EMPRESTIMO,
      moeda: 'BRL',
    },
  });