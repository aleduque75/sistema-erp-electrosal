import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando migração de custos AU históricos...');
  
  const lots = await prisma.inventoryLot.findMany({
    where: { 
      unitCostAu: null,
      costPrice: { gt: 0 }
    },
  });

  console.log(`Encontrados ${lots.length} lotes para processar.`);

  for (const lot of lots) {
    const goldQuote = await prisma.quotation.findFirst({
      where: {
        metal: 'AU',
        organizationId: lot.organizationId,
        date: { lte: lot.receivedDate },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    if (goldQuote && goldQuote.buyPrice) {
      const unitCostAu = new Decimal(lot.costPrice.toString()).dividedBy(goldQuote.buyPrice.toString());
      await prisma.inventoryLot.update({
        where: { id: lot.id },
        data: {
          unitCostAu: unitCostAu.toNumber(),
          goldQuotationAtAcquisition: goldQuote.buyPrice,
        },
      });
      console.log(`Lote ${lot.batchNumber || lot.id} atualizado. Custo: R$ ${lot.costPrice} | Cotação: R$ ${goldQuote.buyPrice} | AU: ${unitCostAu.toFixed(6)}`);
    } else {
      console.warn(`⚠️ Cotação não encontrada para o lote ${lot.batchNumber || lot.id} em ${lot.receivedDate}`);
    }
  }
  
  console.log('Migração concluída!');
}

main()
  .catch((e) => {
    console.error('Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
