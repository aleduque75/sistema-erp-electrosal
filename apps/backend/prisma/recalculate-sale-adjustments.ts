import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CalculateSaleAdjustmentUseCase } from '../src/sales/use-cases/calculate-sale-adjustment.use-case';
import { PrismaService } from '../src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

async function main() {
  const saleIdArg = process.argv[2]; // Get sale ID from command line

  const logMessage = saleIdArg
    ? `Iniciando o recálculo do ajuste para a venda ID: ${saleIdArg}`
    : 'Iniciando o recálculo de todos os ajustes de vendas...';
  console.log(logMessage);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const calculateSaleAdjustmentUseCase = app.get(CalculateSaleAdjustmentUseCase);
  const prisma = app.get(PrismaService);

  const organization = await prisma.organization.findFirst();
  if (!organization) {
    throw new Error('Nenhuma organização encontrada.');
  }

  let sales: { id: string }[];

  if (saleIdArg) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleIdArg, organizationId: organization.id },
      select: { id: true },
    });
    sales = sale ? [sale] : [];
  } else {
    sales = await prisma.sale.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
      },
    });
  }

  if (sales.length === 0) {
    console.log('Nenhuma venda encontrada para recalcular.');
    await app.close();
    return;
  }

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
