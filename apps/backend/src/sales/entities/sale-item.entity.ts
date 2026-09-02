import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface SaleItemProps {
  id?: string;
  saleId?: string;
  productId: string;
  quantity: number;
  price: number;
  costPriceAtSale?: number;
  laborPercentage?: number | null;
  externalId?: string | null;
  product?: {
    id: string;
    name: string;
    [key: string]: any;
  };
  saleItemLots?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class SaleItemEntity {
  private _id: string;
  private _saleId?: string;
  private _productId: string;
  private _quantity: number;
  private _price: number;
  private _costPriceAtSale: number;
  private _laborPercentage?: number | null;
  private _externalId?: string | null;
  private _product?: any;
  private _saleItemLots: any[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: SaleItemProps) {
    if (props.quantity <= 0) {
      throw new BadRequestException('A quantidade do item deve ser maior que zero.');
    }
    if (props.price < 0) {
      throw new BadRequestException('O preço do item não pode ser negativo.');
    }

    this._id = props.id || randomUUID();
    this._saleId = props.saleId;
    this._productId = props.productId;
    this._quantity = props.quantity;
    this._price = props.price;
    this._costPriceAtSale = props.costPriceAtSale ?? 0;
    this._laborPercentage = props.laborPercentage ?? null;
    this._externalId = props.externalId ?? null;
    this._product = props.product;
    this._saleItemLots = props.saleItemLots || [];
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get saleId(): string | undefined {
    return this._saleId;
  }

  get productId(): string {
    return this._productId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get price(): number {
    return this._price;
  }

  get costPriceAtSale(): number {
    return this._costPriceAtSale;
  }

  get laborPercentage(): number | null | undefined {
    return this._laborPercentage;
  }

  get externalId(): string | null | undefined {
    return this._externalId;
  }

  get product(): any {
    return this._product;
  }

  get saleItemLots(): any[] {
    return this._saleItemLots;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Domain Calculations
  subtotal(): number {
    return Number((this._price * this._quantity).toFixed(2));
  }

  totalCost(): number {
    return Number((this._costPriceAtSale * this._quantity).toFixed(2));
  }

  // Mutations
  setSaleId(saleId: string): void {
    this._saleId = saleId;
    this._updatedAt = new Date();
  }

  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero.');
    }
    this._quantity = newQuantity;
    this._updatedAt = new Date();
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new BadRequestException('O preço não pode ser negativo.');
    }
    this._price = newPrice;
    this._updatedAt = new Date();
  }

  updateCostPrice(newCost: number): void {
    this._costPriceAtSale = Math.max(0, newCost);
    this._updatedAt = new Date();
  }

  setLots(lots: any[]): void {
    this._saleItemLots = lots;
    this._updatedAt = new Date();
  }
}
