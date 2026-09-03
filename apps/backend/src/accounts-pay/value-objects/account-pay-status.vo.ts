export type AccountPayStatusType = 'PENDING' | 'PAID';

export class AccountPayStatusVO {
  private readonly _paid: boolean;

  constructor(statusOrPaid: boolean | string) {
    if (typeof statusOrPaid === 'boolean') {
      this._paid = statusOrPaid;
    } else {
      const upper = String(statusOrPaid).trim().toUpperCase();
      if (upper === 'PAID' || upper === 'PAGO' || upper === 'TRUE') {
        this._paid = true;
      } else if (upper === 'PENDING' || upper === 'PENDENTE' || upper === 'FALSE') {
        this._paid = false;
      } else {
        throw new Error(`Status de conta a pagar inválido: "${statusOrPaid}".`);
      }
    }
  }

  get isPaid(): boolean {
    return this._paid;
  }

  get isPending(): boolean {
    return !this._paid;
  }

  get value(): AccountPayStatusType {
    return this._paid ? 'PAID' : 'PENDING';
  }
}
