
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const contas = await prisma.contaContabil.findMany();
    console.log('Contas Contábeis:');
    console.table(contas);
  } catch (error) {
    console.error('Erro ao buscar contas contábeis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
