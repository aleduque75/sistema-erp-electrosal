
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  fornecedor: {
    pessoa: {
      name: string;
    };
  };
  items: {
    product?: { name: string };
    rawMaterial?: { name: string };
    quantity: number;
    price: number;
    unit?: string;
  }[];
  orderDate: string;
}

interface PurchaseOrderDetailsViewProps {
  order: PurchaseOrder;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const formatUnit = (unit?: string) => {
  if (unit === 'KILOGRAMS') return 'kg';
  return 'g';
};

export function PurchaseOrderDetailsView({ order }: PurchaseOrderDetailsViewProps) {

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Detalhes do Pedido de Compra", 14, 22);

    doc.setFontSize(12);
    doc.text(`Fornecedor: ${order.fornecedor.pessoa.name}`, 14, 32);
    doc.text(`Pedido de Compra: #${order.orderNumber}`, 14, 42);
    doc.text(`Valor Total: ${formatCurrency(order.totalAmount)}`, 14, 52);
    doc.text(`Data do Pedido: ${new Date(order.orderDate).toLocaleDateString('pt-BR')}`, 14, 62);

    autoTable(doc, {
      startY: 72,
      head: [['Produto', 'Quantidade', 'Unidade', 'Preço Unitário', 'Total']],
      body: order.items.map(item => [
        item.product?.name || item.rawMaterial?.name,
        item.quantity,
        formatUnit(item.unit),
        formatCurrency(item.price),
        formatCurrency(item.quantity * item.price),
      ]),
      theme: 'grid',
    });

    doc.save(`pedido_de_compra_${order.orderNumber}.pdf`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalhes do Pedido</CardTitle>
          <Button variant="outline" onClick={generatePDF}>Gerar PDF</Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="font-medium">Fornecedor</p>
              <p>{order.fornecedor.pessoa.name}</p>
            </div>
            <div>
              <p className="font-medium">Número do Pedido</p>
              <p>{order.orderNumber}</p>
            </div>
            <div>
              <p className="font-medium">Valor Total</p>
              <p>{formatCurrency(order.totalAmount)}</p>
            </div>
            <div>
              <p className="font-medium">Data do Pedido</p>
              <p>{new Date(order.orderDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-right">Preço Unitário</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.product?.name || item.rawMaterial?.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-center">{formatUnit(item.unit)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.quantity * item.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
