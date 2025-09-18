export interface Sale {
  id: string;
  orderNumber: string;
  pessoa: { name: string };
  totalAmount: number;
  feeAmount: number;
  netAmount: number;
  goldPrice: number;
  goldValue: number;
  paymentMethod: string;
  createdAt: string;
  saleItems: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: { name: string };
    inventoryLotId?: string;
  }[];
}