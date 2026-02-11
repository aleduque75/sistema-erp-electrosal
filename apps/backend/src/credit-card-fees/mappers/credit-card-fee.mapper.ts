import { CreditCardFee, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { CreditCardFee as PrismaCreditCardFee, Prisma } from '@prisma/client';

export class CreditCardFeeMapper {
  static toDomain(raw: PrismaCreditCardFee): CreditCardFee {
    return CreditCardFee.create(
      {
        organizationId: raw.organizationId,
        installments: raw.installments,
        feePercentage: raw.feePercentage.toNumber(),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id ? UniqueEntityID.create(raw.id) : undefined,
    );
  }

  static toPersistence(creditCardFee: CreditCardFee): PrismaCreditCardFee {
    return {
      id: creditCardFee.id.toString(),
      organizationId: creditCardFee.organizationId,
      installments: creditCardFee.installments,
      feePercentage: new Prisma.Decimal(creditCardFee.feePercentage),
      createdAt: creditCardFee.createdAt,
      updatedAt: creditCardFee.updatedAt,
    } as PrismaCreditCardFee; // Cast to PrismaCreditCardFee to satisfy type checking
  }
}
