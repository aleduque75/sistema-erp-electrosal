import { UniqueEntityID } from './unique-entity-id';

// Exemplo de uma Entidade base
export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID;
  public readonly props: T;

  constructor(props: T, id?: UniqueEntityID) {
    this._id = id ? id : UniqueEntityID.create();
    this.props = props;
  }

  get id(): UniqueEntityID {
    return this._id;
  }

  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }
    if (this === object) {
      return true;
    }
    if (!(object instanceof Entity)) {
      return false;
    }
    return this._id.equals(object._id);
  }
}
