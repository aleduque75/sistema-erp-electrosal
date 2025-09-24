import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface ProductGroupProps {
  organizationId: string;
  name: string;
  description?: string;
  commissionPercentage?: number | null;
  isReactionProductGroup: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductGroup extends Entity<ProductGroupProps> {
  private constructor(props: ProductGroupProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: ProductGroupProps, id?: UniqueEntityID): ProductGroup {
    const productGroup = new ProductGroup(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return productGroup;
  }

  get id(): UniqueEntityID {
    return this._id;
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

  get commissionPercentage(): number | null | undefined {
    return this.props.commissionPercentage;
  }

  get isReactionProductGroup(): boolean {
    return this.props.isReactionProductGroup;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  toJSON() {
    return {
      id: this.id.toString(),
      name: this.name,
      description: this.description,
      commissionPercentage: this.commissionPercentage,
      isReactionProductGroup: this.isReactionProductGroup,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      organizationId: this.organizationId,
    }
  }
}
