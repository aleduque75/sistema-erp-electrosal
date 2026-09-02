import { StockUnit } from '@prisma/client';
import { StockUnitVO } from '../value-objects/stock-unit.vo';

export interface ProductProps {
  id?: string;
  organizationId: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  stock?: number | null;
  stockUnit?: StockUnit | string;
  goldValue?: number | null;
  productGroupId?: string | null;
  externalId?: string | null;
  productGroup?: any;
  inventoryLots?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductEntity {
  private readonly _id?: string;
  private readonly _organizationId: string;
  private _name: string;
  private _description?: string | null;
  private _price: number;
  private _costPrice?: number | null;
  private _stock: number;
  private _stockUnit: StockUnitVO;
  private _goldValue?: number | null;
  private _productGroupId?: string | null;
  private _externalId?: string | null;
  private _productGroup?: any;
  private _inventoryLots: any[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ProductProps) {
    if (!props.organizationId?.trim()) {
      throw new Error('A organização é obrigatória para o Produto.');
    }
    if (!props.name?.trim()) {
      throw new Error('O nome é obrigatório para o Produto.');
    }
    if (props.price === undefined || props.price === null || Number(props.price) < 0) {
      throw new Error('O preço do produto não pode ser negativo.');
    }

    this._id = props.id;
    this._organizationId = props.organizationId;
    this._name = props.name.trim();
    this._description = props.description?.trim() || null;
    this._price = Number(props.price);
    this._costPrice = props.costPrice !== undefined && props.costPrice !== null ? Number(props.costPrice) : null;
    this._stock = props.stock !== undefined && props.stock !== null ? Number(props.stock) : 0;
    this._stockUnit = StockUnitVO.create(props.stockUnit);
    this._goldValue = props.goldValue !== undefined && props.goldValue !== null ? Number(props.goldValue) : null;
    this._productGroupId = props.productGroupId || null;
    this._externalId = props.externalId || null;
    this._productGroup = props.productGroup || null;
    this._inventoryLots = props.inventoryLots || [];
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(props: ProductProps): ProductEntity {
    return new ProductEntity(props);
  }

  get id(): string | undefined {
    return this._id;
  }
  get organizationId(): string {
    return this._organizationId;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | null | undefined {
    return this._description;
  }
  get price(): number {
    return this._price;
  }
  get costPrice(): number | null | undefined {
    return this._costPrice;
  }
  get stock(): number {
    return this._stock;
  }
  get stockUnit(): StockUnit {
    return this._stockUnit.value;
  }
  get goldValue(): number | null | undefined {
    return this._goldValue;
  }
  get productGroupId(): string | null | undefined {
    return this._productGroupId;
  }
  get externalId(): string | null | undefined {
    return this._externalId;
  }
  get productGroup(): any {
    return this._productGroup;
  }
  get inventoryLots(): any[] {
    return this._inventoryLots;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateDetails(data: Partial<ProductProps>): void {
    if (data.name !== undefined) {
      if (!data.name?.trim()) throw new Error('O nome não pode ser vazio.');
      this._name = data.name.trim();
    }
    if (data.description !== undefined) {
      this._description = data.description?.trim() || null;
    }
    if (data.price !== undefined) {
      if (data.price < 0) throw new Error('O preço não pode ser negativo.');
      this._price = Number(data.price);
    }
    if (data.costPrice !== undefined) {
      this._costPrice = data.costPrice !== null ? Number(data.costPrice) : null;
    }
    if (data.stock !== undefined) {
      this._stock = Number(data.stock);
    }
    if (data.stockUnit !== undefined) {
      this._stockUnit = StockUnitVO.create(data.stockUnit);
    }
    if (data.goldValue !== undefined) {
      this._goldValue = data.goldValue !== null ? Number(data.goldValue) : null;
    }
    if (data.productGroupId !== undefined) {
      this._productGroupId = data.productGroupId || null;
    }
    if (data.productGroup !== undefined) {
      this._productGroup = data.productGroup;
    }
    if (data.inventoryLots !== undefined) {
      this._inventoryLots = data.inventoryLots;
    }

    this._updatedAt = new Date();
  }

  adjustStock(quantity: number): void {
    this._stock += Number(quantity);
    this._updatedAt = new Date();
  }

  updatePrice(price: number): void {
    if (price < 0) throw new Error('O preço não pode ser negativo.');
    this._price = Number(price);
    this._updatedAt = new Date();
  }
}
