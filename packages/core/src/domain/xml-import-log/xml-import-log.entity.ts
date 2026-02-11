import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface XmlImportLogProps {
  organizationId: string;
  nfeKey: string;
  createdAt?: Date;
  updatedAt?: Date; // Although not in schema, good practice to include
}

export class XmlImportLog extends Entity<XmlImportLogProps> {
  private constructor(props: XmlImportLogProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: XmlImportLogProps, id?: UniqueEntityID): XmlImportLog {
    const xmlImportLog = new XmlImportLog(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(), // Add updated at for consistency
      },
      id,
    );
    return xmlImportLog;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get nfeKey(): string {
    return this.props.nfeKey;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<XmlImportLogProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
