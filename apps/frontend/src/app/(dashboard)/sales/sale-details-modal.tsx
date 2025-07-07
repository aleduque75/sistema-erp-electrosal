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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailsModal({
  saleId,
  open,
  onOpenChange,
}: SaleDetailsModalProps) {
  const [saleDetails, setSaleDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && saleId) {
      setLoading(true);
      api
        .get(`/sales/${saleId}`)
        .then((response) => setSaleDetails(response.data))
        .catch(() => toast.error("Falha ao buscar detalhes da venda."))
        .finally(() => setLoading(false));
    } else {
      setSaleDetails(null); // Limpa os detalhes quando o modal fecha
    }
  }, [open, saleId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center">Carregando...</p>
        ) : saleDetails ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
              <DetailItem label="Cliente" value={saleDetails.client.name} />
              <DetailItem
                label="Data da Venda"
                value={formatDate(saleDetails.saleDate)}
              />
              <DetailItem
                label="Método de Pagamento"
                value={saleDetails.paymentMethod}
              />
              <DetailItem
                label="Valor Total"
                value={formatCurrency(saleDetails.totalAmount)}
              />
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
                  {saleDetails.saleItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
