import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleInstallmentStatus } from '@prisma/client';

@Injectable()
export class BackfillInstallmentsUseCase {
  private readonly logger = new Logger(BackfillInstallmentsUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string) {
    this.logger.log('Starting backfill for missing installments (v2)...');

    const salesToProcess = await this.prisma.sale.findMany({
      where: {
        organizationId,
        paymentMethod: 'IMPORTADO',
      },
      include: {
        accountsRec: {
          orderBy: {
            dueDate: 'asc',
          },
        },
        installments: true,
      },
    });

    this.logger.log(`Found ${salesToProcess.length} A_PRAZO sales to check.`);
    let createdCount = 0;
    let alreadyOkCount = 0;

    for (const sale of salesToProcess) {
      if (sale.accountsRec.length > 0 && sale.installments.length === 0) {
        this.logger.log(
          `Processing sale ${sale.orderNumber}, which has ${sale.accountsRec.length} receivables but no installments.`,
        );

        for (let i = 0; i < sale.accountsRec.length; i++) {
          const ar = sale.accountsRec[i];

          await this.prisma.saleInstallment.create({
            data: {
              saleId: sale.id,
              installmentNumber: i + 1,
              amount: ar.amount,
              dueDate: ar.dueDate,
              status: ar.received
                ? SaleInstallmentStatus.PAID
                : SaleInstallmentStatus.PENDING,
              paidAt: ar.receivedAt,
              accountRecId: ar.id, // Create the link
            },
          });
          createdCount++;
        }
      } else {
        alreadyOkCount++;
      }
    }

    this.logger.log('Backfill complete.');
    return {
      message: `Processo concluído. ${createdCount} parcelas criadas. ${alreadyOkCount} vendas já estavam corretas ou não precisavam de ação.`,
      createdCount,
    };
  }
}
