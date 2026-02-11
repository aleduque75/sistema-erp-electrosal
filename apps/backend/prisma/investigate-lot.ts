
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lotId = '5eef4100-28eb-4b3c-bf67-d93f2b1143c5';
  
  console.log(`\n🔎 Investigando Lote de Metal Puro: ${lotId}\n`);

  const lot = await prisma.pure_metal_lots.findUnique({
    where: { id: lotId },
    include: {
      movements: true
    }
  });

  if (lot) {
    console.log("✅ Lote encontrado:");
    console.log(`   ID: ${lot.id}`);
    console.log(`   Metal: ${lot.metalType}`);
    console.log(`   Peso Inicial: ${lot.initialGrams}`);
    console.log(`   Peso Restante: ${lot.remainingGrams}`);
    console.log(`   Status: ${lot.status}`);
    
    console.log("\n   📜 Movimentações do Lote:");
    lot.movements.forEach(m => {
        console.log(`      [${m.date.toISOString().split('T')[0]}] ${m.type}: ${m.grams}g - Obs: ${m.notes || ''}`);
    });
  } else {
    console.log("❌ Lote não encontrado.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

