import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productId = 'f3481342-998b-436b-af6f-9fe2729f02d5'; // El Sal 68%
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      productGroup: true,
    },
  });

  if (!product) {
    console.log(`Product with ID ${productId} not found.`);
  } else {
    console.log(JSON.stringify(product, null, 2));
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
