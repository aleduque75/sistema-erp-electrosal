import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando sincronização de estoque dos produtos com base nos lotes...');

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stock: true,
    }
  });

  let updatedCount = 0;

  for (const product of products) {
    const lots = await prisma.inventoryLot.aggregate({
      where: {
        productId: product.id,
      },
      _sum: {
        remainingQuantity: true,
      }
    });

    const calculatedStock = lots._sum.remainingQuantity || 0;

    if (Number(product.stock) !== Number(calculatedStock)) {
      console.log(`📍 Ajustando ${product.name}: ${product.stock} -> ${calculatedStock}`);
      
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: calculatedStock }
      });
      
      updatedCount++;
    }
  }

  console.log(`
✅ Sincronização concluída! ${updatedCount} produtos foram ajustados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
