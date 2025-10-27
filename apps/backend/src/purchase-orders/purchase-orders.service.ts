import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { Prisma, PurchaseOrder, PurchaseOrderStatus } from '@prisma/client';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dtos/purchase-order.dto';
import { addDays } from 'date-fns';

type PurchaseOrderWithItems = Prisma.PurchaseOrderGetPayload<{
  include: { items: true };
}>;

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const { items, fornecedorId, paymentTermId, ...orderData } = data;

    return this.prisma.$transaction(async (tx) => {
      // Validate if all productIds or rawMaterialIds exist and belong to the organization
      for (const item of items) {
        if (item.productId && item.rawMaterialId) {
          throw new BadRequestException(
            `Item do pedido não pode ter productId e rawMaterialId ao mesmo tempo.`,
          );
        }

        if (!item.productId && !item.rawMaterialId) {
          throw new BadRequestException(
            `Item do pedido precisa ter productId or rawMaterialId.`,
          );
        }

        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId, organizationId },
          });
          if (!product) {
            throw new NotFoundException(
              `Produto com ID ${item.productId} não encontrado ou não pertence à organização.`,
            );
          }
        } else if (item.rawMaterialId) {
          const rawMaterial = await tx.rawMaterial.findUnique({
            where: { id: item.rawMaterialId, organizationId },
          });
          if (!rawMaterial) {
            throw new NotFoundException(
              `Matéria-prima com ID ${item.rawMaterialId} não encontrada ou não pertence à organização.`,
            );
          }
        }
      }

      const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

      const newOrder = await tx.purchaseOrder.create({
        data: {
          ...orderData,
          totalAmount: totalAmount,
          organization: { connect: { id: organizationId } },
          fornecedor: { connect: { pessoaId: fornecedorId } },
          paymentTerm: paymentTermId ? { connect: { id: paymentTermId } } : undefined,
          items: {
            createMany: {
              data: items.map((item) => ({
                productId: item.productId,
                rawMaterialId: item.rawMaterialId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        },
        include: { fornecedor: { include: { pessoa: true } }, items: { include: { product: true, rawMaterial: true } } },
      });
      return newOrder;
    });
  }

  async findAll(organizationId: string): Promise<PurchaseOrder[]> {
    return this.prisma.purchaseOrder.findMany({
      where: { organizationId },
      include: { fornecedor: { include: { pessoa: true } }, items: { include: { product: true, rawMaterial: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<PurchaseOrder> {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: { fornecedor: { include: { pessoa: true } }, items: { include: { product: true, rawMaterial: true } } },
    });
    if (!order) {
      throw new NotFoundException(`Pedido de Compra com ID ${id} não encontrado.`);
    }
    return order;
  }

  async update(organizationId: string, id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const { items, fornecedorId, paymentTermId, ...orderData } = data;

    return this.prisma.$transaction(async (tx) => {
      const existingOrder = await this.findOne(organizationId, id) as PurchaseOrderWithItems;

      if (existingOrder.status === PurchaseOrderStatus.RECEIVED) {
        throw new ConflictException(
          'Não é possível alterar um pedido de compra com status RECEBIDO.',
        );
      }

      // Atualiza o cabeçalho do pedido
      let finalTotalAmount = existingOrder.totalAmount; // Default to current total

      if (items !== undefined) { // Check if items array was provided in the DTO
        // If items were provided, recalculate total based on the new items list
        finalTotalAmount = items.reduce((sum, item) => sum.plus(new Decimal(item.quantity).times(item.price)), new Decimal(0));
      }

      await tx.purchaseOrder.update({
        where: { id: existingOrder.id },
        data: {
          ...orderData,
          fornecedor: fornecedorId ? { connect: { pessoaId: fornecedorId } } : undefined,
          paymentTerm: paymentTermId !== undefined ? (paymentTermId === null ? { disconnect: true } : { connect: { id: paymentTermId } }) : undefined,
          totalAmount: finalTotalAmount, // Add this line
        },
      });

      // Sincroniza os itens do pedido
      if (items) {
        for (const item of items) {
          if (item.productId && item.rawMaterialId) {
            throw new BadRequestException(
              `Item do pedido não pode ter productId e rawMaterialId ao mesmo tempo.`,
            );
          }

          if (!item.productId && !item.rawMaterialId) {
            throw new BadRequestException(
              `Item do pedido precisa ter productId or rawMaterialId.`,
            );
          }

          if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId, organizationId },
            });
            if (!product) {
              throw new NotFoundException(
                `Produto com ID ${item.productId} não encontrado ou não pertence à organização.`,
              );
            }
          } else if (item.rawMaterialId) {
            const rawMaterial = await tx.rawMaterial.findUnique({
              where: { id: item.rawMaterialId, organizationId },
            });
            if (!rawMaterial) {
              throw new NotFoundException(
                `Matéria-prima com ID ${item.rawMaterialId} não encontrada ou não pertence à organização.`,
              );
            }
          }
        }

        const existingItemIds = existingOrder.items.map((item) => item.id);
        const newItemIds = items.filter((item) => (item as any).id).map((item) => (item as any).id);

        // Itens a serem deletados
        const itemsToDelete = existingItemIds.filter((itemId) => !newItemIds.includes(itemId));
        if (itemsToDelete.length > 0) {
          await tx.purchaseOrderItem.deleteMany({
            where: { id: { in: itemsToDelete } },
          });
        }

        // Itens a serem criados ou atualizados
        for (const item of items) {
          if ((item as any).id) {
            // Atualizar item existente
            await tx.purchaseOrderItem.update({
              where: { id: (item as any).id },
              data: {
                productId: item.productId,
                rawMaterialId: item.rawMaterialId,
                quantity: item.quantity,
                price: item.price,
              },
            });
          } else {
            // Criar novo item
            await tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: id,
                productId: item.productId,
                rawMaterialId: item.rawMaterialId,
                quantity: item.quantity,
                price: item.price,
              },
            });
          }
        }
      }

      return this.findOne(organizationId, id);
    });
  }

  async remove(organizationId: string, id: string): Promise<PurchaseOrder> {
    const existingOrder = await this.findOne(organizationId, id);

    if (existingOrder.status === PurchaseOrderStatus.RECEIVED) {
      throw new ConflictException(
        'Não é possível remover um pedido de compra com status RECEBIDO.',
      );
    }

    // A exclusão em cascata dos itens é configurada no schema.prisma
    return this.prisma.purchaseOrder.delete({
      where: { id: existingOrder.id },
    });
  }

  async receive(organizationId: string, id: string): Promise<PurchaseOrder> {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        items: { include: { product: true, rawMaterial: true } },
        paymentTerm: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido de Compra com ID ${id} não encontrado.`);
    }

    if (order.status !== PurchaseOrderStatus.PENDING) {
      throw new BadRequestException('Este pedido de compra não está com status PENDENTE.');
    }

    if (!order.paymentTerm) {
      throw new BadRequestException('O prazo de pagamento não foi definido para este pedido.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create inventory lots and stock movements
      for (const item of order.items) {
        if (item.productId) {
          const createdLot = await tx.inventoryLot.create({
            data: {
              organizationId: organizationId,
              productId: item.productId,
              costPrice: item.price, // Cost price from purchase order item
              quantity: item.quantity,
              remainingQuantity: item.quantity,
              sourceType: 'PURCHASE_ORDER',
              sourceId: order.id,
              receivedDate: new Date(), // Current date
            },
          });

          await tx.stockMovement.create({
            data: {
              organizationId,
              productId: item.productId,
              inventoryLotId: createdLot.id,
              quantity: item.quantity, // Positive for incoming stock
              type: 'COMPRA',
              sourceDocument: `Pedido de Compra #${order.orderNumber}`,
            }
          });

          // 2. Update product stock (this might be deprecated in the future in favor of calculated stock from lots)
          this.logger.log(`Atualizando estoque do produto ${item.productId}. Quantidade: ${item.quantity}`);
          const productBeforeUpdate = await tx.product.findUnique({ where: { id: item.productId } });
          this.logger.log(`Estoque antes: ${productBeforeUpdate?.stock}`);

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          const productAfterUpdate = await tx.product.findUnique({ where: { id: item.productId } });
          this.logger.log(`Estoque depois: ${productAfterUpdate?.stock}`);
        } else if (item.rawMaterialId) {
          await tx.rawMaterial.update({
            where: { id: item.rawMaterialId },
            data: {
              stock: {
                increment: item.quantity,
              },
              cost: item.price, // Update raw material cost with the purchase price
            },
          });
        }
      }

      // 2. Create accounts payable
      const today = new Date();
      const totalAmount = new Decimal(order.totalAmount);
      const installmentsDays = order.paymentTerm!.installmentsDays;
      const numInstallments = installmentsDays.length;
      const installmentAmount = totalAmount.dividedBy(numInstallments).toDecimalPlaces(2);

      for (let i = 0; i < numInstallments; i++) {
        const dueDate = addDays(today, installmentsDays[i]);
        // Adjust last installment for rounding differences
        const amount = (i === numInstallments - 1) 
          ? totalAmount.minus(installmentAmount.times(numInstallments - 1))
          : installmentAmount;

        await tx.accountPay.create({
          data: {
            organizationId,
            description: `Parcela ${i + 1}/${numInstallments} do Pedido de Compra #${order.orderNumber}`,
            amount: amount,
            dueDate: dueDate,
            isInstallment: true,
            installmentNumber: i + 1,
            totalInstallments: numInstallments,
            // TODO: Link to a 'contaContabil' for purchases
          },
        });
      }

      // 3. Update purchase order status
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
        },
        include: {
          fornecedor: { include: { pessoa: true } },
          items: { include: { product: true, rawMaterial: true } },
        },
      });

      return updatedOrder;
    });
  }
}
