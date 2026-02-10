import { PrismaClient, TipoMetal } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting quotation backfill...');

  const sales = await prisma.sale.findMany({
    where: {
      goldPrice: {
        gt: 0,
      },
    },
  });

  console.log(`Found ${sales.length} sales with gold price.`);

  let createdCount = 0;
  for (const sale of sales) {
    if (sale.goldPrice) {
      const saleDate = new Date(sale.createdAt.toISOString().split('T')[0]);

      try {
        await prisma.quotation.create({
          data: {
            organizationId: sale.organizationId,
            metal: TipoMetal.AU,
            date: saleDate,
            buyPrice: sale.goldPrice,
            sellPrice: sale.goldPrice, // Assuming buy and sell price are the same for backfill
          },
        });
        createdCount++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          // Unique constraint violation, quotation for this date already exists.
          // We can ignore this error.
        } else {
          console.error(`Failed to create quotation for sale ${sale.id}:`, e);
        }
      }
    }
  }

  console.log(`Successfully created ${createdCount} new quotations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
