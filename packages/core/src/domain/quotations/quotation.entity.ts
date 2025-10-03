import { UniqueEntityID } from '../../_shared/domain/unique-entity-id';
import { AggregateRoot } from "../../_shared/domain/aggregate-root";
import { TipoMetal } from '../enums/tipo-metal.enum';

export interface QuotationProps {
  organizationId: string;
  metal: TipoMetal;
  date: Date;
  buyPrice: number;
  sellPrice: number;
  paymentType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Quotation extends AggregateRoot<QuotationProps> {
  private constructor(props: QuotationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<QuotationProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Quotation {
    const now = new Date();
    const quotation = new Quotation(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id || UniqueEntityID.create(),
    );
    return quotation;
  }

  public static reconstitute(props: QuotationProps, id: UniqueEntityID): Quotation {
    return new Quotation(props, id);
  }

  // Getters
  get organizationId(): string { return this.props.organizationId; }
  get metal(): TipoMetal { return this.props.metal; }
  get date(): Date { return this.props.date; }
  get buyPrice(): number { return this.props.buyPrice; }
  get sellPrice(): number { return this.props.sellPrice; }
  get paymentType(): string | undefined { return this.props.paymentType; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Setters (if needed, with domain logic)
  public updatePrices(buyPrice: number, sellPrice: number): void {
    this.props.buyPrice = buyPrice;
    this.props.sellPrice = sellPrice;
    this.props.updatedAt = new Date();
  }

  public toObject(): QuotationProps & { id: string } {
    return {
      id: this.id.toValue(),
      ...this.props,
    };
  }
}
