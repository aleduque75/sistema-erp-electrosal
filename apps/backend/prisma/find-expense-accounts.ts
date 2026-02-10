import { PrismaClient, TipoContaContabilPrisma } from '@prisma/client';

const prisma = new PrismaClient();

async function findExpenseAccounts() {
  console.log('Buscando contas de DESPESA existentes...');

  const organization = await prisma.organization.findFirst();
  if (!organization) {
    console.log('Nenhuma organização encontrada.');
    return;
  }

  const expenseAccounts = await prisma.contaContabil.findMany({
    where: {
      organizationId: organization.id,
      tipo: TipoContaContabilPrisma.DESPESA,
    },
    orderBy: {
      codigo: 'asc',
    },
  });

  if (expenseAccounts.length === 0) {
    console.log('Nenhuma conta de despesa encontrada.');
  } else {
    console.log('Contas de Despesa Encontradas:');
    expenseAccounts.forEach((acc) => {
      console.log(`- Código: ${acc.codigo}, Nome: ${acc.nome}`);
    });
  }
}

async function main() {
  try {
    await findExpenseAccounts();
  } catch (error) {
    console.error('Ocorreu um erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
