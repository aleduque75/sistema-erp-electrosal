import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.stockMovement.updateMany({
      where: {
        inventoryLotId: '0935223d-e8d4-4666-86db-35cf8912f68e',
      },
      data: {
        type: 'ENTRADA_REACAO',
        sourceDocument: 'CRIACAO_LOTE #1191',
      },
    });
    console.log("StockMovement updated successfully.");
  } catch (error) {
    console.error("Error updating StockMovement:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();