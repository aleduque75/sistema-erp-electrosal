import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  const clientId = '2d2175b6-60bd-46b9-9914-a72016e535bd';
  const amount = 4.2;
  
  // Find transactions for this client that were created today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const transactions = await prisma.transacao.findMany({
    where: {
      organizationId: '2a5bb448-056b-4b87-b02f-fec691dd658d',
      createdAt: {
        gte: today
      },
      descricao: {
        contains: 'Pagamento do crédito de metal'
      }
    }
  });

  console.log(`Transactions found created today for client ${clientId}:`, JSON.stringify(transactions, null, 2));

  for (const t of transactions) {
    const goldAmount = t.goldAmount ? new Decimal(t.goldAmount.toString()) : new Decimal(0);
    const goldPrice = t.goldPrice ? new Decimal(t.goldPrice.toString()) : new Decimal(0);

    if (goldAmount.isZero() || goldPrice.isZero()) {
        console.log(`Fixing transaction ${t.id}...`);
        const goldVal = t.tipo === 'DEBITO' ? -amount : amount;
        // Assume price is 660 based on previous findings (2772 / 4.2)
        const price = 660; 
        
        await prisma.transacao.update({
            where: { id: t.id },
            data: {
                goldAmount: goldVal,
                goldPrice: price
            }
        });
        console.log(`Transaction ${t.id} fixed.`);
    } else {
        console.log(`Transaction ${t.id} already has goldAmount (${goldAmount}) and goldPrice (${goldPrice}). No fix needed.`);
    }
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