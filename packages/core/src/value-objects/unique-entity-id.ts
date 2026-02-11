import { randomUUID } from 'crypto';

export class UniqueEntityID {
  private value: string;

  toString() {
    return this.value;
  }

  toValue() {
    return this.value;
  }

  constructor(value?: string) {
    this.value = value || randomUUID();
  }

  public equals(id: UniqueEntityID) {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof UniqueEntityID)) {
      return false;
    }
    return id.toValue() === this.value;
  }

  public static create(id?: string) {
    return new UniqueEntityID(id);
  }
}
