import { randomUUID } from 'crypto';

export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;

  get id(): string {
    return this._id;
  }

  constructor(props: T, id?: string) {
    this.props = props;
    this._id = id ?? randomUUID();
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (entity.props === undefined) {
      return false;
    }
    return this._id === entity._id;
  }
}