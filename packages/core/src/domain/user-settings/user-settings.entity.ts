import { Entity } from '../../_shared/domain/entity';
import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';

export interface UserSettingsProps {
  userId: string;
  defaultReceitaContaId?: string;
  defaultCaixaContaId?: string;
  defaultDespesaContaId?: string;
  createdAt?: Date; // Not in schema, but good practice
  updatedAt?: Date; // Not in schema, but good practice
}

export class UserSettings extends Entity<UserSettingsProps> {
  private constructor(props: UserSettingsProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: UserSettingsProps, id?: UniqueEntityID): UserSettings {
    const userSettings = new UserSettings(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return userSettings;
  }

  get userId(): string {
    return this.props.userId;
  }

  get defaultReceitaContaId(): string | undefined {
    return this.props.defaultReceitaContaId;
  }

  get defaultCaixaContaId(): string | undefined {
    return this.props.defaultCaixaContaId;
  }

  get defaultDespesaContaId(): string | undefined {
    return this.props.defaultDespesaContaId;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(props: Partial<UserSettingsProps>) {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
}
