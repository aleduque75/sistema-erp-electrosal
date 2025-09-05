import { PaymentTerm } from '@sistema-beleza/core';
import { PaymentTerm as PrismaPaymentTerm } from '@prisma/client';

export class PaymentTermMapper {
  static toDomain(raw: PrismaPaymentTerm): PaymentTerm {
    return PaymentTerm.create(
      {
        organizationId: raw.organizationId,
        name: raw.name,
        description: raw.description ?? undefined,
        installmentsDays: raw.installmentsDays,
        interestRate: raw.interestRate?.toNumber() ?? undefined,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(paymentTerm: PaymentTerm): PrismaPaymentTerm {
    return {
      id: paymentTerm.id.toString(),
      organizationId: paymentTerm.organizationId,
      name: paymentTerm.name,
      description: paymentTerm.description ?? null,
      installmentsDays: paymentTerm.installmentsDays,
      interestRate: paymentTerm.interestRate ?? null,
      createdAt: paymentTerm.createdAt,
      updatedAt: paymentTerm.updatedAt,
      // sales: [], // Sales are handled by Prisma relations, not directly mapped here
    } as PrismaPaymentTerm; // Cast to PrismaPaymentTerm to satisfy type checking
  }
}
