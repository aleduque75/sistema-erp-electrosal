import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function investigateSale(saleId: string) {
  console.log(`Investigando a venda com ID: ${saleId}`);

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      pessoa: true,
      saleItems: {
        include: {
          product: {
            include: {
              productGroup: true,
            },
          },
          saleItemLots: {
            include: {
              inventoryLot: true,
            },
          },
        },
      },
      adjustment: true,
    },
  });

  if (!sale) {
    console.log(`Venda com ID ${saleId} não encontrada.`);
    return;
  }

  console.log('\n--- Informações Gerais da Venda ---');
  console.log(`ID da Venda: ${sale.id}`);
  console.log(`Número do Pedido: ${sale.orderNumber}`);
  console.log(`Cliente: ${sale.pessoa.name}`);
  console.log(`Data: ${sale.createdAt.toISOString()}`);
  console.log(`Método de Pagamento: ${sale.paymentMethod}`);
  console.log(`Status: ${sale.status}`);
  console.log('--- Valores Totais ---');
  console.log(`Total (R$): ${sale.totalAmount.toFixed(2)}`);
  console.log(`Custo Total (R$): ${sale.totalCost?.toFixed(2) ?? 'N/A'}`);
  console.log(`Frete (R$): ${sale.shippingCost?.toFixed(2) ?? 'N/A'}`);
  console.log(`Taxa (R$): ${sale.feeAmount?.toFixed(2) ?? 'N/A'}`);
  console.log(`Valor Líquido (R$): ${sale.netAmount?.toFixed(2) ?? 'N/A'}`);
  console.log(`Cotação Ouro (R$/g): ${sale.goldPrice?.toFixed(2) ?? 'N/A'}`);
  console.log(`Valor em Ouro (g): ${sale.goldValue?.toFixed(4) ?? 'N/A'}g`);

  if (sale.netAmount && sale.totalCost) {
    const calculatedProfit = sale.netAmount.minus(sale.totalCost);
    console.log(`Lucro Bruto da Venda (Líquido - Custo): ${calculatedProfit.toFixed(2)}`);
  } else {
    console.log('Não foi possível calcular o lucro bruto da venda (valores ausentes).');
  }


  console.log('\n--- Itens da Venda ---');
  let totalItemProfit = new Decimal(0);
  for (const item of sale.saleItems) {
    console.log(`\n  - Item: ${item.product.name} (ID: ${item.productId})`);
    console.log(`    Grupo: ${item.product.productGroup?.name ?? 'N/A'} (Método de Cálculo: ${item.product.productGroup?.adjustmentCalcMethod ?? 'N/A'})`);
    console.log(`    Percentual de Mão de Obra: ${item.laborPercentage?.toFixed(2) ?? 'N/A'}%`);
    console.log(`    Quantidade: ${item.quantity}`);
    console.log(`    Preço Unitário (R$): ${item.price.toFixed(2)}`);
    console.log(`    Custo no Momento da Venda (R$): ${item.costPriceAtSale.toFixed(2)}`);
    const itemTotal = new Decimal(item.quantity).times(item.price);
    const itemTotalCost = new Decimal(item.quantity).times(item.costPriceAtSale);
    const itemProfit = itemTotal.minus(itemTotalCost);
    totalItemProfit = totalItemProfit.plus(itemProfit);
    console.log(`    Total do Item (R$): ${itemTotal.toFixed(2)}`);
    console.log(`    Custo Total do Item (R$): ${itemTotalCost.toFixed(2)}`);
    console.log(`    Lucro do Item (R$): ${itemProfit.toFixed(2)}`);
    console.log('    Lotes:');
    for (const lot of item.saleItemLots) {
      console.log(`      - Lote de Inventário ID: ${lot.inventoryLotId}`);
      console.log(`        Batch Number: ${lot.inventoryLot.batchNumber}`);
      console.log(`        Quantidade usada: ${lot.quantity}`);
      console.log(`        Custo do Lote (R$/un): ${lot.inventoryLot.costPrice.toFixed(2)}`);
    }
  }
  console.log(`\n  Soma do Lucro de todos os itens: ${totalItemProfit.toFixed(2)}`);


  console.log('\n--- Ajuste da Venda (Sale Adjustment) ---');
  if (sale.adjustment) {
    const adj = sale.adjustment;
    console.log(`\n  - Ajuste ID: ${adj.id}`);
    console.log(`    Data: ${adj.createdAt.toISOString()}`);
    console.log(`    Cotação Ouro (R$/g): ${adj.paymentQuotation?.toFixed(2) ?? 'N/A'}`);
    console.log(`    Discrepância Líquida (g): ${adj.netDiscrepancyGrams?.toFixed(4) ?? 'N/A'}g`);
    console.log(`    Valor da Discrepância (R$): ${adj.netDiscrepancyGrams && adj.paymentQuotation ? new Decimal(adj.netDiscrepancyGrams).times(adj.paymentQuotation).toFixed(2) : 'N/A'}`);
    console.log(`    Custo Total BRL (sale.totalCost): ${adj.totalCostBRL?.toFixed(2) ?? 'N/A'}`);
    console.log(`    Lucro Bruto BRL (sale.netAmount - sale.totalCost): ${adj.grossProfitBRL?.toFixed(2) ?? 'N/A'}`);
    console.log(`    Outros Custos (R$): ${adj.otherCostsBRL?.toFixed(2) ?? 'N/A'}`);
    console.log(`    Comissão (R$): ${adj.commissionBRL?.toFixed(2) ?? 'N/A'}`);
    console.log(`    LUCRO LÍQUIDO FINAL (R$): ${adj.netProfitBRL?.toFixed(2) ?? 'N/A'}`);
  } else {
    console.log('  Nenhum ajuste encontrado para esta venda.');
  }
}

async function main() {
  const saleId = process.argv[2];
  if (!saleId) {
    console.error('Por favor, forneça o ID da venda como argumento.');
    process.exit(1);
  }

  try {
    await investigateSale(saleId);
  } catch (error) {
    console.error('Ocorreu um erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
