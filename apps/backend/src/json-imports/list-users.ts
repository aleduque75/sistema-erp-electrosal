import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany();
    console.table(users);
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

main();