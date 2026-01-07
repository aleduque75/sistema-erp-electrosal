import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { GetAccountsPayableReportQueryDto } from '../dto/get-accounts-payable-report.dto';

@Injectable()
export class GetAccountsPayableReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAccountsPayableReportQueryDto) {
    const { supplierId, startDate, endDate } = query;

    const where: Prisma.AccountPayWhereInput = {};

    if (supplierId) {
      where.OR = [
        { fornecedorId: supplierId },
        { purchaseOrder: { fornecedorId: supplierId } },
      ];
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) {
        where.dueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.dueDate.lte = new Date(endDate);
      }
    }

    const accountsPayable = await this.prisma.accountPay.findMany({
      where,
      include: {
        transacao: true, // Include related payment
        fornecedor: { // Include direct supplier relation
          include: {
            pessoa: true,
          },
        },
        purchaseOrder: {
          include: {
            fornecedor: {
              include: {
                pessoa: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });


    let runningBalance = 0;
    let totalBilled = 0;
    let totalPaid = 0;

    const reportEntries = accountsPayable.map((ap) => {
      const billedAmount = ap.amount;
      const paidAmount = ap.transacao ? ap.transacao.valor : new Prisma.Decimal(0);
      const entryBalance = billedAmount.sub(paidAmount);
      runningBalance += entryBalance.toNumber();
      totalBilled += billedAmount.toNumber();
      totalPaid += paidAmount.toNumber();

      // Get supplier name from direct relation or from purchase order relation
      const supplierName = ap.fornecedor?.pessoa?.name || ap.purchaseOrder?.fornecedor.pessoa.name;

      return {
        id: ap.id,
        supplierName: supplierName,
        dueDate: ap.dueDate,
        description: ap.description || `Pedido de Compra #${ap.purchaseOrder?.orderNumber}`,
        billedAmount,
        paidAmount,
        balance: entryBalance,
      };
    });

    return {
      entries: reportEntries,
      summary: {
        totalBilled,
        totalPaid,
        finalBalance: totalBilled - totalPaid,
      },
    };
  }
}