
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productId = '9ddfe133-30f7-4392-aa3c-fbdfe92d68e6';
  const targetStock = 3534; // 1500g + 2034g
  const adjustmentBatchNumber = 'AJUSTE_MIGRACAO_KG_G';

  console.log(`\n🛠️ Forçando ajuste de estoque para o produto: ${productId}`);

  // 1. Zerar lotes existentes
  console.log("   Zerando lotes existentes...");
  const updateLots = await prisma.inventoryLot.updateMany({
    where: { productId: productId, remainingQuantity: { gt: 0 } },
    data: { remainingQuantity: 0 }
  });
  console.log(`   ${updateLots.count} lotes zerados.`);

  // 2. Criar lote de ajuste
  console.log(`   Criando lote de ajuste com ${targetStock}g...`);
  // Buscar a organização do produto para usar no lote
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) { console.error("Produto não encontrado"); return; }

  const newLot = await prisma.inventoryLot.create({
    data: {
      organizationId: product.organizationId,
      productId: productId,
      batchNumber: adjustmentBatchNumber,
      quantity: targetStock,
      remainingQuantity: targetStock,
      costPrice: 5.00, // Custo estimado por grama (R$ 5000/kg / 1000)
      sourceType: 'ADJUSTMENT',
      sourceId: 'MIGRATION_FIX',
      receivedDate: new Date(),
      notes: 'Ajuste de migração de unidade (KG -> Gramas)'
    }
  });

  // 3. Criar movimento de estoque
  await prisma.stockMovement.create({
    data: {
      organizationId: product.organizationId,
      productId: productId,
      inventoryLotId: newLot.id,
      quantity: targetStock,
      type: 'ADJUSTMENT',
      sourceDocument: 'MIGRATION_FIX'
    }
  });

  // 4. Atualizar estoque do produto
  await prisma.product.update({
    where: { id: productId },
    data: { stock: targetStock }
  });
  console.log(`✅ Estoque do produto atualizado para: ${targetStock}`);


  // 5. Corrigir Cotações (Dividir por 1000 se > 1000)
  console.log("\n🔄 Verificando e corrigindo cotações (KG -> G)...");
  
  // Buscar cotações de Prata (AG) que parecem estar em KG (preço alto)
  // Assumindo que preço por grama é < 100 e por KG é > 1000
  const highQuotations = await prisma.quotation.findMany({
    where: {
      metal: 'AG',
      buyPrice: { gt: 100 } 
    }
  });

  console.log(`   Encontradas ${highQuotations.length} cotações suspeitas.`);

  for (const quote of highQuotations) {
    const newBuyPrice = Number(quote.buyPrice) / 1000;
    const newSellPrice = Number(quote.sellPrice) / 1000;

    console.log(`   ➡️ Corrigindo Cotação ID ${quote.id} (${quote.date.toISOString().split('T')[0]}): ${quote.buyPrice} -> ${newBuyPrice}`);

    await prisma.quotation.update({
        where: { id: quote.id },
        data: {
            buyPrice: newBuyPrice,
            sellPrice: newSellPrice
        }
    });
  }
  console.log("✅ Cotações corrigidas.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
