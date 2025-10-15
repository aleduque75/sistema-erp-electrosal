import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TipoMetal, SaleInstallmentStatus } from '@prisma/client';
import { SettingsService } from '../../settings/settings.service';
import { ProductMapper } from '../../products/mappers/product.mapper';
import { QuotationsService } from '../../quotations/quotations.service';
import Decimal from 'decimal.js';

@Injectable()
export class CreateSaleUseCase {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private quotationsService: QuotationsService,
  ) {}

  async execute(organizationId: string, userId: string, createSaleDto: CreateSaleDto) {
    const {
      pessoaId,
      items,
      paymentMethod,
      paymentTermId, // ADICIONADO
      feeAmount,
      goldQuoteValue,
      freightAmount,
    } = createSaleDto;

    const client = await this.prisma.client.findFirst({ where: { pessoaId, organizationId } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');

    let goldQuote: { valorVenda: Decimal };

    if (goldQuoteValue) {
      goldQuote = { valorVenda: new Decimal(goldQuoteValue) };
    } else {
      const latestGoldQuote = await this.quotationsService.findLatest(TipoMetal.AU, organizationId, new Date());
      if (!latestGoldQuote) throw new BadRequestException('Nenhuma cotação de ouro encontrada para hoje.');
      goldQuote = { valorVenda: latestGoldQuote.sellPrice };
    }

    const productIds = items.map((item) => item.productId);
    const inventoryLotIds = items
      .map((item) => item.inventoryLotId)
      .filter((id): id is string => !!id); // Filter out null/undefined

    const [rawProductsInDb, inventoryLotsInDb] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productIds }, organizationId },
        include: { productGroup: true },
      }),
      this.prisma.inventoryLot.findMany({
        where: { id: { in: inventoryLotIds }, organizationId },
      }),
    ]);

    const productsInDb = rawProductsInDb.map(ProductMapper.toDomain);
    const inventoryLotsMap = new Map(inventoryLotsInDb.map(lot => [lot.id, lot]));

    const laborCostTable = await this.prisma.laborCostTableEntry.findMany({
      where: { organizationId },
      orderBy: { minGrams: 'asc' },
    });

    let totalAmount = new Decimal(0);
    let totalCost = new Decimal(0);
    let totalCommissionAmount = new Decimal(0);
    const commissionDetails: any[] = [];
    const saleItemsToCreate: Prisma.SaleItemCreateManySaleInput[] = [];

    for (const item of items) {
      const product = productsInDb.find((p) => p.id.toString() === item.productId);
      if (!product) throw new NotFoundException(`Produto com ID ${item.productId} não encontrado.`);

      if (!item.inventoryLotId) {
        throw new BadRequestException(`Item ${product.name} não possui um lote de inventário (inventoryLotId) especificado.`);
      }
      const inventoryLot = inventoryLotsMap.get(item.inventoryLotId);
      if (!inventoryLot) throw new NotFoundException(`Lote de inventário com ID ${item.inventoryLotId} não encontrado.`);

      const productGroup = product.productGroup;
      if (!productGroup) throw new BadRequestException(`Produto "${product.name}" não possui um grupo associado.`);

      const itemPrice = new Decimal(item.price);
      const itemQuantity = new Decimal(item.quantity);
      totalAmount = totalAmount.plus(itemPrice.times(itemQuantity));
      
      const lotCostPrice = new Decimal(inventoryLot.costPrice);
      const itemCost = lotCostPrice.times(itemQuantity);
      totalCost = totalCost.plus(itemCost);

      // --- Commission Calculation Logic ---
      let itemCommission = new Decimal(0);
      const currentItemCommissionDetails: any = {
        productId: product.id.toString(),
        productName: product.name,
        productGroupId: productGroup.id,
        productGroupName: productGroup.name,
      };

      if (productGroup.isReactionProductGroup) {
        const goldGramsSold = itemQuantity.times(new Decimal(product.goldValue || 0));
        let commissionPercentage = new Decimal(2); // Fallback

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
        const itemProfit = itemPrice.times(itemQuantity).minus(itemCost);
        if (productGroup.commissionPercentage) {
          itemCommission = itemProfit.times(productGroup.commissionPercentage).dividedBy(100);
          currentItemCommissionDetails.itemProfit = itemProfit;
          currentItemCommissionDetails.commissionPercentage = productGroup.commissionPercentage;
        }
      }

      totalCommissionAmount = totalCommissionAmount.plus(itemCommission);
      commissionDetails.push(currentItemCommissionDetails);
      // --- End Commission Logic ---

      saleItemsToCreate.push({
        productId: product.id.toString(),
        quantity: item.quantity,
        price: itemPrice,
        costPriceAtSale: lotCostPrice, // Cost at time of sale from the specific lot
        inventoryLotId: item.inventoryLotId,
      });
    }

    const finalFeeAmount = new Decimal(feeAmount || 0);
    const finalFreightAmount = new Decimal(freightAmount || 0);
    const netAmount = totalAmount.plus(finalFeeAmount).plus(finalFreightAmount);
    const goldPrice = goldQuote.valorVenda;
    const goldValue = netAmount.dividedBy(goldPrice);

    const lastSale = await this.prisma.sale.findFirst({
      where: { organizationId },
      orderBy: { orderNumber: 'desc' },
    });
    const nextOrderNumber = (lastSale?.orderNumber || 31700) + 1;

    const sale = await this.prisma.sale.create({
      data: {
        organizationId,
        pessoaId,
        orderNumber: nextOrderNumber,
        totalAmount,
        totalCost,
        feeAmount: finalFeeAmount,
        shippingCost: finalFreightAmount,
        netAmount,
        goldPrice,
        goldValue,
        paymentMethod,
        paymentTermId, // ADICIONADO
        commissionAmount: totalCommissionAmount,
        commissionDetails: commissionDetails,
        // Status will default to PENDENTE via schema
        saleItems: { create: saleItemsToCreate },
      },
    });

    if (paymentTermId) {
      const paymentTerm = await this.prisma.paymentTerm.findUnique({
        where: { id: paymentTermId },
      });

      if (paymentTerm && paymentTerm.installmentsDays.length > 0) {
        const numberOfInstallments = paymentTerm.installmentsDays.length;
        const installmentAmount = netAmount.dividedBy(numberOfInstallments).toDecimalPlaces(2, Decimal.ROUND_DOWN);
        const remainder = netAmount.minus(installmentAmount.times(numberOfInstallments));

        const installmentsToCreate = paymentTerm.installmentsDays.map((days, index) => {
          const dueDate = new Date(sale.createdAt);
          dueDate.setDate(dueDate.getDate() + days);

          // Add the remainder to the first installment
          const finalInstallmentAmount = index === 0 ? installmentAmount.plus(remainder) : installmentAmount;

          return {
            saleId: sale.id,
            installmentNumber: index + 1,
            amount: finalInstallmentAmount,
            dueDate,
            status: SaleInstallmentStatus.PENDING,
          };
        });

        await this.prisma.saleInstallment.createMany({
          data: installmentsToCreate,
        });
      }
    }

    return sale;
  }
}