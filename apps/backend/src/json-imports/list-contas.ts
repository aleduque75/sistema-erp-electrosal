
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const contas = await prisma.contaContabil.findMany();
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

main();
