
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  fornecedor?: {
    pessoa: {
      name: string;
    };
  } | null;
  transacao?: {
    valor: number;
    goldAmount?: number | null;
    contaCorrente?: {
      nome: string;
    } | null;
  } | null;
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

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const formatGrams = (value?: number | null) =>
  value ? `${Number(value).toFixed(4)}g` : "N/A";
  
const formatDate = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : "N/A";

export function AccountPayDetailsView({ account }: AccountPayDetailsViewProps) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePDF = () => {
    // A ser implementado com mais detalhes genéricos
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Detalhes da Conta a Pagar", 14, 22);

    doc.setFontSize(12);
    doc.text(`Descrição: ${account.description}`, 14, 32);
    doc.text(`Valor: ${formatCurrency(account.amount)}`, 14, 42);
    doc.text(`Vencimento: ${formatDate(account.dueDate)}`, 14, 52);
    doc.text(`Status: ${account.paid ? `Pago em ${formatDate(account.paidAt)}` : 'Pendente'}`, 14, 62);
    
    if (purchaseOrder) {
      autoTable(doc, {
        startY: 82,
        head: [['Produto', 'Quantidade', 'Preço Unitário', 'Total']],
        body: purchaseOrder.items.map(item => [
          item.product?.name || item.rawMaterial?.name || '',
          item.quantity,
          formatCurrency(item.price),
          formatCurrency(item.quantity * item.price),
        ]) as any[][],
        theme: 'grid',
      });
    }

    doc.save(`conta_a_pagar_${account.id}.pdf`);
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

  return (
    <div className="space-y-4">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Visão Geral</CardTitle>
          <Button variant="outline" onClick={generatePDF}>Gerar PDF</Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
            <p className="font-semibold">{account.fornecedor?.pessoa?.name || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Valor</p>
            <p className="font-semibold">{formatCurrency(account.amount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Vencimento</p>
            <p className="font-semibold">{formatDate(account.dueDate)}</p>
          </div>
          <div className="space-y-1 md:col-span-3">
            <p className="text-sm font-medium text-muted-foreground">Descrição</p>
            <p>{account.description}</p>
          </div>
           <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p><Badge variant={account.paid ? "default" : "secondary"}>
              {account.paid ? "Pago" : "Pendente"}
            </Badge></p>
          </div>
        </CardContent>
      </Card>

      {account.paid && account.transacao && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Data do Pagamento</p>
              <p className="font-semibold">{formatDate(account.paidAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Valor Pago (BRL)</p>
              <p className="font-semibold">{formatCurrency(account.transacao.valor)}</p>
            </div>
             <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Valor em Ouro (AU)</p>
              <p className="font-semibold font-mono">{formatGrams(account.transacao.goldAmount)}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Conta de Origem</p>
              <p className="font-semibold">{account.transacao.contaCorrente?.nome || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && <p>Carregando detalhes do pedido...</p>}
      
      {purchaseOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Itens do Pedido de Compra Associado (#{purchaseOrder.orderNumber})</CardTitle>
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
                    <TableCell className="text-right">{formatCurrency(item.quantity * Number(item.price))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
