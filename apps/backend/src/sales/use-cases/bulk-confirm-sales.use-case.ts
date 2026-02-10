import { Injectable } from '@nestjs/common';
import { ConfirmSaleUseCase } from './confirm-sale.use-case';
import { BulkConfirmSalesDto } from '../dtos/sales.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BulkConfirmSalesUseCase {
  constructor(
    private prisma: PrismaService,
    private confirmSaleUseCase: ConfirmSaleUseCase,
  ) {}

  async execute(organizationId: string, userId: string, bulkConfirmSalesDto: BulkConfirmSalesDto) {
    const { saleIds } = bulkConfirmSalesDto;
    const results: { saleId: string; status: string; message?: string }[] = [];

    for (const saleId of saleIds) {
      try {
        // We need to get the paymentMethod for each sale to pass to confirmSaleUseCase
        const sale = await this.prisma.sale.findUnique({
          where: { id: saleId, organizationId },
          select: { paymentMethod: true },
        });

        if (!sale) {
          results.push({ saleId, status: 'error', message: 'Venda não encontrada.' });
          continue;
        }

        // The DTO for the individual confirmation needs a paymentMethod.
        // For IMPORTADO sales, no other info is needed.
        const confirmSaleDto = {
          paymentMethod: sale.paymentMethod as any, // Cast because the DTO has a stricter enum
        };

        await this.confirmSaleUseCase.execute(organizationId, userId, saleId, confirmSaleDto);
        results.push({ saleId, status: 'success' });
      } catch (error: any) {
        results.push({ saleId, status: 'error', message: error.message });
      }
    }

    return results;
  }
}
