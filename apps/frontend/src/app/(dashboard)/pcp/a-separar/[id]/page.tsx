'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectLotsModal } from '../../../sales/components/SelectLotsModal';

interface SaleItem { // Interface atualizada
  id: string;
  product: { id: string; name: string; };
  quantity: number;
  saleItemLots: {
    inventoryLot: { batchNumber: string; };
    quantity: number;
  }[];
}

interface Sale {
  id: string;
  orderNumber: string;
  pessoa: {
    name: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  createdAt: string;
  saleItems: SaleItem[];
}

export default function SeparacaoPedidoPage() {
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [isSelectLotsModalOpen, setIsSelectLotsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSaleItem, setSelectedSaleItem] = useState<SaleItem | null>(null);

  const fetchSale = () => {
    if (id) {
      setIsLoading(true);
      api.get(`/sales/${id}`)
        .then(response => setSale(response.data))
        .catch(() => toast.error('Falha ao buscar dados do pedido.'))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchSale();
  }, [id]);

  const openLotSelector = async (item: SaleItem) => {
    try {
      const productWithLots = await api.get(`/products/${item.product.id}`);
      setSelectedProduct(productWithLots.data);
      setSelectedSaleItem(item);
      setIsSelectLotsModalOpen(true);
    } catch (error) {
      toast.error("Falha ao carregar os lotes do produto.");
    }
  };

  const handleLinkLots = async (data: { lots: { inventoryLotId: string; batchNumber: string; quantity: number }[] }) => {
    if (!selectedSaleItem) return;
    try {
      const payload = {
        lots: data.lots.map(lot => ({
          inventoryLotId: lot.inventoryLotId,
          quantity: lot.quantity,
        })),
      };
      await api.post(`/sales/items/${selectedSaleItem.id}/link-lots`, payload);
      toast.success("Lotes vinculados com sucesso!");
      setIsSelectLotsModalOpen(false);
      fetchSale(); // Recarregar os dados da venda
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao vincular os lotes.");
    }
  };

  const generatePDF = () => {
    if (!sale) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const halfPage = pageHeight / 2;

    const drawRomaneio = (yOffset: number) => {
      doc.setFontSize(18);
      doc.text('Romaneio', 14, 15 + yOffset);
      
      doc.setFontSize(10);
      doc.text(`Pedido Nº: ${sale.orderNumber}`, 14, 25 + yOffset);
      doc.text(`Data: ${new Date(sale.createdAt).toLocaleDateString('pt-BR')}`, 120, 25 + yOffset);
      
      doc.text(`Cliente: ${sale.pessoa.name}`, 14, 32 + yOffset);
      
      const address = `${sale.pessoa.logradouro || ''}, ${sale.pessoa.numero || ''}`;
      const address2 = `${sale.pessoa.bairro || ''} - ${sale.pessoa.cidade || ''}/${sale.pessoa.uf || ''}`;
      const cep = `CEP: ${sale.pessoa.cep || ''}`;
      doc.text(`Endereço: ${address}`, 14, 39 + yOffset);
      doc.text(address2, 33, 44 + yOffset);
      doc.text(cep, 14, 51 + yOffset);

      autoTable(doc, {
        startY: 55 + yOffset,
        head: [['Produto', 'Lote', 'Quantidade']],
        body: sale.saleItems.map(item => [
          item.product.name,
          item.inventoryLot?.batchNumber || 'N/A',
          item.quantity.toFixed(4),
        ]),
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 163, 74] },
      });

      const finalY = (doc as any).lastAutoTable.finalY;
      doc.text('Assinatura:', 14, finalY + 15);
      doc.line(14, finalY + 17, 100, finalY + 17);
    };

    // Draw first copy
    drawRomaneio(0);

    // Draw separator line
    doc.setLineDashPattern([2, 2], 0);
    doc.line(10, halfPage, 200, halfPage);
    doc.setLineDashPattern([], 0);

    // Draw second copy
    drawRomaneio(halfPage);

    doc.save(`romaneio_${sale.orderNumber}.pdf`);
  };

  const [separationDate, setSeparationDate] = useState(new Date());

  const handleConfirmSeparation = async () => {
    if (!sale) return;

    try {
      await api.patch(`/sales/${sale.id}/separate`, { separationDate });
      toast.success('Separação confirmada! Pedido pronto para faturamento.');
      router.push('/pcp/a-separar');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Falha ao confirmar separação.');
    }
  };

  if (isLoading) return <div>Carregando...</div>;
  if (!sale) return <div>Pedido não encontrado.</div>;

  return (
    <div className="space-y-4 p-4 md:p-8">
      <SelectLotsModal
        open={isSelectLotsModalOpen}
        onOpenChange={setIsSelectLotsModalOpen}
        product={selectedProduct}
        totalQuantityNeeded={selectedSaleItem?.quantity || 0}
        onAddItem={handleLinkLots}
      />
      <h1 className="text-2xl font-bold">Separação do Pedido #{sale.orderNumber}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Romaneio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-semibold">Cliente:</span> {sale.pessoa.name}</div>
            <div><span className="font-semibold">Data da Venda:</span> {new Date(sale.createdAt).toLocaleDateString('pt-BR')}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="separation-date">Data da Separação</Label>
              <Input
                id="separation-date"
                type="date"
                value={separationDate && !isNaN(separationDate.getTime()) ? format(separationDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  // Appending T00:00:00 makes it parse in the local timezone
                  // instead of UTC, avoiding off-by-one-day errors.
                  const date = new Date(`${e.target.value}T00:00:00`);
                  if (!isNaN(date.getTime())) {
                    setSeparationDate(date);
                  }
                }}
              />
            </div>
          </div>
          <Separator />
          <h3 className="font-semibold text-lg">Itens</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.saleItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>
                    {item.saleItemLots.length > 0
                      ? item.saleItemLots.map(sil => `Lote: ${sil.inventoryLot.batchNumber} (Qtd: ${sil.quantity})`).join(', ')
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity.toFixed(4)}</TableCell>
                  <TableCell>
                    <Button onClick={() => openLotSelector(item)}>Vincular Lotes</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={generatePDF}>Gerar PDF</Button>
                <Button onClick={handleConfirmSeparation}>Confirmar Separação</Button>
              </CardFooter>
            </Card>
          </div>  );
}