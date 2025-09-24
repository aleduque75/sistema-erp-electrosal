
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const productGroups = await prisma.productGroup.findMany();
    console.log('Grupos de Produtos:');
    console.table(productGroups);
  } catch (error) {
    console.error('Erro ao buscar grupos de produtos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
