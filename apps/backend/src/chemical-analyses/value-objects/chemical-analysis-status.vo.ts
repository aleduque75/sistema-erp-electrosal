import { StatusAnaliseQuimicaPrisma } from '@prisma/client';

export type ChemicalAnalysisStatus =
  | 'RECEBIDO'
  | 'EM_ANALISE'
  | 'ANALISADO_AGUARDANDO_APROVACAO'
  | 'APROVADO_PARA_RECUPERACAO'
  | 'RECUSADO_PELO_CLIENTE'
  | 'EM_RECUPERACAO'
  | 'FINALIZADO_RECUPERADO'
  | 'CANCELADO'
  | 'RESIDUO';

export class ChemicalAnalysisStatusVO {
  private readonly _value: ChemicalAnalysisStatus;

  constructor(status: string | StatusAnaliseQuimicaPrisma) {
    const validStatuses: ChemicalAnalysisStatus[] = [
      'RECEBIDO',
      'EM_ANALISE',
      'ANALISADO_AGUARDANDO_APROVACAO',
      'APROVADO_PARA_RECUPERACAO',
      'RECUSADO_PELO_CLIENTE',
      'EM_RECUPERACAO',
      'FINALIZADO_RECUPERADO',
      'CANCELADO',
      'RESIDUO',
    ];

    const upper = String(status).trim().toUpperCase() as ChemicalAnalysisStatus;
    if (!validStatuses.includes(upper)) {
      throw new Error(`Status de Análise Química inválido: "${status}".`);
    }

    this._value = upper;
  }

  get value(): ChemicalAnalysisStatus {
    return this._value;
  }

  get isReceived(): boolean {
    return this._value === 'RECEBIDO';
  }

  get isInAnalysis(): boolean {
    return this._value === 'EM_ANALISE';
  }

  get isPendingApproval(): boolean {
    return this._value === 'ANALISADO_AGUARDANDO_APROVACAO';
  }

  get isApproved(): boolean {
    return this._value === 'APROVADO_PARA_RECUPERACAO';
  }

  get isRejected(): boolean {
    return this._value === 'RECUSADO_PELO_CLIENTE';
  }

  get isRecovered(): boolean {
    return this._value === 'FINALIZADO_RECUPERADO';
  }

  get isCanceled(): boolean {
    return this._value === 'CANCELADO';
  }

  get isResidue(): boolean {
    return this._value === 'RESIDUO';
  }

  canPostResult(): boolean {
    return this.isReceived || this.isInAnalysis;
  }

  canApprove(): boolean {
    return this.isPendingApproval;
  }

  canReject(): boolean {
    return this.isPendingApproval;
  }

  canRedo(): boolean {
    return this.isPendingApproval || this.isRejected;
  }
}
