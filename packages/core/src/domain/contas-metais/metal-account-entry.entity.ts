import { Entity } from '@shared/domain/entity';
import { UniqueEntityID } from '@shared/domain/unique-entity-id';
import { MetalAccountEntryType } from '../../enums';


export interface MetalAccountEntryProps {
  organizationId: string;
  metalAccountId: string;
  amount: number;
  entryType: MetalAccountEntryType;
  sourceType: string;
  sourceId?: string;
  description?: string;
  entryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class MetalAccountEntry extends Entity<MetalAccountEntryProps> {
  constructor(props: MetalAccountEntryProps, id?: UniqueEntityID) {
    super(props, id);
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get metalAccountId(): string {
    return this.props.metalAccountId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get entryType(): MetalAccountEntryType {
    return this.props.entryType;
  }

  get sourceType(): string {
    return this.props.sourceType;
  }

  get sourceId(): string | undefined {
    return this.props.sourceId;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get entryDate(): Date {
    return this.props.entryDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
