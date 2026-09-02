import { TipoTransacaoVO } from '../value-objects/tipo-transacao.vo';
import { TransacaoStatusVO } from '../value-objects/transacao-status.vo';
import { TipoTransacaoPrisma, TransacaoStatus } from '@prisma/client';

export interface TransacaoProps {
  id?: string;
  tipo: TipoTransacaoVO | TipoTransacaoPrisma | string;
  valor: number;
  moeda?: string;
  descricao?: string | null;
  dataHora?: Date | string;
  contaContabilId: string;
  contaCorrenteId?: string | null;
  organizationId: string;
  goldAmount?: number | null;
  goldPrice?: number | null;
  status?: TransacaoStatusVO | TransacaoStatus | string;
  fitId?: string | null;
  accountRecId?: string | null;
  linkedTransactionId?: string | null;
  fornecedorId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  medias?: any[];
  contaContabil?: any;
  contaCorrente?: any;
  fornecedor?: any;
}

export class TransacaoEntity {
  private readonly _id?: string;
  private _tipo: TipoTransacaoVO;
  private _valor: number;
  private _moeda: string;
  private _descricao?: string | null;
  private _dataHora: Date;
  private _contaContabilId: string;
  private _contaCorrenteId?: string | null;
  private readonly _organizationId: string;
  private _goldAmount?: number | null;
  private _goldPrice?: number | null;
  private _status: TransacaoStatusVO;
  private _fitId?: string | null;
  private _accountRecId?: string | null;
  private _linkedTransactionId?: string | null;
  private _fornecedorId?: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _medias: any[];
  private _contaContabil?: any;
  private _contaCorrente?: any;
  private _fornecedor?: any;

  private constructor(props: TransacaoProps) {
    if (!props.organizationId?.trim()) {
      throw new Error('A organização é obrigatória para a transação.');
    }
    if (!props.contaContabilId?.trim()) {
      throw new Error('A conta contábil é obrigatória para a transação.');
    }

    this._id = props.id;
    this._organizationId = props.organizationId.trim();
    this._contaContabilId = props.contaContabilId.trim();
    this._tipo =
      props.tipo instanceof TipoTransacaoVO
        ? props.tipo
        : TipoTransacaoVO.create(props.tipo);
    this._valor = Number(props.valor || 0);
    this._moeda = props.moeda || 'BRL';
    this._descricao = props.descricao ?? null;
    this._dataHora = props.dataHora ? new Date(props.dataHora) : new Date();
    this._contaCorrenteId = props.contaCorrenteId ?? null;
    this._goldAmount =
      props.goldAmount !== undefined && props.goldAmount !== null
        ? Number(props.goldAmount)
        : null;
    this._goldPrice =
      props.goldPrice !== undefined && props.goldPrice !== null
        ? Number(props.goldPrice)
        : null;
    this._status =
      props.status instanceof TransacaoStatusVO
        ? props.status
        : TransacaoStatusVO.create(props.status || TransacaoStatus.ATIVA);
    this._fitId = props.fitId ?? null;
    this._accountRecId = props.accountRecId ?? null;
    this._linkedTransactionId = props.linkedTransactionId ?? null;
    this._fornecedorId = props.fornecedorId ?? null;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._medias = props.medias || [];
    this._contaContabil = props.contaContabil;
    this._contaCorrente = props.contaCorrente;
    this._fornecedor = props.fornecedor;
  }

  static create(props: TransacaoProps): TransacaoEntity {
    return new TransacaoEntity(props);
  }

  get id(): string | undefined {
    return this._id;
  }
  get tipo(): TipoTransacaoVO {
    return this._tipo;
  }
  get valor(): number {
    return this._valor;
  }
  get moeda(): string {
    return this._moeda;
  }
  get descricao(): string | null | undefined {
    return this._descricao;
  }
  get dataHora(): Date {
    return this._dataHora;
  }
  get contaContabilId(): string {
    return this._contaContabilId;
  }
  get contaCorrenteId(): string | null | undefined {
    return this._contaCorrenteId;
  }
  get organizationId(): string {
    return this._organizationId;
  }
  get goldAmount(): number | null | undefined {
    return this._goldAmount;
  }
  get goldPrice(): number | null | undefined {
    return this._goldPrice;
  }
  get status(): TransacaoStatusVO {
    return this._status;
  }
  get fitId(): string | null | undefined {
    return this._fitId;
  }
  get accountRecId(): string | null | undefined {
    return this._accountRecId;
  }
  get linkedTransactionId(): string | null | undefined {
    return this._linkedTransactionId;
  }
  get fornecedorId(): string | null | undefined {
    return this._fornecedorId;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get medias(): any[] {
    return this._medias;
  }
  get contaContabil(): any {
    return this._contaContabil;
  }
  get contaCorrente(): any {
    return this._contaCorrente;
  }
  get fornecedor(): any {
    return this._fornecedor;
  }

  isTransfer(): boolean {
    return !!this._linkedTransactionId;
  }

  linkAccount(contaCorrenteId: string): void {
    if (!contaCorrenteId?.trim()) {
      throw new Error('ID da conta corrente é obrigatório para vinculação.');
    }
    this._contaCorrenteId = contaCorrenteId.trim();
    this._updatedAt = new Date();
  }

  unlinkAccount(): void {
    this._contaCorrenteId = null;
    this._updatedAt = new Date();
  }

  linkTransaction(linkedId: string): void {
    this._linkedTransactionId = linkedId;
    this._updatedAt = new Date();
  }

  markAsAdjusted(): void {
    this._status = this._status.transitionTo(TransacaoStatus.AJUSTADA);
    this._updatedAt = new Date();
  }

  cancel(): void {
    this._status = this._status.transitionTo(TransacaoStatus.CANCELADA);
    this._updatedAt = new Date();
  }
}
