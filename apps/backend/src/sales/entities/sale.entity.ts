import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SaleStatus } from '@prisma/client';
import { SaleStatusVO } from '../value-objects/sale-status.vo';
import { SaleItemEntity } from './sale-item.entity';

export interface SaleProps {
  id?: string;
  orderNumber: number;
  organizationId: string;
  pessoaId: string;
  status?: SaleStatusVO | SaleStatus;
  totalAmount?: number;
  totalCost?: number;
  netAmount?: number;
  feeAmount?: number;
  shippingCost?: number;
  goldPrice?: number | null;
  goldValue?: number | null;
  paymentMethod?: string | null;
  paymentTermId?: string | null;
  readyForPayment?: boolean;
  observation?: string | null;
  salespersonId?: string | null;
  commissionAmount?: number | null;
  commissionDetails?: any | null;
  externalId?: string | null;
  items?: SaleItemEntity[];
  accountsRec?: any[];
  pessoa?: any;
  salesperson?: any;
  paymentTerm?: any;
  adjustment?: any;
  installments?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class SaleEntity {
  private _id: string;
  private _orderNumber: number;
  private _organizationId: string;
  private _pessoaId: string;
  private _status: SaleStatusVO;
  private _totalAmount: number;
  private _totalCost: number;
  private _netAmount: number;
  private _feeAmount: number;
  private _shippingCost: number;
  private _goldPrice: number | null;
  private _goldValue: number | null;
  private _paymentMethod: string | null;
  private _paymentTermId: string | null;
  private _readyForPayment: boolean;
  private _observation: string | null;
  private _salespersonId: string | null;
  private _commissionAmount: number | null;
  private _commissionDetails: any | null;
  private _externalId: string | null;
  private _items: SaleItemEntity[];
  private _accountsRec: any[];
  private _pessoa?: any;
  private _salesperson?: any;
  private _paymentTerm?: any;
  private _adjustment?: any;
  private _installments: any[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: SaleProps) {
    this._id = props.id || randomUUID();
    this._orderNumber = props.orderNumber;
    this._organizationId = props.organizationId;
    this._pessoaId = props.pessoaId;

    if (props.status instanceof SaleStatusVO) {
      this._status = props.status;
    } else if (props.status) {
      this._status = new SaleStatusVO(props.status);
    } else {
      this._status = SaleStatusVO.PENDENTE();
    }

    this._feeAmount = props.feeAmount ?? 0;
    this._shippingCost = props.shippingCost ?? 0;
    this._goldPrice = props.goldPrice ?? null;
    this._paymentMethod = props.paymentMethod ?? null;
    this._paymentTermId = props.paymentTermId ?? null;
    this._readyForPayment = props.readyForPayment ?? false;
    this._observation = props.observation ?? null;
    this._salespersonId = props.salespersonId ?? null;
    this._commissionAmount = props.commissionAmount ?? null;
    this._commissionDetails = props.commissionDetails ?? null;
    this._externalId = props.externalId ?? null;
    this._items = props.items || [];
    this._accountsRec = props.accountsRec || [];
    this._pessoa = props.pessoa;
    this._salesperson = props.salesperson;
    this._paymentTerm = props.paymentTerm;
    this._adjustment = props.adjustment;
    this._installments = props.installments || [];
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    if (props.totalAmount !== undefined && props.totalCost !== undefined) {
      this._totalAmount = props.totalAmount;
      this._totalCost = props.totalCost;
      this._netAmount = props.netAmount ?? Number((this._totalAmount + this._shippingCost + this._feeAmount).toFixed(2));
      this._goldValue = props.goldValue ?? (this._goldPrice && this._goldPrice > 0 ? Number((this._netAmount / this._goldPrice).toFixed(4)) : null);
    } else {
      this._totalAmount = 0;
      this._totalCost = 0;
      this._netAmount = 0;
      this._goldValue = null;
      this.calculateTotals();
    }
  }

  // Getters
  get id(): string { return this._id; }
  get orderNumber(): number { return this._orderNumber; }
  get organizationId(): string { return this._organizationId; }
  get pessoaId(): string { return this._pessoaId; }
  get status(): SaleStatusVO { return this._status; }
  get totalAmount(): number { return this._totalAmount; }
  get totalCost(): number { return this._totalCost; }
  get netAmount(): number { return this._netAmount; }
  get feeAmount(): number { return this._feeAmount; }
  get shippingCost(): number { return this._shippingCost; }
  get goldPrice(): number | null { return this._goldPrice; }
  get goldValue(): number | null { return this._goldValue; }
  get paymentMethod(): string | null { return this._paymentMethod; }
  get paymentTermId(): string | null { return this._paymentTermId; }
  get readyForPayment(): boolean { return this._readyForPayment; }
  get observation(): string | null { return this._observation; }
  get salespersonId(): string | null { return this._salespersonId; }
  get commissionAmount(): number | null { return this._commissionAmount; }
  get commissionDetails(): any | null { return this._commissionDetails; }
  get externalId(): string | null { return this._externalId; }
  get items(): SaleItemEntity[] { return [...this._items]; }
  get accountsRec(): any[] { return [...this._accountsRec]; }
  get pessoa(): any { return this._pessoa; }
  get salesperson(): any { return this._salesperson; }
  get paymentTerm(): any { return this._paymentTerm; }
  get adjustment(): any { return this._adjustment; }
  get installments(): any[] { return [...this._installments]; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // Domain Calculations
  calculateTotals(): void {
    let grossTotal = 0;
    let costTotal = 0;

    for (const item of this._items) {
      grossTotal += item.subtotal();
      costTotal += item.totalCost();
    }

    this._totalAmount = Number(grossTotal.toFixed(2));
    this._totalCost = Number(costTotal.toFixed(2));
    this._netAmount = Number((this._totalAmount + this._shippingCost + this._feeAmount).toFixed(2));

    if (this._goldPrice && this._goldPrice > 0) {
      this._goldValue = Number((this._netAmount / this._goldPrice).toFixed(4));
    }

    this._updatedAt = new Date();
  }

  calculateGoldEquivalence(goldQuote: number): void {
    if (goldQuote <= 0) {
      throw new BadRequestException('A cotação do ouro deve ser maior que zero.');
    }
    this._goldPrice = goldQuote;
    this._goldValue = Number((this._netAmount / goldQuote).toFixed(4));
    this._updatedAt = new Date();
  }

  // Item Management
  addItem(item: SaleItemEntity): void {
    if (!this._status.isEditable()) {
      throw new BadRequestException(`Não é possível adicionar itens a uma venda com status ${this._status.value}.`);
    }
    item.setSaleId(this._id);
    this._items.push(item);
    this.calculateTotals();
  }

  removeItem(itemId: string): void {
    if (!this._status.isEditable()) {
      throw new BadRequestException(`Não é possível remover itens de uma venda com status ${this._status.value}.`);
    }
    this._items = this._items.filter(i => i.id !== itemId);
    this.calculateTotals();
  }

  // Financial Updates
  updateFinancials(data: { goldPrice?: number; feeAmount?: number; shippingCost?: number }): void {
    if (data.feeAmount !== undefined) {
      this._feeAmount = Math.max(0, data.feeAmount);
    }
    if (data.shippingCost !== undefined) {
      this._shippingCost = Math.max(0, data.shippingCost);
    }
    if (data.goldPrice !== undefined && data.goldPrice > 0) {
      this._goldPrice = data.goldPrice;
    }
    this.calculateTotals();
  }

  updateObservation(observation?: string | null): void {
    this._observation = observation || null;
    this._updatedAt = new Date();
  }

  // State Transitions (Pure Domain Logic)
  confirm(): void {
    this._status = this._status.transitionTo(SaleStatus.CONFIRMADO);
    this._updatedAt = new Date();
  }

  releaseToPcp(): void {
    this._status = this._status.transitionTo(SaleStatus.A_SEPARAR);
    this._updatedAt = new Date();
  }

  separate(): void {
    this._status = this._status.transitionTo(SaleStatus.SEPARADO);
    this._updatedAt = new Date();
  }

  finalize(): void {
    this._status = this._status.transitionTo(SaleStatus.FINALIZADO);
    this._updatedAt = new Date();
  }

  cancel(reason?: string): void {
    this._status = this._status.transitionTo(SaleStatus.CANCELADO);
    if (reason) {
      this._observation = this._observation ? `${this._observation} | Cancelado: ${reason}` : `Cancelado: ${reason}`;
    }
    this._updatedAt = new Date();
  }

  revertToPending(): void {
    this._status = this._status.transitionTo(SaleStatus.PENDENTE);
    this._updatedAt = new Date();
  }

  markReadyForPayment(ready: boolean = true): void {
    this._readyForPayment = ready;
    this._updatedAt = new Date();
  }
}
