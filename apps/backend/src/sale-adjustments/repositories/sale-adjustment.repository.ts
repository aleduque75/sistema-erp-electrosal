import { SaleAdjustmentEntity } from '../entities/sale-adjustment.entity';

export abstract class SaleAdjustmentRepository {
  abstract findBySaleId(
    saleId: string,
    organizationId: string,
  ): Promise<SaleAdjustmentEntity | null>;
  abstract save(adjustment: SaleAdjustmentEntity): Promise<SaleAdjustmentEntity>;
  abstract findSaleWithRelations(
    saleId: string,
    organizationId: string,
  ): Promise<any | null>;
  abstract findAffectedRecs(organizationId: string): Promise<any[]>;
  abstract updateAccountRecContaCorrente(
    id: string,
    contaCorrenteId: string,
  ): Promise<void>;
  abstract findTransactionsMissingContaCorrente(
    organizationId: string,
  ): Promise<any[]>;
  abstract findAccountRecByTransactionId(
    transacaoId: string,
    organizationId: string,
  ): Promise<any | null>;
  abstract updateTransacaoContaCorrente(
    id: string,
    contaCorrenteId: string,
  ): Promise<void>;
}
