import { Prisma } from '@prisma/client';
import { AccountRecEntity } from '../entities/account-rec.entity';

export class AccountRecMapper {
  static toDomain(raw: any): AccountRecEntity {
    return AccountRecEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      saleId: raw.saleId,
      description: raw.description,
      amount: raw.amount,
      dueDate: raw.dueDate,
      received: raw.received,
      receivedAt: raw.receivedAt,
      contaCorrenteId: raw.contaCorrenteId,
      transacaoId_old: raw.transacaoId_old,
      externalId: raw.externalId,
      amountPaid: raw.amountPaid,
      goldAmount: raw.goldAmount,
      goldAmountPaid: raw.goldAmountPaid,
      doNotUpdateSaleStatus: raw.doNotUpdateSaleStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: AccountRecEntity): Prisma.AccountRecUncheckedCreateInput {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      saleId: entity.saleId,
      description: entity.description,
      amount: entity.amount,
      dueDate: entity.dueDate,
      received: entity.received,
      receivedAt: entity.receivedAt,
      contaCorrenteId: entity.contaCorrenteId,
      transacaoId_old: entity.transacaoId_old,
      externalId: entity.externalId,
      amountPaid: entity.amountPaid,
      goldAmount: entity.goldAmount,
      goldAmountPaid: entity.goldAmountPaid,
      doNotUpdateSaleStatus: entity.doNotUpdateSaleStatus,
    };
  }

  static toResponseDto(entity: AccountRecEntity, extra?: any): any {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      saleId: entity.saleId,
      description: entity.description,
      amount: entity.amountNumber,
      dueDate: entity.dueDate,
      received: entity.received,
      receivedAt: entity.receivedAt,
      contaCorrenteId: entity.contaCorrenteId,
      externalId: entity.externalId,
      amountPaid: entity.amountPaidNumber,
      goldAmount: entity.goldAmount ? entity.goldAmount.toNumber() : null,
      goldAmountPaid: entity.goldAmountPaid ? entity.goldAmountPaid.toNumber() : 0,
      doNotUpdateSaleStatus: entity.doNotUpdateSaleStatus,
      clientId: extra?.clientId || entity.saleId ? extra?.sale?.pessoa?.client?.pessoaId : null,
      sale: extra?.sale,
      transacoes: extra?.transacoes || [],
      saleInstallments: extra?.saleInstallments || [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
