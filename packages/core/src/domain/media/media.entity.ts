import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface MediaProps {
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  width?: number | null;
  height?: number | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  recoveryOrderId?: string; // Adicionado para associar a RecoveryOrder
  analiseQuimicaId?: string; // Adicionado para associar a AnaliseQuimica
  transacaoId?: string; // Adicionado
  chemicalReactionId?: string; // Adicionado para associar a ChemicalReaction
}

export class Media extends Entity<MediaProps> {
  private constructor(props: MediaProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: Omit<MediaProps, 'createdAt' | 'updatedAt'>, id?: UniqueEntityID): Media {
    const now = new Date();
    return new Media(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }

  get filename(): string { return this.props.filename; }
  get mimetype(): string { return this.props.mimetype; }
  get size(): number { return this.props.size; }
  get path(): string { return this.props.path; }
  get width(): number | null | undefined { return this.props.width; }
  get height(): number | null | undefined { return this.props.height; }
  get organizationId(): string | null | undefined { return this.props.organizationId; }
  get recoveryOrderId(): string | null | undefined { return this.props.recoveryOrderId; }
  get analiseQuimicaId(): string | null | undefined { return this.props.analiseQuimicaId; }
  get transacaoId(): string | null | undefined { return this.props.transacaoId; }
  get chemicalReactionId(): string | null | undefined { return this.props.chemicalReactionId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}