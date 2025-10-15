import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando todos os Grupos de Produto e suas Organizações...');

  const productGroups = await prisma.productGroup.findMany({
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });

  if (productGroups.length === 0) {
    console.log('Nenhum grupo de produto encontrado no banco de dados.');
    return;
  }

  console.log(`Encontrados ${productGroups.length} grupos de produto:`);
  console.table(productGroups);

  const orgIds = [...new Set(productGroups.map(p => p.organizationId))];

  const users = await prisma.user.findMany({
    where: {
        organizationId: { in: orgIds }
    },
    select: {
        id: true,
        email: true,
        organizationId: true
    }
  })

  console.log(`
Usuários nessas organizações:`);
  console.table(users);

}

main()
  .catch((e) => {
    console.error('Ocorreu um erro ao executar o script de diagnóstico:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
