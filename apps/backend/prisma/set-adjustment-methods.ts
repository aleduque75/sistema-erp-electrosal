import { PrismaClient, SaleAdjustmentCalcMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando a configuração dos métodos de cálculo de ajuste...');

  // Configurar Grupo de Produtos de Ouro (Sal 68%)
  const goldProductGroup = await prisma.productGroup.findFirst({
    where: { name: { contains: 'Aurocianeto 68%' } },
  });

  if (goldProductGroup) {
    await prisma.productGroup.update({
      where: { id: goldProductGroup.id },
      data: { adjustmentCalcMethod: SaleAdjustmentCalcMethod.QUANTITY_BASED },
    });
    console.log(` -> Grupo "${goldProductGroup.name}" configurado para QUANTITY_BASED.`);
  } else {
    console.warn('Grupo de produto para Ouro (Aurocianeto 68%) não encontrado.');
  }

  // Configurar Grupo de Produtos de Prata (Cianeto de Prata)
  // Assumindo que o nome do grupo contém "Prata"
  const silverProductGroup = await prisma.productGroup.findFirst({
    where: { name: { contains: 'Cianeto de Prata' } }, // Ajuste este nome se for diferente
  });

  if (silverProductGroup) {
    await prisma.productGroup.update({
      where: { id: silverProductGroup.id },
      data: { adjustmentCalcMethod: SaleAdjustmentCalcMethod.COST_BASED },
    });
    console.log(` -> Grupo "${silverProductGroup.name}" configurado para COST_BASED.`);
  } else {
    console.warn('Grupo de produto para Prata (Cianeto de Prata) não encontrado. Verifique o nome.');
  }
  
  // Você pode adicionar outras configurações aqui

  console.log('\nConfiguração concluída!');
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro ao executar o script de configuração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
