import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sale = await prisma.sale.findFirst({
    where: { orderNumber: 31839 as any },
    include: {
      accountsRec: {
        include: {
          transacoes: true
        }
      },
      installments: {
        include: {
          accountRec: {
            include: {
              transacoes: true
            }
          }
        }
      },
      adjustment: true
    }
  });

  console.log('--- VENDA 31839 ---');
  console.log(JSON.stringify(sale, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
