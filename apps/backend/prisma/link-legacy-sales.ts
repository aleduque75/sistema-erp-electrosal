
import { PrismaClient, SaleStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando script para vincular vendas legadas...');

  // 1. Encontrar o ID da organização (assumindo que há apenas uma ou a primeira)
  const organization = await prisma.organization.findFirst();
  if (!organization) {
    throw new Error('Nenhuma organização encontrada.');
  }
  console.log(`Organização encontrada: ${organization.name}`);

  // 2. Encontrar o produto "Sal 68%" para usar como base para o lote
  //    Vamos procurar por um produto que seja de um grupo de reação e tenha "68" no nome
  const reactionProduct = await prisma.product.findFirst({
    where: {
      organizationId: organization.id,
      name: {
        contains: '68',
      },
      productGroup: {
        isReactionProductGroup: true,
      },
    },
  });

  if (!reactionProduct) {
    throw new Error(
      'Produto de reação (como Sal 68%) não encontrado para associar ao lote legado.',
    );
  }
  console.log(`Produto base para o lote legado: ${reactionProduct.name}`);

  // 3. Criar ou encontrar o "Lote de Vendas Legadas"
  let legacyLot = await prisma.inventoryLot.findUnique({
    where: {
      batchNumber: 'LOTE-LEGADO-VENDAS',
    },
  });

  if (!legacyLot) {
    console.log('Criando o "Lote de Vendas Legadas"...');
    legacyLot = await prisma.inventoryLot.create({
      data: {
        organizationId: organization.id,
        productId: reactionProduct.id,
        batchNumber: 'LOTE-LEGADO-VENDAS',
        costPrice: new Decimal(0),
        quantity: 999999,
        remainingQuantity: 999999,
        sourceType: 'MIGRATION',
        sourceId: 'SCRIPT-LINK-LEGACY-SALES',
        notes: 'Lote virtual para associar a itens de vendas importadas do sistema antigo.',
      },
    });
    console.log(`Lote legado criado com ID: ${legacyLot.id}`);
  } else {
    console.log(`"Lote de Vendas Legadas" já existente encontrado com ID: ${legacyLot.id}`);
  }

  // 4. Encontrar vendas pendentes que foram importadas (têm externalId)
  const pendingLegacySales = await prisma.sale.findMany({
    where: {
      organizationId: organization.id,
      status: SaleStatus.PENDENTE,
      externalId: {
        not: null,
      },
    },
    include: {
      saleItems: true,
    },
  });

  if (pendingLegacySales.length === 0) {
    console.log('Nenhuma venda legada pendente encontrada. Nenhuma ação necessária.');
    return;
  }

  console.log(`Encontradas ${pendingLegacySales.length} vendas legadas pendentes para processar.`);

  let updatedCount = 0;

  // 5. Iniciar uma transação para atualizar todas as vendas
  await prisma.$transaction(async (tx) => {
    for (const sale of pendingLegacySales) {
      console.log(`Processando venda ID: ${sale.id} (External ID: ${sale.externalId})`);

      // Atualizar todos os itens da venda para apontar para o lote legado
      await tx.saleItem.updateMany({
        where: {
          saleId: sale.id,
        },
        data: {
          inventoryLotId: legacyLot.id,
        },
      });

      // Atualizar o status da venda para FINALIZADO
      await tx.sale.update({
        where: {
          id: sale.id,
        },
        data: {
          status: SaleStatus.FINALIZADO,
        },
      });

      updatedCount++;
      console.log(`   -> Venda ${sale.id} atualizada para o status FINALIZADO e itens vinculados ao lote legado.`);
    }
  });

  console.log(`
Processo concluído!`);
  console.log(`${updatedCount} vendas foram atualizadas com sucesso.`);
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro ao executar o script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
