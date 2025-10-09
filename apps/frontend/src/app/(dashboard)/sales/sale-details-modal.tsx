"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner"; // ✨ Importação adicionada
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Sale } from "@/types/sale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const DetailItem = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p>{value || "N/A"}</p>
  </div>
);

interface SaleDetailsModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void; // Callback to refresh the list
}

export function SaleDetailsModal({
  sale,
  open,
  onOpenChange,
  onSave,
}: SaleDetailsModalProps) {
  const [freightCost, setFreightCost] = useState(sale?.feeAmount || 0);
  const [goldPrice, setGoldPrice] = useState(sale?.goldPrice || 0);

  useEffect(() => {
    if (sale) {
      setFreightCost(sale.feeAmount || 0);
      setGoldPrice(sale.goldPrice || 0);
    }
  }, [sale]);

  const handleSaveAndRecalculate = async () => {
    if (!sale) return;

    const promise = api.patch(`/sales/${sale.id}/financials`, { 
      goldPrice,
      feeAmount: freightCost
    });

    toast.promise(promise, {
      loading: 'Salvando dados e recalculando ajuste...',
      success: () => {
        onSave(); // This will refresh the list on the parent page
        onOpenChange(false); // Close the modal
        return 'Dados financeiros atualizados com sucesso!';
      },
      error: 'Falha ao atualizar dados financeiros.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
        </DialogHeader>
        {sale ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
              <DetailItem label="Cliente" value={sale.pessoa.name} />
              <DetailItem
                label="Data da Venda"
                value={formatDate(sale.createdAt)}
              />
              <DetailItem
                label="Método de Pagamento"
                value={sale.paymentMethod}
              />
              <DetailItem
                label="Valor Total"
                value={formatCurrency(sale.totalAmount)}
              />
              {sale.feeAmount > 0 && (
                <DetailItem
                  label="Taxa do Cartão"
                  value={formatCurrency(sale.feeAmount)}
                />
              )}
              <DetailItem
                label="Valor Líquido"
                value={formatCurrency(sale.netAmount)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goldPrice">Cotação da Venda (R$)</Label>
                <Input
                  id="goldPrice"
                  type="number"
                  value={goldPrice}
                  onChange={(e) => setGoldPrice(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freightCost">Custo de Frete (R$)</Label>
                <Input
                  id="freightCost"
                  type="number"
                  value={freightCost}
                  onChange={(e) => setFreightCost(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Itens da Venda</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd.</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.saleItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.product?.name || 'Produto não encontrado'}</TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {sale.accountsRec && sale.accountsRec.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recebimentos</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Conta Pagamento</TableHead>
                      <TableHead className="text-right">Valor (BRL)</TableHead>
                      <TableHead className="text-right">Valor (Au)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.accountsRec.map((ar) => (
                      <TableRow key={ar.id}>
                        <TableCell>{ar.description}</TableCell>
                        <TableCell>{formatDate(ar.dueDate)}</TableCell>
                        <TableCell>{ar.received ? 'Recebido' : 'Pendente'}</TableCell>
                        <TableCell>{ar.transacao?.contaCorrente?.nome || 'N/A'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ar.amount)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {ar.transacao?.goldAmount ? `${Number(ar.transacao.goldAmount).toFixed(4)}g` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center">
            Não foi possível carregar os detalhes.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleSaveAndRecalculate}>Salvar e Recalcular</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}