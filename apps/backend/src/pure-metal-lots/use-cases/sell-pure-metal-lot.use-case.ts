import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { SellPureMetalLotDto } from '../dtos/sell-pure-metal-lot.dto';
import { TipoMetal, Prisma } from '@prisma/client';
import { PureMetalLotMapper } from '../mappers/pure-metal-lot.mapper';

@Injectable()
export class SellPureMetalLotUseCase {
  constructor(private readonly pureMetalLotsRepository: PureMetalLotsRepository) {}

  private async ensurePureMetalProduct(
    organizationId: string,
    metalType: TipoMetal,
    tx: Prisma.TransactionClient,
  ) {
    const productName = metalType === TipoMetal.AU ? 'Ouro Puro (LMP)' : 'Prata Pura (LMP)';

    let product = await tx.product.findFirst({
      where: {
        organizationId,
        name: { equals: productName, mode: 'insensitive' },
      },
    });

    if (product) return product;

    if (metalType === TipoMetal.AU) {
      product = await tx.product.findFirst({
        where: {
          organizationId,
          goldValue: 1.0,
        },
      });
      if (product) return product;
    }

    return tx.product.create({
      data: {
        organizationId,
        name: productName,
        price: 0,
        stockUnit: 'GRAMS',
        goldValue: 1.0,
        description: `Produto automático para venda de metal puro (${metalType})`,
      },
    });
  }

  async execute(
    organizationId: string,
    userId: string,
    id: string,
    dto: SellPureMetalLotDto,
  ) {
    return this.pureMetalLotsRepository.executeInTransaction(async (tx) => {
      const record = await this.pureMetalLotsRepository.findById(id, organizationId, tx);
      if (!record) {
        throw new NotFoundException(`Lote de metal puro com ID ${id} não encontrado.`);
      }

      const { lot } = record;

      if (!lot.canDeduct(dto.grams)) {
        throw new BadRequestException(
          `Quantidade insuficiente no lote. Disponível: ${lot.remainingGrams.value}g, Solicitado: ${dto.grams}g.`,
        );
      }

      // 1. Get next order number for Sale
      const lastSale = await tx.sale.findFirst({
        where: { organizationId },
        orderBy: { orderNumber: 'desc' },
      });
      const nextOrderNumber = (lastSale?.orderNumber || 31700) + 1;

      // 2. Ensure Pure Metal Product exists
      const metalProduct = await this.ensurePureMetalProduct(organizationId, lot.metalType, tx);

      // 3. Create Sale
      const sale = await tx.sale.create({
        data: {
          organizationId,
          pessoaId: dto.clientId,
          orderNumber: nextOrderNumber,
          totalAmount: dto.totalAmount,
          status: 'FINALIZADO',
          observation: dto.notes || `Venda de Metal - Lote ${lot.lotNumber?.value || id}`,
          createdAt: dto.date ? new Date(dto.date) : new Date(),
        },
      });

      // 4. Create SaleItem
      const itemPrice = dto.grams > 0 ? dto.totalAmount / dto.grams : 0;
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: metalProduct.id,
          quantity: dto.grams,
          price: itemPrice,
          costPriceAtSale: 0,
        },
      });

      // 5. Create AccountRec
      await tx.accountRec.create({
        data: {
          organizationId,
          saleId: sale.id,
          description: `Venda de Metal - Lote ${lot.lotNumber?.value || id}`,
          amount: dto.totalAmount,
          dueDate: dto.date ? new Date(dto.date) : new Date(),
        },
      });

      // 6. Create Movement
      await tx.pureMetalLotMovement.create({
        data: {
          organizationId,
          pureMetalLotId: id,
          type: 'EXIT',
          grams: dto.grams,
          date: dto.date ? new Date(dto.date) : new Date(),
          notes: dto.notes || `Venda vinculada ao pedido #${nextOrderNumber}`,
        },
      });

      // 7. Update Lot using Domain Entity methods
      lot.deductGrams(dto.grams);
      lot.linkSale(sale.id);

      const updatedLot = await this.pureMetalLotsRepository.update(lot, tx);

      return PureMetalLotMapper.toResponseDto(updatedLot, { sale });
    });
  }
}
