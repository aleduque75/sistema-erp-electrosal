
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clientId = '2d2175b6-60bd-46b9-9914-a72016e535bd';
  
  console.log(`Checking client: ${clientId}`);

  // 1. Transactions for this client (by description or metadata if linked)
  const transactions = await prisma.transacao.findMany({
    where: {
      descricao: {
        contains: clientId
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('Transactions containing Client ID in description:', JSON.stringify(transactions, null, 2));

  // 2. Metal Account Entries
  const metalAccount = await prisma.metalAccount.findFirst({
    where: {
        personId: clientId
    }
  });

  if (metalAccount) {
      const entries = await prisma.metalAccountEntry.findMany({
          where: {
              metalAccountId: metalAccount.id
          },
          orderBy: {
              date: 'desc'
          }
      });
      console.log('Metal Account Entries:', JSON.stringify(entries, null, 2));
  } else {
      console.log('No Metal Account found for this client.');
  }

  // 3. Look for the specific transaction pair we found earlier again to be sure
  const pairIds = ["3338a489-4f57-42b4-b45d-3b620602a883", "557aafaf-a18e-48a4-8bde-8e224f8d2667"];
  const pair = await prisma.transacao.findMany({
      where: {
          id: { in: pairIds }
      }
  });
  console.log('Specific Transaction Pair Details:', JSON.stringify(pair, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
