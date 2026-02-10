import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const product = await prisma.product.findFirst({
      where: {
        name: 'El Sal 68%',
      },
    });
    if (product) {
      console.table([product]);
    } else {
    }
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

main();