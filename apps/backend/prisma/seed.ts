import { PrismaClient, TipoContaContabilPrisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker/locale/pt_BR'; // Importar faker com locale para dados em português

const prisma = new PrismaClient();

async function main() {
  // Criar um usuário padrão se não existir
  let user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  if (!user) {
    const hashedPassword = await bcrypt.hash('password', 10);
    user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Administrador',
      },
    });
    console.log('Usuário padrão criado.');
  }

  const userId = user.id;

  // --- Contas Contábeis ---
  const contasContabeisData = [
    // Ativo
    { userId, codigo: '1', nome: 'ATIVO', tipo: TipoContaContabilPrisma.ATIVO, aceitaLancamento: false },
    { userId, codigo: '1.1', nome: 'ATIVO CIRCULANTE', tipo: TipoContaContabilPrisma.ATIVO, aceitaLancamento: false, contaPaiCodigo: '1' },
    { userId, codigo: '1.1.1', nome: 'CAIXA E EQUIVALENTES', tipo: TipoContaContabilPrisma.ATIVO, aceitaLancamento: false, contaPaiCodigo: '1.1' },
    { userId, codigo: '1.1.1.01', nome: 'CAIXA', tipo: TipoContaContabilPrisma.ATIVO, aceitaLancamento: true, contaPaiCodigo: '1.1.1' },
    { userId, codigo: '1.1.1.02', nome: 'BANCOS CONTA MOVIMENTO', tipo: TipoContaContabilPrisma.ATIVO, aceitaLancamento: true, contaPaiCodigo: '1.1.1' },
    { userId, codigo: '1.1.2', nome: 'CONTAS A RECEBER', tipo: TipoContaContabilPrisma.ATIVO, aceitaLancamento: true, contaPaiCodigo: '1.1' },
    { userId, codigo: '1.1.3', nome: 'CONTAS A RECEBER DE CARTAO', tipo: TipoContaContabilPrisma.ATIVO, aceitaLancamento: true, contaPaiCodigo: '1.1' },

    // Passivo
    { userId, codigo: '2', nome: 'PASSIVO', tipo: TipoContaContabilPrisma.PASSIVO, aceitaLancamento: false },
    { userId, codigo: '2.1', nome: 'PASSIVO CIRCULANTE', tipo: TipoContaContabilPrisma.PASSIVO, aceitaLancamento: false, contaPaiCodigo: '2' },
    { userId, codigo: '2.1.1', nome: 'FORNECEDORES', tipo: TipoContaContabilPrisma.PASSIVO, aceitaLancamento: true, contaPaiCodigo: '2.1' },
    { userId, codigo: '2.1.2', nome: 'CONTAS A PAGAR', tipo: TipoContaContabilPrisma.PASSIVO, aceitaLancamento: true, contaPaiCodigo: '2.1' },

    // Patrimônio Líquido
    { userId, codigo: '3', nome: 'PATRIMONIO LIQUIDO', tipo: TipoContaContabilPrisma.PATRIMONIO_LIQUIDO, aceitaLancamento: false },
    { userId, codigo: '3.1', nome: 'CAPITAL SOCIAL', tipo: TipoContaContabilPrisma.PATRIMONIO_LIQUIDO, aceitaLancamento: true, contaPaiCodigo: '3' },

    // Receitas
    { userId, codigo: '4', nome: 'RECEITAS', tipo: TipoContaContabilPrisma.RECEITA, aceitaLancamento: false },
    { userId, codigo: '4.1', nome: 'RECEITA DE VENDAS', tipo: TipoContaContabilPrisma.RECEITA, aceitaLancamento: true, contaPaiCodigo: '4' },

    // Despesas
    { userId, codigo: '5', nome: 'DESPESAS', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: false },
    { userId, codigo: '5.1', nome: 'DESPESAS OPERACIONAIS', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: false, contaPaiCodigo: '5' },
    { userId, codigo: '5.1.1', nome: 'ALUGUEL', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, contaPaiCodigo: '5.1' },
  ];

  const createdContasContabeis: { [key: string]: string } = {};

  for (const contaData of contasContabeisData) {
    const existingConta = await prisma.contaContabil.findUnique({
      where: { userId_codigo: { userId, codigo: contaData.codigo } },
    });

    if (!existingConta) {
      const contaPai = contaData.contaPaiCodigo
        ? await prisma.contaContabil.findUnique({ where: { userId_codigo: { userId, codigo: contaData.contaPaiCodigo } } })
        : null;

      const createdConta = await prisma.contaContabil.create({
        data: {
          userId: contaData.userId,
          codigo: contaData.codigo,
          nome: contaData.nome,
          tipo: contaData.tipo,
          aceitaLancamento: contaData.aceitaLancamento,
          contaPaiId: contaPai ? contaPai.id : null,
        },
      });
      createdContasContabeis[createdConta.codigo] = createdConta.id;
      console.log(`Conta Contábil criada: ${createdConta.nome}`);
    } else {
      createdContasContabeis[existingConta.codigo] = existingConta.id;
      console.log(`Conta Contábil já existe: ${existingConta.nome}`);
    }
  }

  // --- Contas Correntes ---
  const contasCorrentesData = [
    { userId, numeroConta: 'CAIXA', saldo: 0, moeda: 'BRL' },
    { userId, numeroConta: 'BANCO', saldo: 0, moeda: 'BRL' },
  ];

  for (const contaData of contasCorrentesData) {
    const existingConta = await prisma.contaCorrente.findUnique({
      where: { userId_numeroConta: { userId, numeroConta: contaData.numeroConta } },
    });

    if (!existingConta) {
      await prisma.contaCorrente.create({
        data: {
          userId: contaData.userId,
          numeroConta: contaData.numeroConta,
          saldo: contaData.saldo,
          moeda: contaData.moeda,
        },
      });
      console.log(`Conta Corrente criada: ${contaData.numeroConta}`);
    } else {
      console.log(`Conta Corrente já existe: ${contaData.numeroConta}`);
    }
  }

  // --- Clientes Aleatórios ---
  const numberOfClients = 10; // Quantidade de clientes aleatórios a criar
  console.log(`Criando ${numberOfClients} clientes aleatórios...`);

  for (let i = 0; i < numberOfClients; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const clientName = `${firstName} ${lastName}`;
    const clientEmail = faker.internet.email({ firstName, lastName }).toLowerCase();
   const clientPhone = `(${faker.string.numeric(2)}) ${faker.string.numeric(5)}-${faker.string.numeric(4)}`; // Formato de telefone brasileiro
    const clientAddress = faker.location.streetAddress({ useFullAddress: true });
    const birthDate = faker.date.past({ years: 40, refDate: '2000-01-01' }); // Idade entre 25 e 65 anos
    const gender = faker.person.sex();
    const preferences = JSON.stringify({
      hair: faker.lorem.word(),
      skin: faker.lorem.word(),
      products: faker.lorem.words(3).split(' '),
    });

    // Verificar se o cliente já existe pelo email (garantir unicidade)
    const existingClient = await prisma.client.findUnique({
      where: { email: clientEmail },
    });

    if (!existingClient) {
      await prisma.client.create({
        data: {
          userId,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
          birthDate: birthDate,
          gender: gender,
          preferences: preferences,
          purchaseHistory: { // Exemplo de histórico de compra vazio ou com alguns itens falsos
            lastPurchase: faker.date.past({ years: 1 }),
            totalSpent: faker.commerce.price({ min: 100, max: 1000, dec: 2 }),
          },
        },
      });
      console.log(`Cliente aleatório criado: ${clientName} (${clientEmail})`);
    } else {
      console.log(`Cliente aleatório já existe (e-mail duplicado): ${clientEmail}`);
    }
  }

  // --- Produtos Aleatórios ---
  const numberOfProducts = 15; // Quantidade de produtos aleatórios a criar
  console.log(`Criando ${numberOfProducts} produtos aleatórios...`);

  for (let i = 0; i < numberOfProducts; i++) {
    const productName = faker.commerce.productName();
    const productDescription = faker.commerce.productDescription();
    const productPrice = parseFloat(faker.commerce.price({ min: 10, max: 200, dec: 2 }));
    const productStock = faker.number.int({ min: 10, max: 100 });

    // Verificar se o produto já existe pelo nome (para evitar duplicatas se o seed rodar várias vezes)
    const existingProduct = await prisma.product.findFirst({
      where: { userId, name: productName }, // Assume que nome do produto pode ser único por usuário
    });

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          userId,
          name: productName,
          description: productDescription,
          price: productPrice,
          stock: productStock,
        },
      });
      console.log(`Produto aleatório criado: ${productName}`);
    } else {
      console.log(`Produto aleatório já existe: ${productName}`);
    }
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });