import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface MediaProps {
  organizationId?: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  width?: number;
  height?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Media extends Entity<MediaProps> {
  private constructor(props: MediaProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: MediaProps, id?: UniqueEntityID): Media {
    const media = new Media(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return media;
  }

  get organizationId(): string | undefined {
    return this.props.organizationId;
  }

  get filename(): string {
    return this.props.filename;
  }

  get mimetype(): string {
    return this.props.mimetype;
  }

  get size(): number {
    return this.props.size;
  }

  get path(): string {
    return this.props.path;
  }

  get width(): number | undefined {
    return this.props.width;
  }

  get height(): number | undefined {
    return this.props.height;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<MediaProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
