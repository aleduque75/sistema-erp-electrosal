
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clientId = '2d2175b6-60bd-46b9-9914-a72016e535bd';
  
  console.log(`Searching for transactions for client: ${clientId}`);

  // Find the metal credit for this client
  const metalCredits = await prisma.metalCredit.findMany({
    where: {
      clientId: clientId,
    }
  });

  console.log('Metal Credits found:', metalCredits);

  // Find transactions with description like "Pagamento do crédito de metal"
  // Since the user said they did it recently, let's look for recent ones.
  const transactions = await prisma.transacao.findMany({
    where: {
      descricao: {
        contains: 'Pagamento do crédito de metal'
      },
      // We can also filter by date if needed, but let's see what we find first.
    },
    orderBy: {
      dataHora: 'desc'
    },
    take: 5,
    include: {
      contaCorrente: true,
      contaContabil: true
    }
  });

  console.log('Recent Metal Credit Payment Transactions:', JSON.stringify(transactions, null, 2));

  // Find transactions specifically for the bank account that might be missing goldAmount
  const bankTransactions = await prisma.transacao.findMany({
    where: {
        tipo: 'CREDITO',
        descricao: {
            contains: 'Pagamento do crédito de metal'
        },
        goldAmount: {
            equals: null
        }
    },
    orderBy: {
        dataHora: 'desc'
    },
    take: 5
  });

  console.log('Potential Incorrect Bank Transactions (missing goldAmount):', JSON.stringify(bankTransactions, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
