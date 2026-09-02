import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';
import { CalculateSaleAdjustmentUseCase } from './calculate-sale-adjustment.use-case';

@Injectable()
export class BackfillSaleAdjustmentsUseCase {
  private readonly logger = new Logger(BackfillSaleAdjustmentsUseCase.name);

  constructor(
    private prisma: PrismaService,
    private calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(organizationId: string): Promise<{ message: string; processedCount: number }> {
    this.logger.log('Iniciando backfill de ajustes de vendas...');
    const salesToProcess = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: SaleStatus.FINALIZADO,
      },
      include: {
        accountsRec: {
          include: {
            transacoes: true,
          },
        },
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
    });

    this.logger.log(`${salesToProcess.length} vendas finalizadas encontradas para processar.`);

    let processedCount = 0;
    for (const [index, sale] of salesToProcess.entries()) {
      this.logger.log(`Processando venda ${index + 1} de ${salesToProcess.length} (ID: ${sale.id})...`);
      try {
        await this.calculateSaleAdjustmentUseCase.execute(sale.id, organizationId);
        processedCount++;
      } catch (error) {
        this.logger.error(`Falha ao processar o ajuste para a venda ${sale.id}:`, error);
      }
    }

    this.logger.log('Backfill de ajustes de vendas concluído.');
    return {
      message: `${processedCount} de ${salesToProcess.length} vendas finalizadas foram processadas para ajuste.`,
      processedCount,
    };
  }
}
