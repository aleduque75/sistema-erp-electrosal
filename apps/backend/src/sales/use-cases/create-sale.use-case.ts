import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { addMonths, addDays } from 'date-fns';
import { TipoTransacaoPrisma, Prisma, TipoMetal } from '@prisma/client';
import { SettingsService } from '../../settings/settings.service';
import { SaleItemMapper } from '../mappers/sale-item.mapper';
import { ProductMapper } from '../../products/mappers/product.mapper';
import { QuotationsService } from '../../quotations/quotations.service';
import { nanoid } from 'nanoid';
import Decimal from 'decimal.js';

@Injectable()
export class CreateSaleUseCase {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private quotationsService: QuotationsService,
  ) {
    console.log('[DEBUG CREATE_SALE] CreateSaleUseCase inicializado. PrismaService:', !!this.prisma);
  }

  async execute(organizationId: string, userId: string, createSaleDto: CreateSaleDto) {
    console.log('[DEBUG CREATE_SALE] Início do método execute em CreateSaleUseCase.');
    console.log('[DEBUG CREATE_SALE] Executando CreateSaleUseCase para venda:', createSaleDto.externalId || 'nova');
    console.log('[DEBUG CREATE_SALE] organizationId:', organizationId);
    console.log('[DEBUG CREATE_SALE] userId:', userId);
    console.log('[DEBUG CREATE_SALE] Antes da primeira operação do Prisma. this.prisma:', !!this.prisma);

    const {
      pessoaId,
      items,
      paymentMethod,
      numberOfInstallments,
      feeAmount,
      contaCorrenteId,
      goldQuoteValue,
      clientMetalAccountId, // Adicionado para pagamento em metal
    } = createSaleDto;
    console.log('[DEBUG CREATE_SALE] createSaleDto:', createSaleDto);
    console.log('[DEBUG CREATE_SALE] items:', items);

    const [client, settings] = await Promise.all([
      this.prisma.client.findFirst({ where: { pessoaId, organizationId } }),
      this.settingsService.findOne(userId),
      // Removido this.cotacoesService.findLatest(TipoMetal.AU, organizationId),
    ]);
    console.log('[DEBUG CREATE_SALE] Resultado client:', client);
    console.log('[DEBUG CREATE_SALE] Resultado settings:', settings);

    if (!client) throw new NotFoundException('Cliente não encontrado.');
    if (!settings?.defaultReceitaContaId)
      throw new BadRequestException('Nenhuma conta de receita padrão foi configurada.');

    let goldQuote: { valorVenda: Decimal; valorCompra: Decimal }; // Definir tipo para goldQuote

    if (goldQuoteValue) {
      // Se a cotação foi fornecida no DTO (importação), use-a
      goldQuote = {
        valorVenda: new Decimal(goldQuoteValue),
        valorCompra: new Decimal(goldQuoteValue), // Assumir valor de compra igual ao de venda para importação
      };
    } else {
      // Caso contrário, busque a cotação mais recente (para vendas normais)
      const latestGoldQuote = await this.quotationsService.findLatest(TipoMetal.AU, organizationId);
      console.log('[DEBUG CREATE_SALE] Resultado latestGoldQuote:', latestGoldQuote);
      if (!latestGoldQuote)
        throw new BadRequestException('Nenhuma cotação de ouro encontrada para hoje.');
      goldQuote = {
        valorVenda: latestGoldQuote.sellPrice,
        valorCompra: latestGoldQuote.buyPrice,
      };
    }
    console.log('[DEBUG CREATE_SALE] goldQuote final:', goldQuote);

    const productIds = items.map((item) => item.productId);
    console.log('[DEBUG CREATE_SALE] productIds:', productIds);
    const rawProductsInDb = await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId },
      include: { productGroup: true }, // Incluir o grupo do produto
    });
    console.log('[DEBUG CREATE_SALE] Raw productsInDb:', rawProductsInDb);
    console.log('[DEBUG CREATE_SALE] ProductMapper:', ProductMapper);
    const productsInDb = rawProductsInDb.map(ProductMapper.toDomain);
    console.log('[DEBUG CREATE_SALE] Resultado productsInDb (mapped):', productsInDb);

    const inventoryLots = await this.prisma.inventoryLot.findMany({
      where: {
        productId: { in: productIds },
        organizationId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { receivedDate: 'asc' },
    });
    console.log('[DEBUG CREATE_SALE] Resultado inventoryLots:', inventoryLots);

    // Buscar tabela de custos de mão de obra e custos operacionais
    const laborCostTable = await this.prisma.laborCostTableEntry.findMany({
      where: { organizationId },
      orderBy: { minGrams: 'asc' },
    });
    console.log('[DEBUG CREATE_SALE] Resultado laborCostTable:', laborCostTable);
    const operationalCosts = await this.prisma.operationalCost.findMany({
      where: { organizationId },
    });
    console.log('[DEBUG CREATE_SALE] Resultado operationalCosts:', operationalCosts);

    let totalAmount = new Decimal(0);
    let totalCost = new Decimal(0);
    let totalCommissionAmount = new Decimal(0); // Novo: total da comissão
    const commissionDetails: any[] = []; // Novo: detalhes da comissão

    const saleItemsToCreate: Prisma.SaleItemCreateManySaleInput[] = [];
    const allLotDeductions: { lotId: string; quantity: number }[] = [];

    for (const item of items) {
      console.log('[DEBUG CREATE_SALE] Dentro do loop de itens. Item:', item);
      const product = productsInDb.find((p) => p.id.toString() === item.productId);
      console.log('[DEBUG CREATE_SALE] Produto encontrado:', product);
      if (!product) {
        throw new NotFoundException(`Produto com ID ${item.productId} não encontrado.`);
      }

      const productGroup = product.productGroup; // Acessar o grupo do produto
      console.log('[DEBUG CREATE_SALE] Grupo do produto:', productGroup);
      if (!productGroup) {
        throw new BadRequestException(`Produto "${product.name}" não possui um grupo associado.`);
      }
      console.log('[DEBUG CREATE_SALE] product.goldValue:', product.goldValue);
      console.log('[DEBUG CREATE_SALE] laborCostTable:', laborCostTable);
      console.log('[DEBUG CREATE_SALE] operationalCosts:', operationalCosts);

      const isImport = paymentMethod === 'IMPORTADO';

      const productLots = inventoryLots.filter((lot) => lot.productId === item.productId);
      const totalStockInLots = productLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
      const totalStockAvailable = totalStockInLots > 0 ? totalStockInLots : product.stock;

      if (!isImport && totalStockAvailable < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para o produto "${product.name}".`);
      }

      let quantityToDeduct = item.quantity;
      let itemCost = new Decimal(0);

      if (productLots.length > 0) { // Logic for products with lots
        for (const lot of productLots) {
          if (quantityToDeduct === 0) break;

          const quantityFromThisLot = Math.min(quantityToDeduct, lot.remainingQuantity);
          allLotDeductions.push({ lotId: lot.id, quantity: quantityFromThisLot });
          itemCost = itemCost.plus(new Decimal(lot.costPrice).times(quantityFromThisLot));
          quantityToDeduct -= quantityFromThisLot;
        }
      } else { // Logic for products without lots (deduct from main stock)
        // No lot deductions needed, but we still need to calculate cost
        itemCost = new Decimal(product.costPrice || 0).times(item.quantity);
        // The stock will be updated on the product itself later if needed, or assumed managed elsewhere
      }

      const itemPrice = new Decimal(item.price);
      totalAmount = totalAmount.plus(itemPrice.times(item.quantity));
      totalCost = totalCost.plus(itemCost);

      // --- Lógica de Cálculo de Comissão por Item ---
      let itemCommission = new Decimal(0);
      const currentItemCommissionDetails: any = {
        productId: product.id.toString(),
        productName: product.name,
        productGroupId: productGroup.id,
        productGroupName: productGroup.name,
      };

      if (productGroup.isReactionProductGroup) {
        const goldGramsSold = new Decimal(item.quantity).times(new Decimal(product.goldValue || 0));
        let commissionPercentage = new Decimal(2); // Fallback de 2%

        const laborEntry = laborCostTable.find(entry =>
          goldGramsSold.greaterThanOrEqualTo(entry.minGrams) &&
          (entry.maxGrams === null || goldGramsSold.lessThanOrEqualTo(entry.maxGrams))
        );

        if (laborEntry && laborEntry.commissionPercentage) {
          commissionPercentage = new Decimal(laborEntry.commissionPercentage);
        }

        const commissionInGold = goldGramsSold.times(commissionPercentage).dividedBy(100);
        itemCommission = commissionInGold.times(goldQuote.valorVenda);

        currentItemCommissionDetails.commissionPercentage = commissionPercentage;
        currentItemCommissionDetails.commissionInGold = commissionInGold;

      } else {
        // Comissão para produtos de revenda (baseada em porcentagem do lucro bruto)
        const itemProfit = itemPrice.times(item.quantity).minus(itemCost);
        if (productGroup.commissionPercentage) {
          itemCommission = itemProfit.times(productGroup.commissionPercentage).dividedBy(100);
          currentItemCommissionDetails.itemProfit = itemProfit;
          currentItemCommissionDetails.commissionPercentage = productGroup.commissionPercentage;
        } else {
          // Se não houver porcentagem de comissão definida para o grupo de revenda
          itemCommission = new Decimal(0);
        }
      }

      totalCommissionAmount = totalCommissionAmount.plus(itemCommission);
      commissionDetails.push(currentItemCommissionDetails);
      // --- Fim da Lógica de Cálculo de Comissão por Item ---

      saleItemsToCreate.push({
        productId: product.id.toString(),
        quantity: item.quantity,
        price: itemPrice,
        costPriceAtSale: itemCost.dividedBy(item.quantity),
        inventoryLotId: item.inventoryLotId, // Usar o ID do lote do DTO
      });
    }

    const finalFeeAmount = new Decimal(feeAmount || 0);
    const netAmount = totalAmount.plus(finalFeeAmount);
    const goldPrice = goldQuote.valorVenda;
    console.log('[DEBUG CREATE_SALE] goldQuote:', goldQuote);
    console.log('[DEBUG CREATE_SALE] goldPrice:', goldPrice);
    const goldValue = netAmount.dividedBy(goldPrice);

    console.log('[DEBUG CREATE_SALE] Antes da transação. this.prisma:', !!this.prisma);
    console.log('[DEBUG CREATE_SALE] Antes da transação. typeof this.prisma.$transaction:', typeof this.prisma.$transaction);
    return this.prisma.$transaction(async (tx) => {
      console.log('[DEBUG CREATE_SALE] Iniciando transação. tx:', !!tx);
      console.log('[DEBUG CREATE_SALE] Conteúdo de tx:', Object.keys(tx));
      console.log('[DEBUG CREATE_SALE] Conteúdo de tx.sale:', !!tx.sale);
      console.log('[DEBUG CREATE_SALE] Conteúdo de tx.sale.create:', !!tx.sale.create);
      // 1. Generate sequential order number
      const lastSale = await tx.sale.findFirst({
        where: { organizationId },
        orderBy: { orderNumber: 'desc' },
      });
      const nextOrderNumber = (lastSale?.orderNumber || 31700) + 1;

      // 2. Create the Sale and SaleItems first
      const sale = await tx.sale.create({
        data: {
          organizationId,
          pessoaId,
          orderNumber: nextOrderNumber,
          totalAmount,
          totalCost,
          feeAmount: finalFeeAmount,
          netAmount,
          goldPrice,
          goldValue,
          paymentMethod,
          commissionAmount: totalCommissionAmount, // Novo: Salvar comissão total
          commissionDetails: commissionDetails,     // Novo: Salvar detalhes da comissão
          saleItems: { create: saleItemsToCreate },
        },
        include: { saleItems: true }, // Include saleItems for the next step
      });
      console.log('[DEBUG CREATE_SALE] Venda criada na transação:', sale.id);

      const isImport = sale.paymentMethod === 'IMPORTADO';

      // 2. Deduct stock and create stock movements
      for (const item of sale.saleItems) {
        const product = productsInDb.find((p) => p.id.toString() === item.productId);
        const productGroup = product.productGroup;
        if (!isImport) {
          if (item.inventoryLotId) {
            // Deduct from the specific lot specified in the sale item
            await tx.inventoryLot.update({
              where: { id: item.inventoryLotId },
              data: { remainingQuantity: { decrement: item.quantity } },
            });
          } else {
            // Fallback to FIFO deduction if no specific lot is provided
            const productLots = inventoryLots.filter((lot) => lot.productId === item.productId);
            if (productLots.length > 0) {
              let quantityToDeduct = item.quantity;
              for (const lot of productLots) {
                if (quantityToDeduct === 0) break;
                const quantityFromThisLot = Math.min(quantityToDeduct, lot.remainingQuantity);
                await tx.inventoryLot.update({
                  where: { id: lot.id },
                  data: { remainingQuantity: { decrement: quantityFromThisLot } },
                });
                quantityToDeduct -= quantityFromThisLot;
              }
            } else {
              // Deduct from general product stock if no lots exist
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }
          }
          // Always decrement the product's overall stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            organization: { connect: { id: organizationId } },
            product: { connect: { id: item.productId } },
            quantity: -item.quantity, // Negative for outgoing stock
            type: 'SALE',
          },
        });
      }

      // 3. Calcular e registrar a diferença de cotação
      const diffCotacaoConta = await tx.contaContabil.findUnique({
        where: {
          organizationId_codigo: {
            organizationId,
            codigo: '4.1.1', // Código sugerido para Diferença de Cotação de Metais
          },
        },
      });

      if (!diffCotacaoConta) {
        throw new BadRequestException('Conta contábil "Diferença de Cotação de Metais" (4.1.1) não encontrada.');
      }

      const goldPriceDiff = goldQuote.valorVenda.minus(goldQuote.valorCompra);
      if (goldPriceDiff.greaterThan(0) && sale.goldValue) {
        const diffValueInBRL = goldPriceDiff.times(sale.goldValue);

        await tx.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO, // Ou DEBITO, dependendo da natureza da diferença
            valor: diffValueInBRL,
            moeda: 'BRL',
            descricao: `Diferença de Cotação da Venda #${sale.orderNumber}`,
            contaContabilId: diffCotacaoConta.id,
            dataHora: new Date(),
          },
        });
      }

      // 4. Create financial entries (antigo passo 3)
      await this.createFinancialEntries(tx, sale, settings, createSaleDto, clientMetalAccountId);

      return sale;
    });
  }

  private async createFinancialEntries(
    tx: Prisma.TransactionClient,
    sale: any,
    settings: any,
    dto: CreateSaleDto,
    clientMetalAccountId?: string, // Adicionado para pagamento em metal
  ) {
    const { paymentMethod, numberOfInstallments, contaCorrenteId } = dto;
    const { id, organizationId, orderNumber, netAmount, goldValue, goldPrice } = sale; // Adicionado goldValue e goldPrice

    if (paymentMethod === 'A_VISTA') {
      if (!contaCorrenteId)
        throw new BadRequestException('Conta de destino é obrigatória para vendas à vista.');
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: netAmount,
          moeda: 'BRL',
          descricao: `Recebimento da Venda #${orderNumber}`,
          contaContabilId: settings.defaultReceitaContaId!,
          contaCorrenteId: contaCorrenteId,
          dataHora: new Date(),
        },
      });
    } else if (paymentMethod === 'METAL') {
      if (!goldValue || goldValue.lessThanOrEqualTo(0)) {
        throw new BadRequestException('Valor em ouro inválido para pagamento em metal.');
      }

      // 1. Encontrar a MetalAccount do cliente
      let clientMetalAccount;
      if (clientMetalAccountId) {
        clientMetalAccount = await tx.metalAccount.findUnique({
          where: { id: clientMetalAccountId, organizationId, personId: sale.pessoaId },
        });
      } else {
        // Buscar a conta de metal padrão do cliente (assumindo uma por tipo de metal)
        clientMetalAccount = await tx.metalAccount.findFirst({
          where: { personId: sale.pessoaId, organizationId, type: TipoMetal.AU },
        });
      }

      if (!clientMetalAccount) {
        // throw new NotFoundException(`Conta de metal do cliente ${sale.pessoaId} não encontrada.`);
        clientMetalAccount = await tx.metalAccount.create({
          data: {
            personId: sale.pessoaId,
            organizationId,
            type: TipoMetal.AU,
          },
        });
      }

      // 2. Verificar saldo do cliente (simplificado, idealmente buscar saldo agregado)
      // Para uma verificação mais robusta, seria necessário somar os MetalAccountEntry
      // Por enquanto, vamos assumir que o saldo é suficiente e o repositório fará a validação

      // 3. Deduzir do saldo do cliente (criar MetalAccountEntry negativo)
      await tx.metalAccountEntry.create({
        data: {
          metalAccountId: clientMetalAccount.id,
          date: new Date(),
          description: `Pagamento da Venda #${orderNumber} em metal`,
          grams: goldValue.negated().toNumber(), // Valor negativo para deduzir
          type: 'SALE_PAYMENT',
          sourceId: id,
        },
      });

      // 4. Adicionar ao pure_metal_lots da empresa
      // Criar um novo lote ou adicionar a um lote existente (simplificado para criar novo)
      console.log('[DEBUG CREATE_SALE] goldValue antes de criar o lote de metal puro:', goldValue);
      await tx.pure_metal_lots.create({
        data: {
          organizationId,
          sourceType: 'SALE_PAYMENT',
          sourceId: id,
          metalType: TipoMetal.AU,
          initialGrams: goldValue.toNumber(),
          remainingGrams: goldValue.toNumber(),
          purity: 1, // Assumimos pureza 100% para pagamento em metal
          notes: `Metal recebido como pagamento da Venda #${orderNumber}`,
        },
      });

      // 5. Criar Transação Financeira (em BRL) para registrar a receita
      await tx.transacao.create({
        data: {
          organizationId,
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: netAmount,
          moeda: 'BRL',
          descricao: `Recebimento da Venda #${orderNumber} (Pagamento em Metal)`,
          contaContabilId: settings.defaultReceitaContaId!,
          dataHora: new Date(),
        },
      });

      // 6. Se houver accountRec gerado, marcar como pago (ou não gerar)
      // Por simplicidade, assumimos que pagamento em metal é à vista e não gera accountRec
      // Se a venda for a prazo e o pagamento em metal for parcial, a lógica seria mais complexa

    } else { // Existing A_PRAZO and CREDIT_CARD logic
      const installmentsCount = paymentMethod === 'A_PRAZO' ? (numberOfInstallments || 1) : 1;
      const installmentValue = new Decimal(netAmount).dividedBy(installmentsCount);

      for (let i = 1; i <= installmentsCount; i++) {
        await tx.accountRec.create({
          data: {
            organizationId,
            saleId: id,
            description: `Parcela ${i}/${installmentsCount} da Venda #${orderNumber}`,
            amount: installmentValue,
            dueDate: paymentMethod === 'CREDIT_CARD' ? addDays(new Date(), 30) : addMonths(new Date(), i),
          },
        });
      }
    }
  }
}
