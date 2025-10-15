
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CalculateSaleAdjustmentUseCase } from '../src/sales/use-cases/calculate-sale-adjustment.use-case';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  console.log('Iniciando o recálculo de todos os ajustes de vendas...');

  // 1. Create a standalone NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'], // Configure logging as needed
  });

  // 2. Get instances of the use case and prisma service from the app context
  const calculateSaleAdjustmentUseCase = app.get(CalculateSaleAdjustmentUseCase);
  const prisma = app.get(PrismaService);

  const organization = await prisma.organization.findFirst();
  if (!organization) {
    throw new Error('Nenhuma organização encontrada.');
  }

  const sales = await prisma.sale.findMany({
    where: {
      organizationId: organization.id,
    },
    select: {
      id: true,
    },
  });

  console.log(`Encontradas ${sales.length} vendas para recalcular.`);

  let successCount = 0;
  let errorCount = 0;

  for (const sale of sales) {
    try {
      console.log(`Recalculando ajuste para a venda ID: ${sale.id}`);
      await calculateSaleAdjustmentUseCase.execute(sale.id, organization.id);
      successCount++;
    } catch (error) {
      console.error(
        `Erro ao recalcular a venda ID: ${sale.id}. Erro: ${error.message}`,
      );
      errorCount++;
    }
  }

  await app.close();

  console.log('\nRecálculo concluído!');
  console.log(`  Vendas processadas com sucesso: ${successCount}`);
  console.log(`  Vendas com erro: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro fatal durante o script de recálculo:', e);
    process.exit(1);
  })
  .finally(async () => {
    // The app context is already closed, no need to disconnect prisma again
  });
