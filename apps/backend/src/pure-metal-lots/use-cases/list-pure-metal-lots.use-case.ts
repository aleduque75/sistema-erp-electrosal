import { Injectable } from '@nestjs/common';
import { PureMetalLotsRepository } from '../repositories/pure-metal-lot.repository';
import { TipoMetal } from '@prisma/client';
import { PureMetalLotMapper } from '../mappers/pure-metal-lot.mapper';

@Injectable()
export class ListPureMetalLotsUseCase {
  constructor(private readonly pureMetalLotsRepository: PureMetalLotsRepository) {}

  async execute(organizationId: string, metalType?: TipoMetal, remainingGramsGt?: number) {
    const lotRecords = await this.pureMetalLotsRepository.findAll(organizationId, {
      metalType,
      remainingGramsGt,
    });

    const lotsWithOriginDetails = await Promise.all(
      lotRecords.map(async ({ lot, sale, chemicalReactions }) => {
        let originDetails: { name?: string; orderNumber?: string } = {};

        if (lot.sourceType === 'RECOVERY_ORDER' && lot.sourceId) {
          const recoveryOrder = await this.pureMetalLotsRepository.findRecoveryOrderOrigin(
            lot.sourceId,
            organizationId,
          );
          if (recoveryOrder) {
            originDetails.orderNumber = recoveryOrder.orderNumber;
            if (recoveryOrder.observacoes) {
              originDetails.name = recoveryOrder.observacoes;
            }
          }
        } else if (
          (lot.sourceType === 'SALE_PAYMENT' ||
            lot.sourceType === 'LEGACY_SALE_CORRECTION' ||
            lot.sourceType === 'PAGAMENTO_PEDIDO_CLIENTE') &&
          sale?.pessoa?.name
        ) {
          originDetails.name = sale.pessoa.name;
          originDetails.orderNumber = String(sale.orderNumber);
        } else if (lot.sourceType === 'METAL_CREDIT' && lot.sourceId) {
          const metalCredit = await this.pureMetalLotsRepository.findMetalCreditOrigin(
            lot.sourceId,
            organizationId,
          );
          if (metalCredit?.clientName) {
            originDetails.name = metalCredit.clientName;
          }
        } else if (lot.sourceType === 'CHEMICAL_REACTION' && chemicalReactions && chemicalReactions.length > 0) {
          const reaction = chemicalReactions[0].chemicalReaction;
          if (reaction) {
            originDetails.orderNumber = reaction.reactionNumber;
            if (reaction.notes) {
              originDetails.name = reaction.notes;
            }
          }
        } else if (lot.sourceType === 'SUPPLIER_ACCOUNT_TRANSFER') {
          const supplierMatch = lot.notes?.match(/Conta Fornecedor\s+([^:]+)/i);
          if (supplierMatch && supplierMatch[1]) {
            originDetails.name = supplierMatch[1].trim();
          }
        }

        // Fallback for partner/client from notes or description if not populated
        if (!originDetails.name) {
          const combined = `${lot.description || ''} ${lot.notes || ''}`;
          const clientMatch = combined.match(/Cliente:\s*([^\n\r,-]+)/i);
          if (clientMatch && clientMatch[1]) {
            originDetails.name = clientMatch[1].trim();
          } else {
            const supplierMatch = combined.match(/Conta Fornecedor\s+([^:\n\r-]+)/i);
            if (supplierMatch && supplierMatch[1]) {
              originDetails.name = supplierMatch[1].trim();
            }
          }
        }

        // Fallback for orderNumber from notes or description if not populated
        if (!originDetails.orderNumber) {
          const combined = `${lot.description || ''} ${lot.notes || ''}`;
          const orderMatch = combined.match(/(?:Venda|Pedido)\s*#(\d+)/i);
          if (orderMatch && orderMatch[1]) {
            originDetails.orderNumber = orderMatch[1].trim();
          }
        }

        return PureMetalLotMapper.toResponseDto(lot, {
          sale,
          originDetails,
          chemicalReactions,
        });
      }),
    );

    return lotsWithOriginDetails;
  }
}
