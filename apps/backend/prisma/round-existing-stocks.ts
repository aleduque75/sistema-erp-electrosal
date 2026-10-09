import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Arredondando estoques e saldos de lotes para 2 casas decimais...');

  const products = await prisma.product.findMany();
  for (const p of products) {
    if (p.stock !== null && p.stock !== undefined) {
      const rounded = Math.round(p.stock * 100) / 100;
      if (rounded !== p.stock) {
        console.log(`📦 Produto ${p.name}: ${p.stock} -> ${rounded}`);
        await prisma.product.update({
          where: { id: p.id },
          data: { stock: rounded },
        });
      }
    }
  }

  const lots = await prisma.inventoryLot.findMany();
  for (const l of lots) {
    const roundedRem = Math.round(l.remainingQuantity * 100) / 100;
    const roundedQty = Math.round(l.quantity * 100) / 100;

    if (roundedRem !== l.remainingQuantity || roundedQty !== l.quantity) {
      console.log(`🏷️ Lote ${l.batchNumber || l.id}: rem ${l.remainingQuantity} -> ${roundedRem}`);
      await prisma.inventoryLot.update({
        where: { id: l.id },
        data: {
          remainingQuantity: roundedRem,
          quantity: roundedQty,
        },
      });
    }
  }

  console.log('✅ Concluído! Todos os estoques foram padronizados para 2 casas decimais.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
