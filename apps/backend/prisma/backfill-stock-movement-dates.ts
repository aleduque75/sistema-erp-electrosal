import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill of stock movement dates...');

  const movements = await prisma.stockMovement.findMany({
    where: {
      type: 'SALE',
      sourceDocument: {
        startsWith: 'Venda #',
      },
    },
  });

  console.log(`Found ${movements.length} sale movements to process.`);

  let updatedCount = 0;
  for (const movement of movements) {
    const orderNumberMatch = movement.sourceDocument?.match(/#(\d+)/);
    if (!orderNumberMatch) {
      console.warn(`Could not parse order number from source document: ${movement.sourceDocument}`);
      continue;
    }

    const orderNumber = parseInt(orderNumberMatch[1], 10);

    const sale = await prisma.sale.findUnique({
      where: { orderNumber },
    });

    if (!sale) {
      console.warn(`Sale with order number ${orderNumber} not found for movement ${movement.id}`);
      continue;
    }

    if (movement.createdAt.getTime() !== sale.createdAt.getTime()) {
      await prisma.stockMovement.update({
        where: { id: movement.id },
        data: { createdAt: sale.createdAt },
      });
      updatedCount++;
      console.log(`Updated movement ${movement.id} to date ${sale.createdAt.toISOString()}`);
    }
  }

  console.log(`Backfill complete. Updated ${updatedCount} stock movement dates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
