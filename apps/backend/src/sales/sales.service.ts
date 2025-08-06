import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { Sale, SaleInstallmentStatus, TipoTransacaoPrisma, Prisma } from '@prisma/client';
import { addMonths, addDays } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, data: CreateSaleDto): Promise<Sale> {
    const { items, feeAmount, paymentMethod, numberOfInstallments, clientId, contaCorrenteId, paymentTermId } = data;

    const organizationSettings = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { absorbCreditCardFee: true, creditCardReceiveDays: true },
    });

    const creditCardReceiveDays = organizationSettings?.creditCardReceiveDays || 30;

    let totalAmount = new Decimal(0);
    const saleItemsData: Prisma.SaleItemCreateManySaleInput[] = [];
    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId, organizationId } });
      if (!product || product.stock < item.quantity) {
        throw new NotFoundException(`Produto ${product?.name || item.productId} sem estoque suficiente.`);
      }
      totalAmount = totalAmount.add(new Decimal(item.price).mul(item.quantity));
      saleItemsData.push({ productId: item.productId, quantity: item.quantity, price: item.price });
    }

    let finalSaleAmount = totalAmount;
    let finalReceivableAmount = totalAmount;
    const feeAmountDecimal = new Decimal(feeAmount || 0);

    if (paymentMethod === 'A_PRAZO' && paymentTermId) {
      const paymentTerm = await this.prisma.paymentTerm.findUnique({ where: { id: paymentTermId } });
      if (paymentTerm?.interestRate?.isFinite() && paymentTerm.interestRate.greaterThan(0)) {
        const interest = totalAmount.mul(paymentTerm.interestRate.div(100));
        finalSaleAmount = totalAmount.add(interest);
        finalReceivableAmount = finalSaleAmount;
      }
    } else if (paymentMethod === 'CREDIT_CARD') {
      if (organizationSettings?.absorbCreditCardFee) { // Empresa absorve
        finalSaleAmount = totalAmount;
        finalReceivableAmount = totalAmount.sub(feeAmountDecimal);
      } else { // Cliente paga a taxa
        finalSaleAmount = totalAmount.add(feeAmountDecimal);
        finalReceivableAmount = finalSaleAmount;
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const sale = await prisma.sale.create({
        data: {
          organization: { connect: { id: organizationId } },
          client: { connect: { id: clientId } },
          orderNumber: `VENDA-${Date.now()}`,
          totalAmount: totalAmount,
          feeAmount: feeAmountDecimal,
          netAmount: finalSaleAmount,
          paymentMethod: paymentMethod,
          paymentTerm: paymentTermId ? { connect: { id: paymentTermId } } : undefined,
          saleItems: { createMany: { data: saleItemsData } },
        },
      });

      for (const item of items) {
        await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }

      if (paymentMethod === 'A_VISTA') {
        if (!contaCorrenteId) {
          throw new BadRequestException('Para vendas à vista, a conta corrente é obrigatória.');
        }
        const createdTransaction = await prisma.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO,
            valor: finalReceivableAmount,
            moeda: 'BRL',
            descricao: `Recebimento Venda ${sale.orderNumber}`,
            dataHora: sale.createdAt,
            contaContabilId: (await prisma.contaContabil.findFirstOrThrow({ where: { organizationId, codigo: '1.1.1' } })).id,
            contaCorrenteId: contaCorrenteId,
          },
        });

        await prisma.accountRec.create({
          data: {
            organizationId,
            saleId: sale.id,
            description: `Venda à Vista ${sale.orderNumber}`,
            amount: finalReceivableAmount,
            dueDate: new Date(),
            received: true,
            receivedAt: new Date(),
            contaCorrenteId: contaCorrenteId,
            transacaoId: createdTransaction.id,
          },
        });
      } else if (paymentMethod === 'A_PRAZO') {
        const paymentTerm = await prisma.paymentTerm.findUnique({ where: { id: paymentTermId! } });
        const numInstallments = paymentTerm!.installmentsDays.length;
        const installmentAmount = finalReceivableAmount.div(numInstallments);

        for (let i = 0; i < numInstallments; i++) {
          await prisma.accountRec.create({
            data: {
              organizationId,
              saleId: sale.id,
              description: `Venda ${sale.orderNumber} - Parcela ${i + 1}/${numInstallments}`,
              amount: installmentAmount,
              dueDate: addDays(new Date(), paymentTerm!.installmentsDays[i]),
              received: false,
            },
          });
        }
      } else if (paymentMethod === 'CREDIT_CARD') {
        await prisma.accountRec.create({
          data: {
            organizationId,
            saleId: sale.id,
            description: `Recebimento Cartão de Crédito - Venda ${sale.orderNumber}`,
            amount: finalReceivableAmount,
            dueDate: addDays(new Date(), creditCardReceiveDays),
            received: false,
          },
        });
      }

      return sale;
    });
  }

  // Recebe organizationId
  async findAll(organizationId: string, limit?: number): Promise<Sale[]> {
    return this.prisma.sale.findMany({
      where: { organizationId }, // Usa no 'where'
      include: {
        client: true, // Inclui o nome do cliente na listagem
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
  }

  // Recebe organizationId
  async findOne(organizationId: string, id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, organizationId },
      include: {
        client: true, // Inclui os dados do cliente
        saleItems: {
          // Inclui os itens da venda
          include: {
            product: true, // Para cada item, inclui os dados do produto
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }
    return sale;
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

  // Recebe organizationId
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
