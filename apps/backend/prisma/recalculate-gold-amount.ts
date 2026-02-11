import { PrismaClient, TipoMetal } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting gold amount recalculation...');

  const transactionsToUpdate = await prisma.transacao.findMany({
    where: {
      OR: [
        { goldAmount: null },
        { goldAmount: 0 },
      ],
      valor: {
        gt: 0,
      },
    },
  });

  console.log(`Found ${transactionsToUpdate.length} transactions to update.`);

  let updatedCount = 0;
  for (const transaction of transactionsToUpdate) {
    const quotation = await prisma.quotation.findFirst({
      where: {
        date: {
          lte: transaction.dataHora,
        },
        metal: TipoMetal.AU,
        organizationId: transaction.organizationId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (quotation) {
      const newGoldAmount = transaction.valor.toNumber() / quotation.buyPrice.toNumber();

      await prisma.transacao.update({
        where: { id: transaction.id },
        data: { goldAmount: newGoldAmount },
      });
      updatedCount++;
    } else {
      console.warn(`Quotation not found for transaction ${transaction.id} on date ${transaction.dataHora}. Skipping.`);
    }
  }

  console.log(`Successfully updated ${updatedCount} transactions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
