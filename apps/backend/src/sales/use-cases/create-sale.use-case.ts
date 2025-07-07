import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Sale, SaleItem, ISaleRepository } from '@sistema-beleza/core';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { addMonths } from 'date-fns';

@Injectable()
export class CreateSaleUseCase {
  constructor(
    @Inject('ISaleRepository') private readonly saleRepo: ISaleRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, createSaleDto: CreateSaleDto): Promise<Sale> {
    // ✅ O contaContabilId não vem mais do DTO
    const {
      clientId,
      items,
      paymentMethod,
      contaCorrenteId,
      numberOfInstallments,
    } = createSaleDto;

    // --- ETAPA 1: VALIDAÇÕES E BUSCA DE DADOS ---

    // ✅ Busca o cliente e as configurações do usuário em paralelo
    const [client, settings] = await Promise.all([
      this.prisma.client.findFirst({ where: { id: clientId, userId } }),
      this.prisma.userSettings.findUnique({ where: { userId } }),
    ]);

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    // ✅ Valida se a conta de receita padrão foi configurada
    if (!settings?.defaultReceitaContaId) {
      throw new BadRequestException(
        "Nenhuma conta 'Receita de Vendas Padrão' foi definida nas Configurações. Por favor, configure uma antes de criar uma venda.",
      );
    }

    // ... (Validação de produtos e estoque não muda)
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({
      where: { id: { in: productIds }, userId },
    });
    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException('Um ou mais produtos não foram encontrados.');
    }
    for (const item of items) {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(
          `Produto com ID ${item.productId} é inválido.`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${product.name}.`,
        );
      }
    }

    // --- ETAPA 2: CRIAÇÃO DAS ENTIDADES DE DOMÍNIO ---

    // Recalcula o preço total no backend
    const totalAmount = items.reduce((sum, item) => {
      const product = productsInDb.find((p) => p.id === item.productId)!;
      return sum + product.price.toNumber() * item.quantity;
    }, 0);

    const saleItems = items.map((dto) => {
      const product = productsInDb.find((p) => p.id === dto.productId)!;
      return SaleItem.create({
        productId: dto.productId,
        quantity: dto.quantity,
        price: product.price.toNumber(),
      });
    });

    // ✅ A conta contábil agora vem das configurações salvas do usuário
    const newSale = Sale.create({
      userId,
      clientId,
      items: saleItems,
      paymentMethod,
      contaContabilId: settings.defaultReceitaContaId, // <-- MUDANÇA PRINCIPAL
      contaCorrenteId,
      totalAmount: totalAmount,
    });

    // --- ETAPA 3: PERSISTÊNCIA EM TRANSAÇÃO ---
    await this.prisma.$transaction(async (tx) => {
      await this.saleRepo.create(newSale, tx);

      for (const item of newSale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await this.createFinancialEntries(
        tx,
        newSale,
        client.name,
        numberOfInstallments,
      );
    });

    return newSale;
  }

  /**
   * ✅ Lógica financeira mais completa e robusta
   */
  private async createFinancialEntries(
    tx: Prisma.TransactionClient,
    sale: Sale,
    clientName: string,
    numberOfInstallments = 1, // Default para 1 parcela se não for informado
  ) {
    if (sale.paymentMethod === 'A Prazo' && numberOfInstallments > 0) {
      // Lógica para parcelamento
      const installmentAmount = sale.totalAmount / numberOfInstallments;

      for (let i = 1; i <= numberOfInstallments; i++) {
        await tx.accountRec.create({
          data: {
            userId: sale.userId,
            description: `Venda #${sale.orderNumber} - Parc. ${i}/${numberOfInstallments} - ${clientName}`,
            amount: new Prisma.Decimal(installmentAmount.toFixed(2)),
            dueDate: addMonths(new Date(), i), // Vencimento para os próximos meses
            received: false,
            saleId: sale.id,
          },
        });
      }
    } else {
      // Lógica para "À Vista", "Cartão de Crédito", etc. (Gera uma única conta a receber)
      if (sale.netAmount === undefined) {
        throw new BadRequestException(
          'Valor líquido da venda não foi calculado.',
        );
      }
      await tx.accountRec.create({
        data: {
          userId: sale.userId,
          description: `Recebimento Venda #${sale.orderNumber} - ${clientName}`,
          amount: new Prisma.Decimal(sale.netAmount.toFixed(2)),
          dueDate: new Date(), // Vencimento imediato ou conforme regra da operadora
          received: false,
          saleId: sale.id,
        },
      });
    }
  }
}
