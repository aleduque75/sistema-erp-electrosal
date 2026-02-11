import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface PaymentTermProps {
  organizationId: string;
  name: string;
  description?: string;
  installmentsDays: number[];
  interestRate?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentTerm extends Entity<PaymentTermProps> {
  private constructor(props: PaymentTermProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: PaymentTermProps, id?: UniqueEntityID): PaymentTerm {
    const paymentTerm = new PaymentTerm(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return paymentTerm;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get installmentsDays(): number[] {
    return this.props.installmentsDays;
  }

  get interestRate(): number | undefined {
    return this.props.interestRate;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  // You can add setters or business methods here if needed
  update(props: Partial<PaymentTermProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
