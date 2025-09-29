import { AggregateRoot } from '../../_shared/domain/aggregate-root';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';
import { TipoMetal } from '../enums/tipo-metal.enum';
import { MetalAccountEntry } from './metal-account-entry.entity';

export interface MetalAccountProps {
  personId: string;
  type: TipoMetal;
  organizationId: string;
  entries?: MetalAccountEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export class MetalAccount extends AggregateRoot<MetalAccountProps> {
  private constructor(props: MetalAccountProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<MetalAccountProps, 'createdAt' | 'updatedAt' | 'entries'>,
    id?: UniqueEntityID,
  ): MetalAccount {
    const now = new Date();
    const metalAccount = new MetalAccount(
      {
        ...props,
        entries: [],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
    return metalAccount;
  }

  public static reconstitute(props: MetalAccountProps, id: UniqueEntityID): MetalAccount {
    return new MetalAccount(props, id);
  }

  get personId(): string { return this.props.personId; }
  get type(): TipoMetal { return this.props.type; }
  get organizationId(): string { return this.props.organizationId; }
  get entries(): MetalAccountEntry[] { return this.props.entries || []; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public update(dto: Partial<Omit<MetalAccountProps, 'organizationId' | 'type' | 'createdAt' | 'entries'>>) {
    Object.assign(this.props, dto);
    this.props.updatedAt = new Date();
  }
}
