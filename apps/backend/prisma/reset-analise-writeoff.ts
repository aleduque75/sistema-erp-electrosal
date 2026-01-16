import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetWriteOff(analiseId: string) {
  console.log(`Resetando o status 'isWriteOff' para a análise ID: ${analiseId}`);

  const analise = await prisma.analiseQuimica.findUnique({
    where: { id: analiseId },
  });

  if (!analise) {
    console.error(`Análise com ID ${analiseId} não encontrada.`);
    return;
  }

  await prisma.analiseQuimica.update({
    where: { id: analiseId },
    data: { isWriteOff: false },
  });

  console.log(`Análise ${analiseId} resetada com sucesso. 'isWriteOff' foi definido como 'false'.`);
}

async function main() {
  const analiseId = process.argv[2];
  if (!analiseId) {
    console.error('Por favor, forneça o ID da análise como argumento.');
    process.exit(1);
  }

  try {
    await resetWriteOff(analiseId);
  } catch (error) {
    console.error('Ocorreu um erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
