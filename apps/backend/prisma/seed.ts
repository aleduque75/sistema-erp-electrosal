import { PrismaClient, TipoContaContabilPrisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
// A importação do faker não é necessária se você não o usa no seed
// import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// 1. ESTRUTURA DO PLANO DE CONTAS
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
            nome: 'Contas a Receber',
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
            nome: 'Cartões de Crédito a Pagar',
            tipo: TipoContaContabilPrisma.PASSIVO,
            aceitaLancamento: false,
            subContas: [
              {
                codigo: '2.1.3.1',
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
    nome: 'DESPESAS',
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
            nome: 'Aluguel',
            tipo: TipoContaContabilPrisma.DESPESA,
            aceitaLancamento: true,
          },
          {
            codigo: '5.1.3',
            nome: 'Água, Luz e Telefone',
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
            nome: 'Transporte e Deslocamento',
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
async function seedContasRecursivo(
  userId: string,
  contas: any[],
  contaPaiId: string | null = null,
) {
  for (const conta of contas) {
    const createdConta = await prisma.contaContabil.upsert({
      where: {
        userId_codigo: { userId, codigo: conta.codigo },
      },
      update: {
        nome: conta.nome,
        tipo: conta.tipo,
        aceitaLancamento: conta.aceitaLancamento,
        contaPaiId: contaPaiId,
      },
      create: {
        userId,
        codigo: conta.codigo,
        nome: conta.nome,
        tipo: conta.tipo,
        aceitaLancamento: conta.aceitaLancamento,
        contaPaiId: contaPaiId,
      },
    });

    if (conta.subContas && conta.subContas.length > 0) {
      await seedContasRecursivo(userId, conta.subContas, createdConta.id);
    }
  }
}

async function main() {
  console.log('Iniciando o processo de seed...');

  console.log('Limpando dados antigos...');
  await prisma.creditCardTransaction.deleteMany();
  await prisma.creditCardBill.deleteMany();
  await prisma.transacao.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.accountRec.deleteMany();
  await prisma.accountPay.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.client.deleteMany();
  await prisma.product.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.xmlImportLog.deleteMany();
  await prisma.transactionCategory.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.contaContabil.deleteMany();
  await prisma.contaCorrente.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();

  console.log('Criando usuário principal...');
  const hashedPassword = await bcrypt.hash('SenhaSegura123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Administrador',
      password: hashedPassword,
    },
  });
  const userId = user.id;
  console.log('Usuário principal criado.');

  console.log('Criando plano de contas completo...');
  await seedContasRecursivo(userId, planoDeContasEstruturado);

  console.log('Criando configurações do usuário...');
  // A busca por IDs para configurações padrão deve ser feita APÓS as contas serem criadas
  const receitaConta = await prisma.contaContabil.findFirst({
    where: { userId, nome: 'Venda de Produtos' },
  });
  const caixaGeral = await prisma.contaContabil.findFirst({
    where: { userId, nome: 'Caixa Geral' },
  });

  if (receitaConta && caixaGeral) {
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        defaultReceitaContaId: receitaConta.id,
        defaultCaixaContaId: caixaGeral.id,
      },
    });
    console.log('Configurações de usuário criadas.');
  } else {
    console.warn('Contas contábeis padrão não encontradas para UserSettings.');
  }

  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  