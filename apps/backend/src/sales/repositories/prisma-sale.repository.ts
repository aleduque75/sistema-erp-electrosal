import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SalesRepository, FindSalesOptions } from './sales.repository';
import { SaleEntity } from '../entities/sale.entity';
import { SaleMapper } from '../mappers/sale.mapper';

@Injectable()
export class PrismaSaleRepository implements SalesRepository {
  constructor(private prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx || this.prisma;
  }

  async create(
    organizationId: string,
    sale: SaleEntity,
    tx?: Prisma.TransactionClient,
  ): Promise<SaleEntity> {
    const client = this.getClient(tx);

    const persistenceData = SaleMapper.toPersistence(sale);

    const created = await client.sale.create({
      data: {
        ...persistenceData,
        organizationId,
        saleItems: {
          create: sale.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            costPriceAtSale: item.costPriceAtSale,
            laborPercentage: item.laborPercentage,
            externalId: item.externalId,
            ...(item.saleItemLots && item.saleItemLots.length > 0
              ? {
                  saleItemLots: {
                    createMany: {
                      data: item.saleItemLots.map((lot: any) => ({
                        inventoryLotId: lot.inventoryLotId,
                        quantity: lot.quantity,
                      })),
                    },
                  },
                }
              : {}),
          })),
        },
      },
      include: {
        saleItems: {
          include: {
            product: true,
            saleItemLots: true,
          },
        },
        pessoa: true,
        paymentTerm: true,
      },
    });

    return SaleMapper.toDomain(created);
  }

  async update(
    organizationId: string,
    sale: SaleEntity,
    tx?: Prisma.TransactionClient,
  ): Promise<SaleEntity> {
    const client = this.getClient(tx);
    const persistenceData = SaleMapper.toPersistence(sale);

    const updated = await client.sale.update({
      where: { id: sale.id },
      data: {
        orderNumber: persistenceData.orderNumber,
        status: persistenceData.status,
        totalAmount: persistenceData.totalAmount,
        totalCost: persistenceData.totalCost,
        netAmount: persistenceData.netAmount,
        feeAmount: persistenceData.feeAmount,
        shippingCost: persistenceData.shippingCost,
        goldPrice: persistenceData.goldPrice,
        goldValue: persistenceData.goldValue,
        paymentMethod: persistenceData.paymentMethod,
        paymentTermId: persistenceData.paymentTermId,
        readyForPayment: persistenceData.readyForPayment,
        observation: persistenceData.observation,
        salespersonId: persistenceData.salespersonId,
        commissionAmount: persistenceData.commissionAmount,
        commissionDetails: persistenceData.commissionDetails,
        updatedAt: new Date(),
      },
      include: {
        saleItems: {
          include: {
            product: true,
            saleItemLots: true,
          },
        },
        pessoa: true,
        paymentTerm: true,
      },
    });

    return SaleMapper.toDomain(updated);
  }

  async updatePartial(
    organizationId: string,
    id: string,
    data: any,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    const client = this.getClient(tx);
    const existing = await client.sale.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }

    const {
      items,
      clientMetalAccountId,
      numberOfInstallments,
      contaCorrenteId,
      goldQuoteValue,
      externalId,
      freightAmount,
      paymentMetalType,
      createdAt,
      orderNumber,
      ...rest
    } = data;

    return client.sale.update({
      where: { id },
      data: rest,
    });
  }

  async updateObservation(
    organizationId: string,
    id: string,
    observation?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    const client = this.getClient(tx);
    return client.sale.update({
      where: { id, organizationId },
      data: { observation },
    });
  }

  async findById(
    organizationId: string,
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SaleEntity | null> {
    const client = this.getClient(tx);
    const raw = await client.sale.findFirst({
      where: { id, organizationId },
      include: {
        saleItems: {
          include: {
            product: true,
            saleItemLots: true,
          },
        },
        pessoa: true,
        paymentTerm: true,
        adjustment: true,
        installments: true,
      },
    });

    if (!raw) return null;
    return SaleMapper.toDomain(raw);
  }

  async findByIdWithDetails(
    organizationId: string,
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<any | null> {
    const client = this.getClient(tx);
    const prismaSale = await client.sale.findFirst({
      where: { id, organizationId },
      include: {
        pessoa: true,
        paymentTerm: true,
        salesperson: true,
        installments: {
          include: {
            accountRec: {
              include: {
                transacoes: {
                  include: {
                    contaCorrente: true,
                    contaContabil: true,
                  },
                },
              },
            },
          },
        },
        saleItems: {
          include: {
            product: true,
            saleItemLots: {
              include: {
                inventoryLot: true,
              },
            },
          },
        },
        accountsRec: {
          include: {
            transacoes: {
              include: {
                contaCorrente: true,
                contaContabil: true,
              },
            },
          },
        },
        adjustment: true,
      },
    });

    if (!prismaSale) return null;

    return {
      ...prismaSale,
      saleItems: prismaSale.saleItems.map((item) => ({
        ...item,
        price: item.price.toNumber(),
        product: item.product
          ? { id: item.product.id, name: item.product.name, goldValue: item.product.goldValue }
          : null,
        saleItemLots: item.saleItemLots,
      })),
    };
  }

  async findByOrderNumberWithTransactions(
    organizationId: string,
    orderNumber: number,
    tx?: Prisma.TransactionClient,
  ): Promise<any | null> {
    const client = this.getClient(tx);
    return client.sale.findFirst({
      where: {
        organizationId,
        orderNumber,
      },
      include: {
        pessoa: {
          select: { id: true, name: true },
        },
        accountsRec: {
          include: {
            transacoes: {
              include: {
                contaCorrente: { select: { id: true, nome: true } },
                contaContabil: { select: { id: true, nome: true } },
              },
            },
          },
        },
        saleItems: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async findAll(
    organizationId: string,
    options: FindSalesOptions = {},
  ): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 50, status, orderNumber, startDate, endDate, clientId } = options;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.SaleWhereInput = { organizationId };
    if (status) {
      whereClause.status = status;
    }
    if (orderNumber) {
      const trimmed = orderNumber.toString().trim();
      const isOnlyDigits = /^\d+$/.test(trimmed);
      if (isOnlyDigits) {
        whereClause.OR = [
          { orderNumber: Number(trimmed) },
          { pessoa: { name: { contains: trimmed, mode: 'insensitive' } } },
        ];
      } else {
        whereClause.pessoa = {
          name: { contains: trimmed, mode: 'insensitive' },
        };
      }
    }
    if (startDate) {
      whereClause.createdAt = {
        ...(whereClause.createdAt as Prisma.DateTimeFilter),
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      whereClause.createdAt = {
        ...(whereClause.createdAt as Prisma.DateTimeFilter),
        lte: new Date(endDate),
      };
    }
    if (clientId) {
      whereClause.pessoaId = clientId;
    }

    const [total, prismaSales] = await Promise.all([
      this.prisma.sale.count({ where: whereClause }),
      this.prisma.sale.findMany({
        where: whereClause,
        include: {
          pessoa: true,
          saleItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
              saleItemLots: {
                include: {
                  inventoryLot: {
                    select: {
                      batchNumber: true,
                    },
                  },
                },
              },
            },
            take: 10,
          },
          adjustment: {
            select: {
              paymentReceivedBRL: true,
              netDiscrepancyGrams: true,
            },
          },
          pureMetalLots: {
            select: {
              id: true,
              metalType: true,
            },
            take: 1,
          },
          metalReceivable: {
            select: {
              id: true,
              metalType: true,
            },
          },
          accountsRec: {
            include: {
              contaCorrente: {
                select: { nome: true },
              },
              transacoes: {
                include: {
                  contaCorrente: {
                    select: { nome: true },
                  },
                  contaContabil: {
                    select: { nome: true },
                  },
                },
                take: 5,
              },
            },
            take: 5,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    const data = prismaSales.map((sale) => {
      let paymentAccountName: string | null = null;

      // 1. Check direct contaCorrente in accountsRec or its transactions
      for (const acc of sale.accountsRec || []) {
        if ((acc as any).contaCorrente?.nome) {
          paymentAccountName = (acc as any).contaCorrente.nome;
          break;
        }
        for (const tx of acc.transacoes || []) {
          if (tx.contaCorrente?.nome) {
            paymentAccountName = tx.contaCorrente.nome;
            break;
          }
        }
        if (paymentAccountName) break;
      }

      // 2. If no bank account found, check if it was received in metal
      if (!paymentAccountName) {
        const hasPureMetalLot = (sale as any).pureMetalLots?.length > 0;
        const hasMetalReceivable = !!(sale as any).metalReceivable;
        const hasMetalInDesc = sale.accountsRec?.some((a) =>
          a.description?.toUpperCase().includes('METAL') ||
          a.transacoes?.some((t) => t.descricao?.toUpperCase().includes('METAL') || (t.goldAmount && !t.contaCorrenteId))
        );

        if (sale.paymentMethod === 'METAL' || hasPureMetalLot || hasMetalReceivable || hasMetalInDesc) {
          const metalType = (sale as any).pureMetalLots?.[0]?.metalType || (sale as any).metalReceivable?.metalType;
          paymentAccountName = metalType ? `METAL (${metalType})` : 'METAL';
        }
      }

      return {
        ...sale,
        paymentAccountName,
        saleItems: sale.saleItems.map((item) => ({
          ...item,
          price: (item.price as any).toNumber(),
          product: item.product,
        })),
      };
    });

    return { data, total };
  }

  async getNextOrderNumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = this.getClient(tx);
    const lastSale = await client.sale.findFirst({
      where: { organizationId },
      orderBy: { orderNumber: 'desc' },
    });
    return (lastSale?.orderNumber || 31700) + 1;
  }

  async checkOrderNumberExists(
    organizationId: string,
    orderNumber: number,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = this.getClient(tx);
    const sale = await client.sale.findFirst({
      where: {
        organizationId,
        orderNumber,
      },
    });
    return !!sale;
  }

  async remove(
    organizationId: string,
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.sale.delete({
      where: { id },
    });
  }
}
