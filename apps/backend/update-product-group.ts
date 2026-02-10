import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.productGroup.updateMany({
    where: {
      name: 'Aurocianeto 68%',
    },
    data: {
      isReactionProductGroup: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
