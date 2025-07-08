import { PrismaClient, TipoContaContabilPrisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker/locale/pt_BR';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding...');

  // --- 1. Criação do Usuário Padrão ---
  const hashedPassword = await bcrypt.hash('password', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Administrador',
    },
  });
  console.log('Usuário padrão verificado/criado.');
  const userId = user.id;

  // --- 2. Criação do Plano de Contas ---
  console.log('Criando plano de contas padrão...');
  const contasContabeisData = [
    {
      nome: 'ATIVO',
      tipo: TipoContaContabilPrisma.ATIVO,
      aceitaLancamento: false,
    },
    {
      nome: 'ATIVO CIRCULANTE',
      tipo: TipoContaContabilPrisma.ATIVO,
      aceitaLancamento: false,
      contaPaiNome: 'ATIVO',
    },
    {
      nome: 'CAIXA E EQUIVALENTES',
      tipo: TipoContaContabilPrisma.ATIVO,
      aceitaLancamento: false,
      contaPaiNome: 'ATIVO CIRCULANTE',
    },
    {
      nome: 'CAIXA GERAL',
      tipo: TipoContaContabilPrisma.ATIVO,
      aceitaLancamento: true,
      contaPaiNome: 'CAIXA E EQUIVALENTES',
    },
    {
      nome: 'RECEITAS',
      tipo: TipoContaContabilPrisma.RECEITA,
      aceitaLancamento: false,
    },
    {
      nome: 'RECEITA DE VENDAS',
      tipo: TipoContaContabilPrisma.RECEITA,
      aceitaLancamento: true,
      contaPaiNome: 'RECEITAS',
    },
    {
      nome: 'DESPESAS',
      tipo: TipoContaContabilPrisma.DESPESA,
      aceitaLancamento: false,
    },
  ];

  const createdContasMap: Map<string, string> = new Map();

  // Função auxiliar para obter o próximo código
  async function getNextCodigo(currentUserId: string, parentContaId?: string | null): Promise<string> {
    let proximoCodigo: string;

    if (parentContaId) {
      const contaPai = await prisma.contaContabil.findUnique({
        where: { id: parentContaId },
      });
      if (!contaPai) throw new Error('Conta pai não encontrada.');

      const irmaos = await prisma.contaContabil.findMany({
        where: { userId: currentUserId, contaPaiId: parentContaId },
        select: { codigo: true },
      });

      if (irmaos.length === 0) {
        proximoCodigo = `${contaPai.codigo}.1`;
      } else {
        const ultimosSegmentos = irmaos.map((c) =>
          parseInt(c.codigo.split('.').pop() || '0', 10),
        );
        const maiorSegmento = Math.max(...ultimosSegmentos);
        proximoCodigo = `${contaPai.codigo}.${maiorSegmento + 1}`;
      }
    } else {
      const contasRaiz = await prisma.contaContabil.findMany({
        where: { userId: currentUserId, contaPaiId: null },
        select: { codigo: true },
      });
      if (contasRaiz.length === 0) {
        proximoCodigo = '1';
      } else {
        const codigosRaiz = contasRaiz.map((c) =>
          parseInt(c.codigo.split('.')[0], 10),
        );
        const maiorCodigo = Math.max(...codigosRaiz);
        proximoCodigo = (maiorCodigo + 1).toString();
      }
    }
    return proximoCodigo;
  }

  for (const contaData of contasContabeisData) {
    const contaPai = contaData.contaPaiNome
      ? await prisma.contaContabil.findFirst({ where: { nome: contaData.contaPaiNome, userId } })
      : null;
    const contaPaiId = contaPai ? contaPai.id : null;

    const proximoCodigo = await getNextCodigo(userId, contaPaiId);

    const conta = await prisma.contaContabil.upsert({
      where: { userId_codigo: { userId, codigo: proximoCodigo } }, // Usar o código gerado
      update: {},
      create: {
        userId,
        codigo: proximoCodigo,
        nome: contaData.nome,
        tipo: contaData.tipo,
        aceitaLancamento: contaData.aceitaLancamento,
        contaPaiId: contaPaiId,
      },
    });
    createdContasMap.set(conta.nome, conta.id); // Mapear pelo nome agora
  }
  console.log('Plano de contas padrão verificado/criado.');

  // --- 3. Criação das Contas Correntes ---
  console.log('Criando contas correntes padrão...');
  const contasCorrentesData = [
    // ✅ CORREÇÃO: Adicionado o campo "nome" obrigatório
    {
      userId,
      nome: 'Caixa da Loja',
      numeroConta: 'CAIXA-01',
      saldo: 0.0,
      moeda: 'BRL',
      agencia: 'Principal',
    },
    {
      userId,
      nome: 'Banco Principal',
      numeroConta: 'BANCO-01',
      saldo: 0.0,
      moeda: 'BRL',
      agencia: '0001',
    },
  ];
  for (const contaData of contasCorrentesData) {
    await prisma.contaCorrente.upsert({
      where: {
        userId_numeroConta: { userId, numeroConta: contaData.numeroConta },
      },
      update: {},
      create: contaData,
    });
  }
  console.log('Contas correntes padrão verificadas/criadas.');

  // --- 4. Criação de Clientes Aleatórios ---
  console.log('Criando 10 clientes aleatórios...');
  for (let i = 0; i < 10; i++) {
    const clientEmail = faker.internet.email().toLowerCase();
    const existingClient = await prisma.client.findUnique({
      where: { email: clientEmail },
    });
    if (!existingClient) {
      await prisma.client.create({
        data: {
          userId,
          name: faker.person.fullName(),
          email: clientEmail,
          phone: `(${faker.string.numeric(2)}) ${faker.string.numeric(5)}-${faker.string.numeric(4)}`,
          address: faker.location.streetAddress(true),
          birthDate: faker.date.past({ years: 40, refDate: '2000-01-01' }),
          gender: faker.person.sex(),
          preferences: 'N/A',
          purchaseHistory: {},
        },
      });
    }
  }
  console.log('Clientes aleatórios criados.');

  // --- 5. Criação de Produtos Aleatórios ---
  console.log('Criando 15 produtos aleatórios...');
  for (let i = 0; i < 15; i++) {
    const productName = faker.commerce.productName();
    const existingProduct = await prisma.product.findFirst({
      where: { userId, name: productName },
    });
    if (!existingProduct) {
      await prisma.product.create({
        data: {
          userId,
          name: productName,
          description: faker.commerce.productDescription(),
          price: parseFloat(
            faker.commerce.price({ min: 10, max: 200, dec: 2 }),
          ),
          stock: faker.number.int({ min: 10, max: 100 }),
        },
      });
    }
  }
  console.log('Produtos aleatórios criados.');

  console.log('Seeding finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
