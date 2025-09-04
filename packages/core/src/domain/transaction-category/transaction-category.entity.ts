import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface TransactionCategoryProps {
  organizationId: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TransactionCategory extends Entity<TransactionCategoryProps> {
  private constructor(props: TransactionCategoryProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: TransactionCategoryProps, id?: UniqueEntityID): TransactionCategory {
    const transactionCategory = new TransactionCategory(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return transactionCategory;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<TransactionCategoryProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
