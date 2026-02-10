
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.recoveryOrder.findMany({
    orderBy: { dataCriacao: 'desc' },
    take: 5
  });

  console.log('Last 5 Recovery Orders:');
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Order#: ${o.orderNumber}, Status: ${o.status}, CreatedAt: ${o.dataCriacao}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
