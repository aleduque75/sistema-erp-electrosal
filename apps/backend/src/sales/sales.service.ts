import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { Sale, SaleInstallmentStatus, TipoTransacaoPrisma, Prisma } from '@prisma/client'; // Keep Sale for now, will refactor later
import { addMonths, addDays } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case'; // Added
import { StockMovement, SaleItem } from '@sistema-beleza/core'; // Added SaleItem
import { StockMovementMapper } from '../products/mappers/stock-movement.mapper'; // Added
import { SaleItemMapper } from './mappers/sale-item.mapper'; // Added

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private createSaleUseCase: CreateSaleUseCase, // Injected
  ) {}

  async create(
    organizationId: string,
    userId: string, // Added userId
    createSaleDto: CreateSaleDto,
  ): Promise<Sale> {
    return this.createSaleUseCase.execute(organizationId, userId, createSaleDto);
  }

  // Recebe organizationId
  async findAll(organizationId: string, limit?: number): Promise<Sale[]> {
    const prismaSales = await this.prisma.sale.findMany({
      where: { organizationId }, // Usa no 'where'
      include: {
        pessoa: true, // Inclui o nome do cliente na listagem
        saleItems: {
          include: {
            product: true, // Inclui detalhes do produto em cada item
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
    // Map SaleItems to DDD entities
    return prismaSales.map(sale => ({
      ...sale,
      saleItems: sale.saleItems.map(SaleItemMapper.toDomain),
    })) as any;
  }

  // Recebe organizationId
  async findOne(organizationId: string, id: string): Promise<Sale> {
    const prismaSale = await this.prisma.sale.findFirst({
      where: { id, organizationId },
      include: {
        pessoa: true, // Inclui os dados do cliente
        saleItems: {
          // Inclui os itens da venda
          include: {
            product: true, // Para cada item, inclui os dados do produto
          },
        },
      },
    });

    if (!prismaSale) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }
    // Map SaleItems to DDD entities
    return {
      ...prismaSale,
      saleItems: prismaSale.saleItems.map(SaleItemMapper.toDomain),
    } as any;
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
      include: { saleItems: true }, // Inclui saleItems para restaurar o estoque
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Restaurar estoque dos produtos
      for (const item of sale.saleItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        // Create StockMovement record
        const stockMovement = StockMovement.create({
          productId: item.productId,
          type: 'ENTRY', // Assuming it's an entry when restoring stock
          quantity: item.quantity,
        });
        await prisma.stockMovement.create({
          data: StockMovementMapper.toPersistence(stockMovement),
        });
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
}
