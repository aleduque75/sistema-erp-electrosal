import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.sale.findMany({
    where: {
      orderNumber: {
        in: [31891, 31892]
      }
    },
    include: {
      pessoa: true,
      saleItems: true
    }
  });
  console.log(JSON.stringify(orders, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
