import { BadRequestException } from '@nestjs/common';
import { SaleStatus } from '@prisma/client';

export class SaleStatusVO {
  private readonly _value: SaleStatus;

  constructor(value: SaleStatus | string) {
    const status = (typeof value === 'string' ? value.toUpperCase() : value) as SaleStatus;
    if (!Object.values(SaleStatus).includes(status)) {
      throw new BadRequestException(`Status de venda inválido: ${value}`);
    }
    this._value = status;
  }

  get value(): SaleStatus {
    return this._value;
  }

  // Factory methods
  static PENDENTE(): SaleStatusVO {
    return new SaleStatusVO(SaleStatus.PENDENTE);
  }

  static CONFIRMADO(): SaleStatusVO {
    return new SaleStatusVO(SaleStatus.CONFIRMADO);
  }

  static A_SEPARAR(): SaleStatusVO {
    return new SaleStatusVO(SaleStatus.A_SEPARAR);
  }

  static SEPARADO(): SaleStatusVO {
    return new SaleStatusVO(SaleStatus.SEPARADO);
  }

  static FINALIZADO(): SaleStatusVO {
    return new SaleStatusVO(SaleStatus.FINALIZADO);
  }

  static CANCELADO(): SaleStatusVO {
    return new SaleStatusVO(SaleStatus.CANCELADO);
  }

  static PAGO_PARCIALMENTE(): SaleStatusVO {
    return new SaleStatusVO(SaleStatus.PAGO_PARCIALMENTE);
  }

  static fromString(value: string): SaleStatusVO {
    return new SaleStatusVO(value);
  }

  // State checks
  isPendente(): boolean {
    return this._value === SaleStatus.PENDENTE;
  }

  isConfirmado(): boolean {
    return this._value === SaleStatus.CONFIRMADO;
  }

  isASeparar(): boolean {
    return this._value === SaleStatus.A_SEPARAR;
  }

  isSeparado(): boolean {
    return this._value === SaleStatus.SEPARADO;
  }

  isFinalizado(): boolean {
    return this._value === SaleStatus.FINALIZADO;
  }

  isCancelado(): boolean {
    return this._value === SaleStatus.CANCELADO;
  }

  isEditable(): boolean {
    return this._value === SaleStatus.PENDENTE || this._value === SaleStatus.CONFIRMADO;
  }

  isCancellable(): boolean {
    return this._value !== SaleStatus.CANCELADO && this._value !== SaleStatus.FINALIZADO;
  }

  // State transition validation
  canTransitionTo(target: SaleStatus): boolean {
    if (this._value === target) return true;

    switch (this._value) {
      case SaleStatus.PENDENTE:
        return ([
          SaleStatus.CONFIRMADO,
          SaleStatus.A_SEPARAR,
          SaleStatus.CANCELADO,
        ] as SaleStatus[]).includes(target);

      case SaleStatus.CONFIRMADO:
        return ([
          SaleStatus.PENDENTE, // Reversão
          SaleStatus.A_SEPARAR,
          SaleStatus.SEPARADO,
          SaleStatus.FINALIZADO,
          SaleStatus.CANCELADO,
        ] as SaleStatus[]).includes(target);

      case SaleStatus.A_SEPARAR:
        return ([
          SaleStatus.SEPARADO,
          SaleStatus.CONFIRMADO,
          SaleStatus.PENDENTE,
          SaleStatus.CANCELADO,
        ] as SaleStatus[]).includes(target);

      case SaleStatus.SEPARADO:
        return ([
          SaleStatus.FINALIZADO,
          SaleStatus.A_SEPARAR,
          SaleStatus.PENDENTE,
          SaleStatus.CANCELADO,
        ] as SaleStatus[]).includes(target);

      case SaleStatus.PAGO_PARCIALMENTE:
        return ([
          SaleStatus.FINALIZADO,
          SaleStatus.CANCELADO,
        ] as SaleStatus[]).includes(target);

      case SaleStatus.FINALIZADO:
        // Vendas finalizadas só podem ser revertidas com ações especiais ou canceladas
        return ([SaleStatus.CANCELADO, SaleStatus.PENDENTE] as SaleStatus[]).includes(target);

      case SaleStatus.CANCELADO:
        return false; // Venda cancelada é estado terminal

      default:
        return false;
    }
  }

  transitionTo(target: SaleStatus): SaleStatusVO {
    if (!this.canTransitionTo(target)) {
      throw new BadRequestException(
        `Transição de status inválida: Não é permitido mudar de ${this._value} para ${target}.`,
      );
    }
    return new SaleStatusVO(target);
  }

  equals(other: SaleStatusVO | SaleStatus): boolean {
    if (other instanceof SaleStatusVO) {
      return this._value === other.value;
    }
    return this._value === other;
  }

  toString(): string {
    return this._value;
  }
}
