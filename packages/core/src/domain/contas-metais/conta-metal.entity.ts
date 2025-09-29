import { AggregateRoot } from '../../_shared/domain/aggregate-root';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';
import { TipoMetal } from '../enums/tipo-metal.enum';
import { ContaMetalType } from '../enums/conta-metal-type.enum';
import { MetalAccountEntry } from './metal-account-entry.entity';

export interface ContaMetalProps {
  organizationId: string;
  name: string;
  metalType: TipoMetal;
  type: ContaMetalType;
  dataCriacao: Date;
  dataAtualizacao: Date;
  entries?: MetalAccountEntry[];
}

export class ContaMetal extends AggregateRoot<ContaMetalProps> {
  private constructor(props: ContaMetalProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<ContaMetalProps, 'dataCriacao' | 'dataAtualizacao' | 'entries'>,
    id?: UniqueEntityID,
  ): ContaMetal {
    const now = new Date();
    const contaMetal = new ContaMetal(
      {
        ...props,
        entries: [],
        dataCriacao: now,
        dataAtualizacao: now,
      },
      id,
    );
    return contaMetal;
  }

  public static reconstitute(props: ContaMetalProps, id: UniqueEntityID): ContaMetal {
    return new ContaMetal(props, id);
  }

  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get metalType(): TipoMetal { return this.props.metalType; }
  get type(): ContaMetalType { return this.props.type; }
  get dataCriacao(): Date { return this.props.dataCriacao; }
  get dataAtualizacao(): Date { return this.props.dataAtualizacao; }
  get entries(): MetalAccountEntry[] { return this.props.entries || []; }

  public update(dto: Partial<Omit<ContaMetalProps, 'organizationId' | 'metalType' | 'dataCriacao' | 'entries'>>) {
    Object.assign(this.props, dto);
    this.props.dataAtualizacao = new Date();
  }
}
