
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productName = 'Ag CN 54%'; // Nome aproximado, vou buscar pelo nome ou ID se tiver
  // ID mencionado anteriormente: 9ddfe133-30f7-4392-aa3c-fbdfe92d68e6
  const productId = '9ddfe133-30f7-4392-aa3c-fbdfe92d68e6';

  console.log(`
🛠️ Iniciando correção de estoque para o produto: ${productId}`);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    console.log("❌ Produto não encontrado.");
    return;
  }

  console.log(`📦 Produto: ${product.name} | Estoque Atual: ${product.stock}`);

  // Buscar itens de pedido de compra para este produto que parecem estar em KG (valor baixo, ex: < 10)
  // Assumindo que compras em gramas seriam valores mais altos (ex: 1500)
  const purchaseItems = await prisma.purchaseOrderItem.findMany({
    where: {
      productId: productId,
      quantity: { lt: 50 }, // Heurística: se for menor que 50, provavelmente é KG. Ajuste conforme necessário.
    },
    include: {
        purchaseOrder: true
    }
  });

  console.log(`🔎 Encontrados ${purchaseItems.length} itens de pedido suspeitos (em KG mas lançados como G).`);

  for (const item of purchaseItems) {
    console.log(`   ➡️ Processando Item ID: ${item.id} | Qtd Original: ${item.quantity} | Pedido: ${item.purchaseOrder.orderNumber}`);

    // 1. Atualizar unidade no item do pedido
    await prisma.purchaseOrderItem.update({
        where: { id: item.id },
        data: { unit: 'KILOGRAMS' }
    });

    const quantityInGrams = item.quantity * 1000;

    // 2. Encontrar e atualizar o InventoryLot (Lote de Estoque) criado por este pedido
    // O InventoryLot tem sourceType 'PURCHASE_ORDER' e sourceId igual ao ID do Pedido
    // Mas um pedido pode ter vários itens. O InventoryLot tem productId.
    // Melhor buscar pelo sourceId = purchaseOrder.id E productId
    
    // NOTA: Se o sistema criou um lote por item, deve haver um lote correspondente.
    const lot = await prisma.inventoryLot.findFirst({
        where: {
            sourceType: 'PURCHASE_ORDER',
            sourceId: item.purchaseOrder.id,
            productId: productId,
            quantity: item.quantity // Tenta bater a quantidade original para ter certeza
        }
    });

    if (lot) {
        console.log(`      ✅ Lote encontrado: ${lot.batchNumber}. Atualizando para ${quantityInGrams}g...`);
        await prisma.inventoryLot.update({
            where: { id: lot.id },
            data: {
                quantity: quantityInGrams,
                remainingQuantity: quantityInGrams // Assume que não foi usado ainda, ou precisaria de lógica mais complexa se já foi usado
            }
        });

        // 3. Atualizar StockMovement vinculado a este lote
        const movement = await prisma.stockMovement.findFirst({
            where: {
                inventoryLotId: lot.id,
                type: 'COMPRA',
                quantity: item.quantity
            }
        });

        if (movement) {
            console.log(`      ✅ Movimento encontrado. Atualizando para ${quantityInGrams}g...`);
            await prisma.stockMovement.update({
                where: { id: movement.id },
                data: { quantity: quantityInGrams }
            });
        }
    } else {
        console.log(`      ⚠️ Lote não encontrado com a quantidade exata de ${item.quantity}. Tentando buscar apenas por sourceId e productId...`);
         const lotFallback = await prisma.inventoryLot.findFirst({
            where: {
                sourceType: 'PURCHASE_ORDER',
                sourceId: item.purchaseOrder.id,
                productId: productId
            }
        });
        
        if (lotFallback) {
             console.log(`      ✅ Lote encontrado (fallback): ${lotFallback.batchNumber}. Qtd Atual: ${lotFallback.quantity}. Somando diferença...`);
             // Se já foi parcialmente usado, adicionamos a diferença (1500 - 1.5 = 1498.5)
             const diff = quantityInGrams - item.quantity;
             await prisma.inventoryLot.update({
                where: { id: lotFallback.id },
                data: {
                    quantity: { increment: diff },
                    remainingQuantity: { increment: diff }
                }
            });
            
            // Atualizar movimento
             const movement = await prisma.stockMovement.findFirst({
                where: { inventoryLotId: lotFallback.id, type: 'COMPRA' }
            });
            if (movement) {
                 await prisma.stockMovement.update({
                    where: { id: movement.id },
                    data: { quantity: { increment: diff } }
                });
            }
        } else {
            console.log("      ❌ Lote realmente não encontrado. Correção manual necessária para este item.");
        }
    }
  }

  // 4. Recalcular saldo total do produto
  // A forma mais segura é somar todos os InventoryLots ativos ou StockMovements
  console.log("\n🔄 Recalculando estoque total do produto...");
  
  // Vamos recalcular baseado nos Lotes Ativos (remainingQuantity)
  // OU baseados em StockMovements (Entradas - Saidas). 
  // O sistema atual parece confiar no campo 'stock' do produto, vamos atualizá-lo somando tudo.
  
  // Opção A: Somar StockMovements
  const allMovements = await prisma.stockMovement.findMany({
      where: { productId: productId }
  });
  
  let calculatedStock = 0;
  // Assumindo que entradas são positivas e saídas negativas (se o sistema usa quantity negativo) 
  // Mas o sistema parece usar 'type' para definir. 
  // No código de 'PurchaseOrdersService', stockMovement quantity é positivo.
  // No código de 'CompleteProductionStep', stockMovement quantity é positivo.
  // Preciso checar como saídas são gravadas. Geralmente deve ser negativo ou depender do tipo.
  // Vou usar uma lógica simplificada: se 'remainingQuantity' dos lotes for confiável:
  
  const lots = await prisma.inventoryLot.findMany({
      where: { productId: productId }
  });
  
  const stockFromLots = lots.reduce((acc, l) => acc + l.remainingQuantity, 0);
  
  console.log(`   Estoque calculado via Lotes (Remaining): ${stockFromLots}`);
  
  // Atualizar produto
  await prisma.product.update({
      where: { id: productId },
      data: { stock: stockFromLots }
  });

  console.log(`✅ Estoque do produto atualizado para: ${stockFromLots}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
