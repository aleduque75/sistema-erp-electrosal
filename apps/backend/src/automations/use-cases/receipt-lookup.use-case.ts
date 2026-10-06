import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramBotService } from '../services/telegram-bot.service';
import Decimal from 'decimal.js';

@Injectable()
export class ReceiptLookupUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async execute(query: { payer?: string; amount?: number; orderNumber?: number }) {
    const organizationId = this.telegramBotService.getOrganizationId();
    const { payer, amount, orderNumber } = query;

    let saleMatches: any[] = [];

    // 1. If explicit orderNumber is given
    if (orderNumber) {
      const sale = await this.prisma.sale.findFirst({
        where: { orderNumber, organizationId },
        include: { pessoa: true },
      });
      if (sale) {
        saleMatches.push(sale);
      }
    }

    // 2. Search pending / open sales matching payer or amount
    if (saleMatches.length === 0) {
      const orConditions: any[] = [];

      if (payer && payer.trim().length >= 3) {
        orConditions.push({
          pessoa: {
            name: { contains: payer.trim(), mode: 'insensitive' },
          },
        });
      }

      if (amount && amount > 0) {
        const minAmount = new Decimal(amount).times(0.97);
        const maxAmount = new Decimal(amount).times(1.03);
        orConditions.push({
          netAmount: { gte: minAmount, lte: maxAmount },
        });
      }

      const whereClause: any = {
        organizationId,
        status: { in: ['PENDENTE', 'A_SEPARAR', 'SEPARADO'] },
      };

      if (orConditions.length > 0) {
        whereClause.OR = orConditions;
      }

      saleMatches = await this.prisma.sale.findMany({
        where: whereClause,
        include: { pessoa: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    }

    // 3. Search pending AccountRec
    const orRecConditions: any[] = [];
    if (orderNumber) {
      orRecConditions.push({
        sale: { orderNumber },
      });
    }
    if (payer && payer.trim().length >= 3) {
      orRecConditions.push({
        description: { contains: payer.trim(), mode: 'insensitive' },
      });
    }
    if (amount && amount > 0) {
      orRecConditions.push({
        amount: {
          gte: new Decimal(amount).times(0.97),
          lte: new Decimal(amount).times(1.03),
        },
      });
    }

    const pendingAccountRecs = await this.prisma.accountRec.findMany({
      where: {
        organizationId,
        received: false,
        ...(orRecConditions.length > 0 ? { OR: orRecConditions } : {}),
      },
      include: {
        sale: {
          include: {
            pessoa: true,
            metalReceivable: true,
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
        },
      },
      orderBy: { dueDate: 'desc' },
      take: 30,
    });

    // 4. Fetch Bank Accounts (to receive money into)
    const bankAccounts = await this.prisma.contaCorrente.findMany({
      where: {
        organizationId,
        isActive: true,
        type: 'BANCO',
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, numeroConta: true, agencia: true },
    });

    // 5. Fetch Supplier Accounts (to transfer money to)
    const supplierAccounts = await this.prisma.contaCorrente.findMany({
      where: {
        organizationId,
        isActive: true,
        type: 'FORNECEDOR_METAL',
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });

    // 6. Fetch Client Accounts
    const clientAccounts = await this.prisma.contaCorrente.findMany({
      where: {
        organizationId,
        isActive: true,
        type: 'CLIENTE',
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });

    // 7. Fetch Latest Quotations
    const [latestAu, latestAg] = await Promise.all([
      this.prisma.quotation.findFirst({
        where: { organizationId, metal: 'AU' },
        orderBy: { date: 'desc' },
      }),
      this.prisma.quotation.findFirst({
        where: { organizationId, metal: 'AG' },
        orderBy: { date: 'desc' },
      }),
    ]);

    const auPrice = Number(latestAu?.buyPrice || 715);
    const agPrice = Number(latestAg?.buyPrice || 6.5);

    return {
      sales: saleMatches.map((s) => ({
        id: s.id,
        orderNumber: s.orderNumber,
        clientName: s.pessoa?.name || 'Cliente',
        netAmount: Number(s.netAmount || s.totalAmount || 0),
        status: s.status,
        paymentMethod: s.paymentMethod,
        date: s.createdAt,
      })),
      pendingReceivables: pendingAccountRecs.map((ar) => {
        const info = this.telegramBotService.resolveReceivableInfo(ar, auPrice, agPrice);
        return {
          id: ar.id,
          description: ar.description,
          amount: info.pendente,
          metalGrams: info.metalGrams,
          metalUnit: info.metalUnit,
          dueDate: ar.dueDate,
          saleId: ar.saleId,
          orderNumber: ar.sale?.orderNumber,
          clientName: ar.sale?.pessoa?.name,
        };
      }),
      bankAccounts: bankAccounts.map((b) => ({
        id: b.id,
        name: b.nome,
        account: b.numeroConta,
        agency: b.agencia,
      })),
      supplierAccounts: supplierAccounts.map((s) => ({
        id: s.id,
        name: s.nome,
      })),
      clientAccounts: clientAccounts.map((c) => ({
        id: c.id,
        name: c.nome,
      })),
      latestQuotations: {
        au: latestAu
          ? {
              buyPrice: Number(latestAu.buyPrice),
              sellPrice: Number(latestAu.sellPrice),
              date: latestAu.date,
              tipoPagamento: latestAu.tipoPagamento || 'Pix',
            }
          : null,
        ag: latestAg
          ? {
              buyPrice: Number(latestAg.buyPrice),
              sellPrice: Number(latestAg.sellPrice),
              date: latestAg.date,
              tipoPagamento: latestAg.tipoPagamento || 'Pix',
            }
          : null,
      },
    };
  }
}
