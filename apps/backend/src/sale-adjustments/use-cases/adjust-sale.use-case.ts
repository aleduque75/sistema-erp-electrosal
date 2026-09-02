import { Injectable, NotFoundException } from '@nestjs/common';
import { SaleAdjustmentRepository } from '../repositories/sale-adjustment.repository';
import { SaleAdjustmentEntity } from '../entities/sale-adjustment.entity';
import { AdjustSaleDto } from '../dtos/sale-adjustment.dto';

@Injectable()
export class AdjustSaleUseCase {
  constructor(private readonly saleAdjustmentRepository: SaleAdjustmentRepository) {}

  async execute(organizationId: string, adjustSaleDto: AdjustSaleDto): Promise<SaleAdjustmentEntity> {
    const { saleId, freightCost, newQuotation } = adjustSaleDto;

    const sale = await this.saleAdjustmentRepository.findSaleWithRelations(saleId, organizationId);
    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    const quotation = newQuotation || (sale.goldQuote ? Number(sale.goldQuote) : null);
    
    // Total recebido das contas a receber baixadas ou valor total da venda
    const receivedBRL = sale.accountsRec?.length
      ? sale.accountsRec.reduce((sum: number, r: any) => sum + (r.received ? Number(r.amount) : 0), 0)
      : Number(sale.totalAmount || 0);

    const expectedGrams = sale.goldValue ? Number(sale.goldValue) : null;
    const freight = freightCost !== undefined ? Number(freightCost) : (sale.freightAmount ? Number(sale.freightAmount) : 0);
    const otherCosts = freight;

    const adjustment = SaleAdjustmentEntity.create({
      saleId,
      organizationId,
      paymentReceivedBRL: receivedBRL,
      paymentQuotation: quotation,
      saleExpectedGrams: expectedGrams,
      otherCostsBRL: otherCosts,
      costsInBRL: otherCosts,
    });

    return this.saleAdjustmentRepository.save(adjustment);
  }
}