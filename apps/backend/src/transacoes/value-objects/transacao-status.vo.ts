import { TransacaoStatus } from '@prisma/client';

export class TransacaoStatusVO {
  private readonly _value: TransacaoStatus;

  private constructor(value: TransacaoStatus) {
    this._value = value;
  }

  static create(value: string | TransacaoStatus): TransacaoStatusVO {
    const normalized = String(value || '').toUpperCase().trim();
    if (
      normalized !== TransacaoStatus.ATIVA &&
      normalized !== TransacaoStatus.AJUSTADA &&
      normalized !== TransacaoStatus.CANCELADA
    ) {
      throw new Error(`Status de transação inválido: "${value}". Valores permitidos: ATIVA, AJUSTADA, CANCELADA.`);
    }
    return new TransacaoStatusVO(normalized as TransacaoStatus);
  }

  get value(): TransacaoStatus {
    return this._value;
  }

  isAtiva(): boolean {
    return this._value === TransacaoStatus.ATIVA;
  }

  isAjustada(): boolean {
    return this._value === TransacaoStatus.AJUSTADA;
  }

  isCancelada(): boolean {
    return this._value === TransacaoStatus.CANCELADA;
  }

  transitionTo(newStatus: TransacaoStatus): TransacaoStatusVO {
    if (this._value === TransacaoStatus.CANCELADA) {
      throw new Error('Transação cancelada não pode mudar de status.');
    }
    return new TransacaoStatusVO(newStatus);
  }

  toString(): string {
    return this._value;
  }
}
