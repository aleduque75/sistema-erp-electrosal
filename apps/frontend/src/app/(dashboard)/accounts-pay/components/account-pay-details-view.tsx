
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AccountPay {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string | null;
  purchaseOrderId?: string | null;
  createdAt: string;
}

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
  }[];
}

interface AccountPayDetailsViewProps {
  account: AccountPay;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

export function AccountPayDetailsView({ account }: AccountPayDetailsViewProps) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePDF = () => {
    if (!purchaseOrder) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Detalhes da Conta a Pagar", 14, 22);

    doc.setFontSize(12);
    doc.text(`Fornecedor: ${purchaseOrder.fornecedor.pessoa.name}`, 14, 32);
    doc.text(`Pedido de Compra: #${purchaseOrder.orderNumber}`, 14, 42);
    doc.text(`Valor Total do Pedido: ${formatCurrency(purchaseOrder.totalAmount)}`, 14, 52);
    doc.text(`Data de Entrada: ${new Date(account.createdAt).toLocaleDateString('pt-BR')}`, 14, 62);
    doc.text(`Data de Vencimento: ${new Date(account.dueDate).toLocaleDateString('pt-BR')}`, 14, 72);

    autoTable(doc, {
      startY: 82,
      head: [['Produto', 'Quantidade', 'Preço Unitário', 'Total']],
      body: purchaseOrder.items.map(item => [
        item.product?.name || item.rawMaterial?.name,
        item.quantity,
        formatCurrency(item.price),
        formatCurrency(item.quantity * item.price),
      ]),
      theme: 'grid',
    });

    doc.save(`conta_a_pagar_${purchaseOrder.orderNumber}.pdf`);
  };

  useEffect(() => {
    if (account.purchaseOrderId) {
      setIsLoading(true);
      api
        .get(`/purchase-orders/${account.purchaseOrderId}`)
        .then((response) => {
          setPurchaseOrder(response.data);
        })
        .catch(() => {
          toast.error("Falha ao carregar detalhes do pedido de compra.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [account.purchaseOrderId]);

  if (isLoading) {
    return <p>Carregando detalhes...</p>;
  }

  if (!purchaseOrder) {
    return <p>Esta conta a pagar não está vinculada a um pedido de compra.</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalhes da Conta</CardTitle>
          <Button variant="outline" onClick={generatePDF} disabled={!purchaseOrder}>Gerar PDF</Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="font-medium">Data de Entrada</p>
              <p>{new Date(account.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="font-medium">Data de Vencimento</p>
              <p>{new Date(account.dueDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {purchaseOrder ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Pedido de Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="font-medium">Fornecedor</p>
                  <p>{purchaseOrder.fornecedor.pessoa.name}</p>
                </div>
                <div>
                  <p className="font-medium">Número do Pedido</p>
                  <p>{purchaseOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="font-medium">Valor Total</p>
                  <p>{formatCurrency(purchaseOrder.totalAmount)}</p>
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
                    <TableHead className="text-right">Preço Unitário</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product?.name || item.rawMaterial?.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.quantity * item.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <p>Esta conta a pagar não está vinculada a um pedido de compra.</p>
      )}
    </div>
  );
}
