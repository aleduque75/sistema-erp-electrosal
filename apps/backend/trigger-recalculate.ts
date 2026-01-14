
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CalculateSaleAdjustmentUseCase } from './src/sales/use-cases/calculate-sale-adjustment.use-case';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const calculator = app.get(CalculateSaleAdjustmentUseCase);
  const prisma = app.get(PrismaService);

  const saleId = '0545f89d-3094-4ce5-bb95-e81ef6c5ea29';
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });

  if (!sale) {
    console.error('Sale not found');
    process.exit(1);
  }

  console.log('Recalculating adjustment for sale:', saleId);
  await calculator.execute(saleId, sale.organizationId);
  console.log('Recalculation complete.');
  
  // Inspect the result
  const updatedSale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { adjustment: true }
  });
  
  console.log('Updated Adjustment:', JSON.stringify(updatedSale?.adjustment, null, 2));

  await app.close();
}

main().catch(console.error);
