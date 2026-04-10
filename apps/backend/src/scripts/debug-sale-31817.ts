import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sale = await prisma.sale.findFirst({
    where: { orderNumber: 31817 as any },
    include: {
      saleItems: {
        include: {
          product: true,
          saleItemLots: {
            include: {
              inventoryLot: true
            }
          }
        }
      },
      adjustment: true
    }
  });

  console.log('--- VENDA ---');
  console.log(JSON.stringify(sale, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
