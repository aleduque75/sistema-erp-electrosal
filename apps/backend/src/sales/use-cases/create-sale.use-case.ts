import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { addMonths, addDays } from 'date-fns';
import { TipoTransacaoPrisma, Prisma } from '@prisma/client'; // <-- 1. Importe o 'Prisma'
import { SettingsService } from '../../settings/settings.service'; // Added

@Injectable()
export class CreateSaleUseCase {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService, // Injected
  ) {}

  async execute(organizationId: string, userId: string, createSaleDto: CreateSaleDto) {
    console.log('Dados recebidos no CreateSaleUseCase:', createSaleDto);

    const {
      clientId,
      items,
      paymentMethod,
      numberOfInstallments, // Nome corrigido
      feeAmount,
      contaCorrenteId,
    } = createSaleDto;

    const [client, settings] = await Promise.all([
      this.prisma.client.findFirst({ where: { id: clientId, organizationId } }),
      this.settingsService.findOne(userId), // Used SettingsService
    ]);

    if (!client) throw new NotFoundException('Cliente não encontrado.');
    if (!settings?.defaultReceitaContaId)
      throw new BadRequestException(
        'Nenhuma conta de receita padrão foi configurada.',
      );

    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId },
    });

    let totalAmount = 0;
    const saleItemsData = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto "${product?.name}".`,
        );
      }
      totalAmount += product.price.toNumber() * item.quantity;
      return {
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const finalFeeAmount = feeAmount || 0;
    const netAmount = totalAmount + finalFeeAmount;

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          organizationId,
          clientId,
          orderNumber: `VENDA-${Date.now()}`,
          totalAmount,
          feeAmount: finalFeeAmount,
          netAmount,
          paymentMethod,
          saleItems: { create: saleItemsData },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (paymentMethod === 'A_VISTA') {
        if (!contaCorrenteId)
          throw new BadRequestException(
            'Conta de destino é obrigatória para vendas à vista.',
          );
        await tx.transacao.create({
          data: {
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO,
            valor: netAmount,
            moeda: 'BRL',
            descricao: `Recebimento da Venda #${sale.orderNumber}`,
            contaContabilId: settings.defaultReceitaContaId!,
            contaCorrenteId: contaCorrenteId,
            dataHora: new Date(),
          },
        });
      } else if (paymentMethod === 'CREDIT_CARD') {
        await tx.accountRec.create({
          data: {
            organizationId,
            saleId: sale.id,
            description: `Recebimento Cartão - Venda #${sale.orderNumber}`,
            amount: netAmount,
            dueDate: addDays(new Date(), 30),
          },
        });
      } else if (paymentMethod === 'A_PRAZO') {
        const finalInstallmentsCount =
          numberOfInstallments && numberOfInstallments > 0
            ? numberOfInstallments
            : 1;

        const installmentValue = netAmount / finalInstallmentsCount;

        // 👇 2. CORREÇÃO: Defina o tipo do array aqui
        const accountRecsToCreate: Prisma.AccountRecCreateManyInput[] = [];

        for (let i = 1; i <= finalInstallmentsCount; i++) {
          accountRecsToCreate.push({
            organizationId,
            saleId: sale.id,
            description: `Parcela ${i}/${finalInstallmentsCount} da Venda #${sale.orderNumber}`,
            amount: installmentValue,
            dueDate: addMonths(new Date(), i),
          });
        }

        if (accountRecsToCreate.length > 0) {
          await tx.accountRec.createMany({ data: accountRecsToCreate });
        }
      }

      return sale;
    });
  }
}
