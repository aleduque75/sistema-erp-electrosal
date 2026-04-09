'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Boxes, 
  Factory, 
  ShoppingCart, 
  Calendar, 
  Info,
  Edit2,
  Scale
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LotEditForm } from './components/lot-edit-form';

interface InventoryLot {
  id: string;
  productId: string;
  batchNumber: string | null;
  costPrice: number;
  quantity: number;
  remainingQuantity: number;
  sourceType: string;
  sourceId: string;
  receivedDate: string;
  product: {
    name: string;
    stockUnit?: string;
  };
  reaction?: {
    reactionNumber: string;
  } | null;
}

export default function InventoryLotsPage() {
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLot, setEditingLot] = useState<InventoryLot | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchLots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/stock/lots');
      setLots(res.data);
    } catch (err) {
      toast.error('Falha ao carregar lotes de estoque.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  const formatCurrency = (val: number, unit: string) => {
    const formattedPrice = new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4 
    }).format(val || 0);

    return `${formattedPrice}${unit ? ` / ${unit}` : ''}`;
  };

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('pt-BR');

  const getSourceBadge = (type: string, reaction?: any) => {
    switch (type) {
      case 'PURCHASE_ORDER':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-primary/20 bg-primary/10 text-primary">
            <ShoppingCart size={12} /> Compra
          </Badge>
        );
      case 'REACTION':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            <Factory size={12} /> Reação {reaction?.reactionNumber ? `#${reaction.reactionNumber}` : ''}
          </Badge>
        );
      case 'ADJUSTMENT':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-warning/20 text-warning bg-warning/10">
            Ajuste
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Helper to normalize units (e.g., if Ag CN should be KG)
  const getDisplayUnit = (productName: string, stockUnit: string | undefined) => {
    if (productName.toUpperCase().includes('AG CN')) {
      return 'KG'; // Force KG for Ag CN as requested by user
    }
    return stockUnit || 'Grams';
  };

  return (
    <div className="space-y-8 md:p-8 animate-in fade-in duration-700 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="text-primary" />
            Rastreabilidade de Lotes
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie a origem, custos e saldo de todos os lotes em estoque.</p>
        </div>
      </div>

      <Card className="border-border shadow-xl bg-card">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Info size={16} />
            Lotes Ativos e Histórico
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : lots.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="flex justify-center">
                <Package size={48} className="text-muted/30" />
              </div>
              <p className="text-muted-foreground italic">Nenhum lote encontrado no sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border-none">
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead className="font-bold text-foreground">Produto</TableHead>
                    <TableHead className="font-bold text-foreground">Lote / Batch</TableHead>
                    <TableHead className="font-bold text-foreground">Origem</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Custo Unitário</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Saldo Atual</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Data Entrada</TableHead>
                    <TableHead className="text-right font-bold text-foreground px-4">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => {
                    const displayUnit = getDisplayUnit(lot.product.name, lot.product.stockUnit);
                    return (
                      <TableRow key={lot.id} className="hover:bg-muted/30 transition-colors border-border">
                        <TableCell className="font-medium text-foreground">
                          {lot.product?.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {lot.batchNumber || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getSourceBadge(lot.sourceType, lot.reaction)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(Number(lot.costPrice), displayUnit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${lot.remainingQuantity > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {lot.remainingQuantity.toFixed(2)} {displayUnit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(lot.receivedDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-accent text-primary"
                            onClick={() => {
                              setEditingLot(lot);
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <LotEditForm 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        onSuccess={fetchLots} 
        lot={editingLot} 
      />
    </div>
  );
}
