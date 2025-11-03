import { PrismaClient, EntityType } from '@prisma/client';
import { EntityCounterService } from '../src/common/services/entity-counter.service';

const prisma = new PrismaClient();

async function main() {
  const entityCounterService = new EntityCounterService(prisma as any);

  const lotsWithoutNumber = await prisma.pure_metal_lots.findMany({
    where: {
      lotNumber: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  for (const lot of lotsWithoutNumber) {
    const nextLotNumber = await entityCounterService.getNextNumber(EntityType.PURE_METAL_LOT, lot.organizationId);
    const lotNumber = `LMP-${String(nextLotNumber).padStart(6, '0')}`;

    await prisma.pure_metal_lots.update({
      where: {
        id: lot.id,
      },
      data: {
        lotNumber,
      },
    });

    console.log(`Lote ${lot.id} atualizado com o número ${lotNumber}`);
  }

  console.log('Backfill de números de lote concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
