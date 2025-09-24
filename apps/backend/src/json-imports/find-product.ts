
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
      console.log('Produto encontrado:');
      console.table([product]);
    } else {
      console.log('Produto "El Sal 68%" não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
