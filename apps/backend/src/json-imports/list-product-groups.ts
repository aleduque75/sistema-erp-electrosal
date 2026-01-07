import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const productGroups = await prisma.productGroup.findMany();
    console.table(productGroups);
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

main();