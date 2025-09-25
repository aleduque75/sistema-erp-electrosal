import { PrismaClient, TipoMetal } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting quotation backfill from pedidoItens.json...');

  const jsonDirectory = path.join(__dirname, '..', '..', '..', 'json-imports');
  const itemsFilePath = path.join(jsonDirectory, 'pedidoItens.json');

  const itemsData = JSON.parse(await fs.readFile(itemsFilePath, 'utf8'));

  const organization = await prisma.organization.findFirst();
  if (!organization) {
    throw new Error('No organization found. Please seed the database first.');
  }

  let createdCount = 0;
  for (const item of itemsData) {
    const cotacao = parseFloat(item.cotacao.replace(',', '.'));
    if (isNaN(cotacao) || cotacao <= 0) {
      continue;
    }

    const itemDate = new Date(item['Creation Date']);
    const dateOnly = new Date(itemDate.toISOString().split('T')[0]);

    try {
      await prisma.quotation.create({
        data: {
          organizationId: organization.id,
          metal: TipoMetal.AU,
          date: dateOnly,
          buyPrice: cotacao,
          sellPrice: cotacao, // Assuming buy and sell price are the same
        },
      });
      createdCount++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Unique constraint violation, quotation for this date already exists.
      } else {
        console.error(`Failed to create quotation for item ${item['unique id']}:`, e);
      }
    }
  }

  console.log(`Successfully created ${createdCount} new quotations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
