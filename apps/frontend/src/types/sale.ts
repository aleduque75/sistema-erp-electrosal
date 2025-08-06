interface Sale {
  id: string;
  orderNumber: string;
  client: { name: string };
  totalAmount: number;
  feeAmount: number;
  netAmount: number;
  paymentMethod: string;
  createdAt: string;
  saleItems: {
    productId: string;
    quantity: number;
    price: number;
    product: { name: string };
  }[];
}

export type { Sale };