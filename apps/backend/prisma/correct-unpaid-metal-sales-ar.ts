import { PrismaClient, Sale, AccountRec } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting correction of unpaid metal sales AccountRecs...');

  const unpaidMetalSales = await prisma.sale.findMany({
    where: {
      goldValue: { gt: 0 },
      accountsRec: {
        some: {
          received: false,
        },
      },
    },
    include: {
      accountsRec: true,
    },
  });

  console.log(`Found ${unpaidMetalSales.length} unpaid metal sales.`);

  for (const sale of unpaidMetalSales) {
    const saleTotalAmount = new Decimal(sale.totalAmount);
    const saleGoldPrice = new Decimal(sale.goldPrice || 0);

    if (saleGoldPrice.isZero()) {
      console.log(`Skipping Sale ${sale.orderNumber} due to zero gold price.`);
      continue;
    }

    const correctGoldValue = saleTotalAmount.dividedBy(saleGoldPrice);

    if (correctGoldValue.toDP(4).equals(new Decimal(sale.goldValue || 0).toDP(4))) {
      console.log(`Sale ${sale.orderNumber} already has correct goldValue. Skipping.`);
      continue;
    }

    const ar = sale.accountsRec.find(ar => !ar.received);
    if (!ar) {
      console.log(`Sale ${sale.orderNumber} has no unpaid AccountRec. Skipping.`);
      continue;
    }

    console.log(`Correcting Sale ${sale.orderNumber}:`);
    console.log(`  Old Sale goldValue: ${sale.goldValue}`);
    console.log(`  New Sale goldValue: ${correctGoldValue.toDP(4)}`);
    console.log(`  Old AccountRec goldAmount: ${ar.goldAmount}`);
    console.log(`  New AccountRec goldAmount: ${correctGoldValue.toDP(4)}`);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            goldValue: correctGoldValue.toDP(4),
          },
        });

        await tx.accountRec.update({
          where: { id: ar.id },
          data: {
            goldAmount: correctGoldValue.toDP(4),
            amount: 0,
          },
        });
      });
      console.log(`Successfully corrected Sale ${sale.orderNumber} and its AccountRec.`);
    } catch (error) {
      console.error(`Failed to correct Sale ${sale.orderNumber}. Error:`, error);
    }
  }

  console.log('Correction script finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });