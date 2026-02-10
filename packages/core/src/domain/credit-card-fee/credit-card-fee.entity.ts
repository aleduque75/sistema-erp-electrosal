import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface CreditCardFeeProps {
  organizationId: string;
  installments: number;
  feePercentage: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CreditCardFee extends Entity<CreditCardFeeProps> {
  private constructor(props: CreditCardFeeProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: CreditCardFeeProps, id?: UniqueEntityID): CreditCardFee {
    const creditCardFee = new CreditCardFee(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return creditCardFee;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get installments(): number {
    return this.props.installments;
  }

  get feePercentage(): number {
    return this.props.feePercentage;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<CreditCardFeeProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
