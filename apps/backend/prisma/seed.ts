import { PrismaClient, TipoContaContabilPrisma, ContaCorrenteType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config();

interface SeedData {
  contasCorrentes: any[];
  contasContabeis: any[];
  transacoes: any[];
}

let customSeedData: SeedData | null = null;
const seedDataPath = path.join(__dirname, '..' , '..' , 'json-imports', 'seed_data.json');

try {
  const data = fs.readFileSync(seedDataPath, 'utf-8');
  customSeedData = JSON.parse(data);
  console.log('seed_data.json carregado com sucesso.');
} catch (error) {
  console.log('seed_data.json não encontrado ou inválido. Usando dados padrão.');
}

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
  // A ordem de deleção foi ajustada para evitar erros de constraint
  await prisma.saleAdjustment.deleteMany();
  await prisma.chemical_reactions.deleteMany();
  await prisma.pure_metal_lots.deleteMany();
  await prisma.metalAccountEntry.deleteMany();
  await prisma.metalAccount.deleteMany();
  await prisma.creditCardTransaction.deleteMany();
  await prisma.saleInstallment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.accountPay.deleteMany();
  await prisma.accountRec.deleteMany();
  await prisma.transacao.deleteMany();
  await prisma.inventoryLot.deleteMany();
  await prisma.recuperacao.deleteMany();
  await prisma.metalCredit.deleteMany();
  await prisma.recoveryOrder.deleteMany();
  await prisma.analiseQuimica.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.creditCardBill.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productGroup.deleteMany();
  await prisma.contaCorrente.deleteMany();
  await prisma.contaContabil.deleteMany();
  await prisma.paymentTerm.deleteMany();
  await prisma.creditCardFee.deleteMany();
  await prisma.xmlImportLog.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.section.deleteMany();
  await prisma.landingPage.deleteMany();
  await prisma.media.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pessoa.deleteMany();
  await prisma.organization.deleteMany();

  // --- SEÇÃO DE CRIAÇÃO COM IDs FIXOS ---
  const orgId = '2a5bb448-056b-4b87-b02f-fec691dd658d';
  const userId = 'c871c1c6-8d57-4275-a489-7432c1d176cc';

  console.log(`Criando organização padrão com ID: ${orgId}`);
  const organization = await prisma.organization.create({
    data: {
      id: orgId,
      name: 'Organização Padrão',
    },
  });

  if (customSeedData && customSeedData.contasContabeis.length > 0) {
    console.log('Criando contas contábeis a partir de seed_data.json...');
    for (const conta of customSeedData.contasContabeis) {
      await prisma.contaContabil.upsert({
        where: { id: conta.id },
        update: { ...conta, organizationId: organization.id },
        create: { ...conta, organizationId: organization.id },
      });
    }
    console.log('Contas contábeis de seed_data.json criadas/atualizadas com sucesso!');
  } else {
    console.log('Criando o plano de contas padrão...');
    await seedContas(organization.id, planoDeContasEstruturado);
    console.log('Plano de contas padrão criado com sucesso!');
  }

  console.log(`Criando usuário administrador padrão com ID: ${userId}`);
  const hashedPassword = await bcrypt.hash('Electrosal123@', 10);
  await prisma.user.create({
    data: {
      id: userId,
      email: 'admin@electrosal.com',
      name: 'Admin Electrosal',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: organization.id,
    },
  });
  console.log('Usuário administrador criado com sucesso!');

  // --- SEÇÃO DE DADOS DE SEED CUSTOMIZADOS (Contas Correntes e Transações) ---
  if (customSeedData) {
    if (customSeedData.contasCorrentes.length > 0) {
      console.log('Criando contas correntes a partir de seed_data.json...');
      for (const conta of customSeedData.contasCorrentes) {
        await prisma.contaCorrente.upsert({
          where: { id: conta.id },
          update: { ...conta, organizationId: organization.id },
          create: { ...conta, organizationId: organization.id },
        });
      }
      console.log('Contas correntes de seed_data.json criadas/atualizadas com sucesso!');
    }

    if (customSeedData.transacoes.length > 0) {
      console.log('Criando transações a partir de seed_data.json...');
      for (const transacao of customSeedData.transacoes) {
        await prisma.transacao.upsert({
          where: { id: transacao.id },
          update: { ...transacao, organizationId: organization.id },
          create: { ...transacao, organizationId: organization.id },
        });
      }
      console.log('Transações de seed_data.json criadas/atualizadas com sucesso!');
    }
  }

  // --- SEÇÃO DE CONFIGURAÇÕES DE USUÁRIO ---
  console.log('Buscando contas padrão para configurar UserSettings...');
  const receitaConta = await prisma.contaContabil.findFirstOrThrow({ where: { organizationId: orgId, codigo: '4.1.1' } });
  const caixaConta = await prisma.contaContabil.findFirstOrThrow({ where: { organizationId: orgId, codigo: '1.1.1' } });
  const despesaConta = await prisma.contaContabil.findFirstOrThrow({ where: { organizationId: orgId, codigo: '5.1.10' } });
  const estoqueMetalConta = await prisma.contaContabil.findFirstOrThrow({ where: { organizationId: orgId, codigo: '1.1.4' } });
  const custoProducaoConta = await prisma.contaContabil.findFirstOrThrow({ where: { organizationId: orgId, codigo: '5.2' } });

  console.log('Criando configurações de usuário (UserSettings) com IDs fixos...');
  await prisma.userSettings.create({
    data: {
      id: '47529257-3065-4d1a-ac60-0c014c7d96af',
      userId: userId,
      defaultReceitaContaId: receitaConta.id,
      defaultCaixaContaId: caixaConta.id,
      defaultDespesaContaId: despesaConta.id,
      metalStockAccountId: estoqueMetalConta.id,
      productionCostAccountId: custoProducaoConta.id,
    },
  });
  console.log('UserSettings criados com sucesso!');

  // --- SEÇÃO DE DADOS ADICIONAIS ---
  const internalClient = await prisma.pessoa.create({
    data: {
      organizationId: organization.id,
      type: 'JURIDICA',
      name: 'Cliente Interno (Resíduo)',
      razaoSocial: 'Cliente Interno (Resíduo)',
      email: 'interno@electrosal.com',
      cnpj: '00.000.000/0001-00',
    },
  });
  console.log(`Cliente interno criado: ${internalClient.id}`);

  console.log('Criando o contador de lote de produção...');
  await prisma.productionBatchCounter.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      lastBatchNumber: 1194,
    },
  });
  console.log('Contador de lote de produção criado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });