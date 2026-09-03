import { Prisma } from '@prisma/client';
import { AccountPayEntity } from '../entities/account-pay.entity';

export class AccountPayMapper {
  static toDomain(raw: any): AccountPayEntity {
    return AccountPayEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      description: raw.description,
      amount: raw.amount,
      dueDate: raw.dueDate,
      paid: raw.paid,
      paidAt: raw.paidAt,
      installmentNumber: raw.installmentNumber,
      isInstallment: raw.isInstallment,
      totalInstallments: raw.totalInstallments,
      contaContabilId: raw.contaContabilId,
      fornecedorId: raw.fornecedorId,
      purchaseOrderId: raw.purchaseOrderId,
      originalAccountId: raw.originalAccountId,
      transacaoId: raw.transacaoId,
      goldAmount: raw.goldAmount,
      goldPrice: raw.goldPrice,
      recoveryReportPeriod: raw.recoveryReportPeriod,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: AccountPayEntity): Prisma.AccountPayUncheckedCreateInput {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      description: entity.description,
      amount: entity.amount,
      dueDate: entity.dueDate,
      paid: entity.paid,
      paidAt: entity.paidAt,
      installmentNumber: entity.installmentNumber,
      isInstallment: entity.isInstallment,
      totalInstallments: entity.totalInstallments,
      contaContabilId: entity.contaContabilId,
      fornecedorId: entity.fornecedorId,
      purchaseOrderId: entity.purchaseOrderId,
      originalAccountId: entity.originalAccountId,
      transacaoId: entity.transacaoId,
      goldAmount: entity.goldAmount,
      goldPrice: entity.goldPrice,
      recoveryReportPeriod: entity.recoveryReportPeriod,
    };
  }

  static toResponseDto(entity: AccountPayEntity, extra?: any): any {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      description: entity.description,
      amount: entity.amountNumber,
      dueDate: entity.dueDate,
      paid: entity.paid,
      paidAt: entity.paidAt,
      installmentNumber: entity.installmentNumber,
      isInstallment: entity.isInstallment,
      totalInstallments: entity.totalInstallments,
      contaContabilId: entity.contaContabilId,
      fornecedorId: entity.fornecedorId,
      purchaseOrderId: entity.purchaseOrderId,
      originalAccountId: entity.originalAccountId,
      transacaoId: entity.transacaoId,
      goldAmount: entity.goldAmount ? entity.goldAmount.toNumber() : null,
      goldPrice: entity.goldPrice ? entity.goldPrice.toNumber() : null,
      recoveryReportPeriod: entity.recoveryReportPeriod,
      contaContabil: extra?.contaContabil,
      fornecedor: extra?.fornecedor,
      transacao: extra?.transacao,
      purchaseOrder: extra?.purchaseOrder,
      splitAccounts: extra?.splitAccounts,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
