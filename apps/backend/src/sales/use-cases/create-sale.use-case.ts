// Em: apps/backend/src/sales/use-cases/create-sale.use-case.ts

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Sale,
  ISaleRepository,
  SaleItem,
  SaleInstallment,
  SaleInstallmentStatus,
} from '@sistema-beleza/core';
import { CreateSaleDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { addMonths, addDays } from 'date-fns'; // <-- Adicionado 'addDays'

@Injectable()
export class CreateSaleUseCase {
  constructor(
    @Inject('ISaleRepository')
    private saleRepo: ISaleRepository,
    private prisma: PrismaService,
  ) {}

  async execute(userId: string, createSaleDto: CreateSaleDto) {
    const {
      clientId,
      items,
      paymentMethod,
      installmentsCount,
      feeAmount,
      contaCorrenteId,
    } = createSaleDto;

    // Busca o cliente e as configurações do usuário em paralelo para otimizar
    const [client, settings] = await Promise.all([
      this.prisma.client.findFirst({ where: { id: clientId, userId } }),
      this.prisma.userSettings.findUnique({ where: { userId } }),
    ]);

    // Validações essenciais antes de prosseguir
    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado ou não pertence a este usuário.',
      );
    }
    if (!settings?.defaultReceitaContaId) {
      throw new BadRequestException(
        'Nenhuma conta de receita padrão foi configurada para este usuário.',
      );
    }
    if (paymentMethod === 'A_VISTA' && !contaCorrenteId) {
      throw new BadRequestException(
        'Para vendas à vista, a conta corrente de destino é obrigatória.',
      );
    }

    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({
      where: { id: { in: productIds }, userId },
    });

    if (productsInDb.length !== productIds.length) {
      throw new NotFoundException(
        'Um ou mais produtos não foram encontrados no seu catálogo.',
      );
    }

    let totalAmount = 0;
    const saleItems = items.map((item) => {
      const product = productsInDb.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundException(
          `Produto com ID ${item.productId} não encontrado.`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto "${product.name}". Em estoque: ${product.stock}.`,
        );
      }
      totalAmount += product.price.toNumber() * item.quantity;
      return SaleItem.create({
        productId: product.id,
        quantity: item.quantity,
        price: product.price.toNumber(),
      });
    });

    const finalFeeAmount = feeAmount || 0;
    const netAmount = totalAmount + finalFeeAmount;

    // Cria a entidade principal de Venda
    const newSale = Sale.create({
      userId,
      clientId,
      orderNumber: `VENDA-${Date.now()}`,
      totalAmount,
      feeAmount: finalFeeAmount,
      netAmount,
      items: saleItems,
      installments: [], // Começa com array vazio, será populado abaixo
      paymentMethod,
      contaContabilId: settings.defaultReceitaContaId,
      contaCorrenteId: contaCorrenteId || undefined,
    });

    // Cria as parcelas apenas se o método de pagamento for 'A Prazo'
    const installments: SaleInstallment[] = [];
    const finalInstallmentsCount = installmentsCount || 0;
    if (paymentMethod === 'A_PRAZO' && finalInstallmentsCount > 0) {
      const installmentValue = netAmount / finalInstallmentsCount;
      for (let i = 1; i <= finalInstallmentsCount; i++) {
        installments.push(
          SaleInstallment.create({
            saleId: newSale.id,
            installmentNumber: i,
            amount: installmentValue,
            dueDate: addMonths(new Date(), i),
            status: SaleInstallmentStatus.PENDING,
          }),
        );
      }
      newSale.props.installments = installments;
    }

    // Executa a criação da venda e a lógica financeira em uma transação
    await this.prisma.$transaction(async (tx) => {
      // 1. Cria a venda, itens e parcelas (se houver) no banco de dados
      await this.saleRepo.create(newSale, tx);

      // 2. Atualiza o estoque de cada produto vendido
      for (const item of newSale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // --- 3. LÓGICA FINANCEIRA ADICIONAL PARA CADA FORMA DE PAGAMENTO ---

      // Se for À VISTA, cria uma transação de CRÉDITO direto na conta corrente
      if (newSale.props.paymentMethod === 'A_VISTA') {
        await tx.transacao.create({
          data: {
            userId,
            tipo: 'CREDITO',
            valor: newSale.props.netAmount,
            moeda: 'BRL',
            descricao: `Recebimento da Venda #${newSale.props.orderNumber}`,
            contaContabilId: newSale.props.contaContabilId,
            contaCorrenteId: newSale.props.contaCorrenteId!, // A validação no início do método garante que não será nulo
          },
        });
      }

      // Se for CARTÃO DE CRÉDITO, cria um único Contas a Receber para D+30 dias
      if (newSale.props.paymentMethod === 'CREDIT_CARD') {
        await tx.accountRec.create({
          data: {
            userId,
            saleId: newSale.id,
            description: `Recebimento Cartão - Venda #${newSale.props.orderNumber}`,
            amount: newSale.props.netAmount,
            dueDate: addDays(new Date(), 30), // Data de recebimento padrão de 30 dias
            received: false,
          },
        });
      }
      // A lógica para 'A_PRAZO' já é tratada pelo `saleRepo.create` que persiste o array de `installments`.
    });

    return newSale;
  }
}
