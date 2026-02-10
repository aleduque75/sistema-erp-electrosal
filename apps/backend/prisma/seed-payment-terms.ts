import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const organizationId = '2a5bb448-056b-4b87-b02f-fec691dd658d'; // Hardcoded from previous logs
  console.log(`Cadastrando condições de pagamento para a organização: ${organizationId}`);

  const terms = [
    { name: 'À Vista', installmentsDays: [0] },
    { name: '7 dias', installmentsDays: [7] },
    { name: '14 dias', installmentsDays: [14] },
    { name: '30 dias', installmentsDays: [30] },
    { name: '30/60 dias', installmentsDays: [30, 60] },
    { name: '30/60/90 dias', installmentsDays: [30, 60, 90] },
  ];

  const dataToCreate = terms.map(term => ({
    ...term,
    organizationId,
  }));

  // Usando um loop com upsert para evitar duplicatas pelo nome
  for (const termData of dataToCreate) {
    await prisma.paymentTerm.upsert({
      where: { organizationId_name: { organizationId, name: termData.name } },
      update: { installmentsDays: termData.installmentsDays },
      create: termData,
    });
  }

  console.log('Condições de pagamento cadastradas com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
