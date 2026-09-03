export type AccountRecStatusType = 'PENDING' | 'RECEIVED';

export class AccountRecStatusVO {
  private readonly _received: boolean;

  constructor(statusOrReceived: boolean | string) {
    if (typeof statusOrReceived === 'boolean') {
      this._received = statusOrReceived;
    } else {
      const upper = String(statusOrReceived).trim().toUpperCase();
      if (upper === 'RECEIVED' || upper === 'RECEBIDO' || upper === 'TRUE' || upper === 'PAGO') {
        this._received = true;
      } else if (upper === 'PENDING' || upper === 'PENDENTE' || upper === 'FALSE') {
        this._received = false;
      } else {
        throw new Error(`Status de conta a receber inválido: "${statusOrReceived}".`);
      }
    }
  }

  get isReceived(): boolean {
    return this._received;
  }

  get isPending(): boolean {
    return !this._received;
  }

  get value(): AccountRecStatusType {
    return this._received ? 'RECEIVED' : 'PENDING';
  }
}
