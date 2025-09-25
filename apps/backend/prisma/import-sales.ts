import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting sales import...');

  const jsonDirectory = path.join(__dirname, '..', '..', '..', 'json-imports');
  const salesFilePath = path.join(jsonDirectory, 'pedidos_com_externalId_cliente.json');

  const salesData = JSON.parse(await fs.readFile(salesFilePath, 'utf8'));

  const organization = await prisma.organization.findFirst();
  if (!organization) {
    throw new Error('No organization found. Please seed the database first.');
  }

  let createdCount = 0;
  for (const sale of salesData) {
    if (!sale.clienteExternalId) {
      console.warn(`Skipping sale ${sale["unique id"]} because it has no clienteExternalId.`);
      continue;
    }

    const pessoa = await prisma.pessoa.findFirst({
      where: { externalId: sale.clienteExternalId },
    });

    if (!pessoa) {
      console.warn(`Skipping sale ${sale["unique id"]} because person with externalId ${sale.clienteExternalId} was not found.`);
      continue;
    }

    const totalAmount = parseFloat(sale.valorTotal.replace(',', '.'));
    const goldAmount = parseFloat(sale.quantidadeAu.replace(',', '.'));
    const goldPrice = totalAmount / goldAmount;

    try {
      await prisma.sale.create({
        data: {
          externalId: sale['unique id'],
          orderNumber: sale.numero,
          totalAmount: totalAmount,
          goldValue: goldAmount,
          goldPrice: goldPrice,
          createdAt: new Date(sale.data),
          organizationId: organization.id,
          pessoaId: pessoa.id,
        },
      });
      createdCount++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Unique constraint violation, sale with this externalId already exists.
      } else {
        console.error(`Failed to create sale for externalId ${sale['unique id']}:`, e);
      }
    }
  }

  console.log(`Successfully created ${createdCount} new sales.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
