import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { Sale, SaleInstallmentStatus, TipoTransacaoPrisma, Prisma, SaleStatus, Transacao } from '@prisma/client'; // Keep Sale for now, will refactor later
import { addMonths, addDays } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case'; // Added
import { StockMovement, SaleItem } from '@sistema-erp-electrosal/core'; // Added SaleItem
import { StockMovementMapper } from '../products/mappers/stock-movement.mapper'; // Added
import { SaleItemMapper } from './mappers/sale-item.mapper'; // Added
import { CalculateSaleAdjustmentUseCase } from './use-cases/calculate-sale-adjustment.use-case';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private createSaleUseCase: CreateSaleUseCase, // Injected
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async create(
    organizationId: string,
    userId: string, // Added userId
    createSaleDto: CreateSaleDto,
  ): Promise<Sale> {
    return this.createSaleUseCase.execute(organizationId, userId, createSaleDto);
  }

  // Recebe organizationId
  async findAll(
    organizationId: string,
    options: {
      limit?: number;
      status?: SaleStatus;
      orderNumber?: string;
      startDate?: string;
      endDate?: string;
      clientId?: string;
    } = {},
  ): Promise<Sale[]> {
    const { limit, status, orderNumber, startDate, endDate, clientId } = options;

    const whereClause: Prisma.SaleWhereInput = { organizationId };
    if (status) {
      whereClause.status = status;
    }
    if (orderNumber) {
      whereClause.orderNumber = Number(orderNumber);
    }
    if (startDate) {
      whereClause.createdAt = { ...whereClause.createdAt as Prisma.DateTimeFilter, gte: new Date(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt as Prisma.DateTimeFilter, lte: new Date(endDate) };
    }
    if (clientId) {
      whereClause.pessoaId = clientId;
    }

    const prismaSales = await this.prisma.sale.findMany({
      where: whereClause,
      include: {
        pessoa: true, // Inclui o nome do cliente na listagem
        paymentTerm: true, // Inclui os dados do prazo de pagamento
        saleItems: {
          include: {
            product: true, // Inclui detalhes do produto em cada item
            inventoryLot: true, // Inclui o lote para exibir o batchNumber
          },
        },
        adjustment: true, // Include the sale adjustment data
        installments: true, // Include the sale installments for details view
        accountsRec: {
          include: {
            transacoes: {
              include: {
                contaCorrente: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const result = prismaSales.map(sale => {
      const paymentAccountName = sale.accountsRec[0]?.transacoes[0]?.contaCorrente?.nome || null;

      return {
        ...sale,
        paymentAccountName,
        saleItems: sale.saleItems.map((item) => ({
          ...item,
          price: item.price.toNumber(),
          product: item.product
            ? { id: item.product.id, name: item.product.name }
            : null,
          inventoryLot: item.inventoryLot, // Garante que o lote seja passado
        })),
      };
    });

    console.log('[DEBUG sales.service.ts findAll] returning:', JSON.stringify(result, null, 2));

    return result;
  }

  // Recebe organizationId
  async findOne(organizationId: string, id: string): Promise<Sale> {
    const prismaSale = await this.prisma.sale.findFirst({
      where: { id, organizationId },
      include: {
        pessoa: true, // Inclui os dados do cliente
        paymentTerm: true, // Inclui o prazo de pagamento
        installments: {
          include: {
            accountRec: {
              include: {
                transacoes: {
                  include: {
                    contaCorrente: true,
                  },
                },
              },
            },
          },
        },
        saleItems: {
          // Inclui os itens da venda
          include: {
            product: true, // Para cada item, inclui os dados do produto
            inventoryLot: true,
          },
        },
        accountsRec: { // Inclui os recebíveis associados
          include: {
            transacoes: { // Para cada recebível, inclui a transação
              include: {
                contaCorrente: true, // Para cada transação, inclui a conta corrente
              },
            },
          },
        },
        adjustment: true, // Inclui os dados de ajuste da venda
      },
    });

    if (!prismaSale) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }

    const result = {
      ...prismaSale,
      saleItems: prismaSale.saleItems.map((item) => ({
        ...item,
        price: item.price.toNumber(),
        product: item.product
          ? { id: item.product.id, name: item.product.name, goldValue: item.product.goldValue }
          : null,
        inventoryLot: item.inventoryLot, // Garante que o lote seja passado
      })),
    };

    console.log('[DEBUG sales.service.ts findOne] returning:', JSON.stringify(result, null, 2));

    return result;
  }

  // Recebe organizationId
  async update(
    organizationId: string,
    id: string,
    data: UpdateSaleDto,
  ): Promise<Sale> {
    await this.findOne(organizationId, id); // Checa a posse antes de atualizar
    return this.prisma.sale.update({
      where: { id },
      data,
    });
  }

  async remove(organizationId: string, id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, organizationId },
      include: {
        saleItems: {
          include: {
            inventoryLot: true, // Include inventoryLot to restore stock
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Restaurar estoque dos produtos (agora via lotes)
      for (const item of sale.saleItems) {
        if (item.inventoryLotId) { // Only restore if it was linked to a lot
          await prisma.inventoryLot.update({
            where: { id: item.inventoryLotId },
            data: {
              remainingQuantity: {
                increment: item.quantity,
              },
            },
          });
        } else {
          // Fallback for old sales or if inventoryLotId was null
          // This should ideally not happen if all sales are linked to lots
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      // 2. Deletar SaleInstallments relacionados
      await prisma.saleInstallment.deleteMany({
        where: { saleId: id },
      });

      // Estornar valor da conta corrente se for venda à vista
      const accountRec = await prisma.accountRec.findFirst({
        where: { saleId: id },
        include: { sale: true }, // Inclui a venda para verificar o paymentMethod
      });

      if (accountRec && accountRec.contaCorrenteId && accountRec.sale?.paymentMethod === 'A_VISTA') {
        await prisma.transacao.create({
          data: {
            organizationId: sale.organizationId,
            tipo: TipoTransacaoPrisma.DEBITO,
            valor: accountRec.amount,
            moeda: 'BRL',
            descricao: `Estorno Venda ${sale.orderNumber}`,
            dataHora: sale.createdAt,
            contaContabilId: (await prisma.contaContabil.findUniqueOrThrow({ where: { organizationId_codigo: { organizationId, codigo: '1.1.1' } } })).id, // Caixa Geral
            contaCorrenteId: accountRec.contaCorrenteId,
          },
        });
      }

      // 3. Deletar AccountRecs relacionados
      await prisma.accountRec.deleteMany({
        where: { saleId: id },
      });

      // 4. Deletar SaleItems relacionados
      await prisma.saleItem.deleteMany({
        where: { saleId: id },
      });

      // 5. Deletar a própria venda
      return prisma.sale.delete({
        where: { id },
      });
    });
  }

  async backfillCosts(organizationId: string): Promise<{ message: string; updatedCount: number }> {
    const salesToProcess = await this.prisma.sale.findMany({
      where: {
        organizationId,
        saleItems: {
          some: {
            product: {
              productGroup: {
                isReactionProductGroup: true,
              },
            },
          },
        },
      },
      include: {
        saleItems: {
          include: {
            product: {
              include: {
                productGroup: true,
              },
            },
          },
        },
      },
    });

    let updatedCount = 0;

    for (const sale of salesToProcess) {
      let newTotalCost = new Decimal(0);

      for (const item of sale.saleItems) {
        const product = item.product;
        const productGroup = product?.productGroup;
        const itemQuantity = new Decimal(item.quantity);
        const costPrice = new Decimal(item.costPriceAtSale || product?.costPrice || 0);

        let itemCost: Decimal;
        if (productGroup?.isReactionProductGroup) {
          itemCost = costPrice.times(itemQuantity).plus(itemQuantity);
        } else {
          itemCost = costPrice.times(itemQuantity);
        }
        newTotalCost = newTotalCost.plus(itemCost);
      }

      if (!newTotalCost.equals(sale.totalCost || 0)) {
        await this.prisma.sale.update({
          where: { id: sale.id },
          data: { totalCost: newTotalCost },
        });
        updatedCount++;
      }
    }

    return {
      message: `${updatedCount} de ${salesToProcess.length} vendas com produtos de reação tiveram seus custos corrigidos.`,
      updatedCount,
    };
  }

  async backfillSaleAdjustments(organizationId: string): Promise<{ message: string; processedCount: number; }> {
    this.logger.log('Iniciando backfill de ajustes de vendas...');
    const salesToProcess = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: SaleStatus.FINALIZADO,
      },
      include: { // Otimização: buscar todos os dados necessários de uma vez
        accountsRec: {
          include: {
            transacoes: true,
          },
        },
        saleItems: {
          include: {
            product: {
              include: {
                productGroup: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`${salesToProcess.length} vendas finalizadas encontradas para processar.`);

    let processedCount = 0;
    for (const [index, sale] of salesToProcess.entries()) {
      this.logger.log(`Processando venda ${index + 1} de ${salesToProcess.length} (ID: ${sale.id})...`);
      try {
        // Simplificado para passar apenas o ID e evitar erro de tipo
        await this.calculateSaleAdjustmentUseCase.execute(sale.id, organizationId);
        processedCount++;
      } catch (error) {
        this.logger.error(`Falha ao processar o ajuste para a venda ${sale.id}:`, error);
      }
    }

    this.logger.log('Backfill de ajustes de vendas concluído.');
    return {
      message: `${processedCount} de ${salesToProcess.length} vendas finalizadas foram processadas para ajuste.`,
      processedCount,
    };
  }

  async updateFinancials(organizationId: string, saleId: string, data: { goldPrice?: number; feeAmount?: number }): Promise<Sale> {
    const dataToUpdate: { goldPrice?: number; feeAmount?: number } = {};

    if (data.goldPrice !== undefined) {
      dataToUpdate.goldPrice = data.goldPrice;
    }
    if (data.feeAmount !== undefined) {
      dataToUpdate.feeAmount = data.feeAmount;
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id: saleId, organizationId },
      data: dataToUpdate,
    });

    // After updating, always recalculate the adjustment
    await this.calculateSaleAdjustmentUseCase.execute(saleId, organizationId);

    return updatedSale;
  }

  async backfillQuotations(organizationId: string): Promise<{ message: string; processedCount: number; notFoundCount: number; }> {
    const salesToProcess = await this.prisma.sale.findMany({
      where: {
        organizationId,
        goldPrice: null,
        accountsRec: {
          some: { transacoes: { some: {} } },
        },
      },
      include: {
        accountsRec: {
          include: {
            transacoes: true,
          },
        },
      },
    });

    let processedCount = 0;
    let notFoundCount = 0;

    for (const sale of salesToProcess) {
      const mainTransaction = sale.accountsRec.flatMap(ar => ar.transacoes).find(t => t && t.valor.isPositive() && t.goldAmount?.isPositive());

      if (mainTransaction) {
        const effectiveQuotation = mainTransaction.valor.dividedBy(mainTransaction.goldAmount!);

        if (effectiveQuotation.isFinite()) {
          await this.prisma.sale.update({
            where: { id: sale.id },
            data: { goldPrice: effectiveQuotation },
          });
          processedCount++;
        } else {
          console.error(`Cotação inválida calculada para a venda ${sale.id}. Valor: ${mainTransaction.valor}, Ouro: ${mainTransaction.goldAmount}`);
          notFoundCount++;
        }
      } else {
        notFoundCount++;
      }
    }

    return {
      message: `${processedCount} de ${salesToProcess.length} vendas tiveram suas cotações preenchidas a partir de suas transações. Para ${notFoundCount}, a transação não foi encontrada ou era inválida.`,
      processedCount,
      notFoundCount,
    };
  }

  async diagnoseSale(organizationId: string, orderNumber: number): Promise<any> {
    const sale = await this.prisma.sale.findFirst({
      where: { 
        orderNumber: orderNumber,
        organizationId: organizationId
      },
      include: {
        saleItems: { 
          include: {
            product: { include: { productGroup: true } },
          }
        },
        accountsRec: {
          include: {
            transacoes: true,
          },
        },
        adjustment: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com Nº ${orderNumber} não encontrada.`);
    }

    const paymentTransactions = sale.accountsRec.flatMap(ar => ar.transacoes).filter((t): t is Transacao => !!t);

    const totalPaymentBRL = paymentTransactions.reduce((sum, t) => sum.plus(t.valor), new Decimal(0));
    const totalPaymentGold = paymentTransactions.reduce((sum, t) => sum.plus(t.goldAmount || 0), new Decimal(0));

    return {
      saleId: sale.id,
      orderNumber: sale.orderNumber,
      saleExpectedGold: sale.goldValue,
      saleItems: sale.saleItems,
      totalPaymentBRL: totalPaymentBRL,
      totalPaymentGold: totalPaymentGold,
      transactions: paymentTransactions.map(t => ({
        id: t.id,
        valor: t.valor,
        goldAmount: t.goldAmount,
        data: t.dataHora,
      })),
      currentAdjustment: sale.adjustment,
    };
  }

  async findByOrderNumberWithTransactions(organizationId: string, orderNumber: number): Promise<Sale | null> {
    const sale = await this.prisma.sale.findFirst({
      where: {
        orderNumber: orderNumber,
        organizationId: organizationId,
      },
      include: {
        accountsRec: {
          include: {
            transacoes: {
              include: {
                contaCorrente: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com Nº ${orderNumber} não encontrada.`);
    }

    return sale;
  }
}
