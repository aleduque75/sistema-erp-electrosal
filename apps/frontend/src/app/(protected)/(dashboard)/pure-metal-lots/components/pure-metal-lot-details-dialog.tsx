import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PureMetalLot, PureMetalLotMovement, PureMetalLotMovementType } from '@/types/pure-metal-lot';
import { getPureMetalLotMovements, createPureMetalLotMovement, downloadPureMetalLotPdf } from '../pure-metal-lot.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Printer, Package, Scale, Calendar, ArrowUpRight, ArrowDownLeft, History, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PureMetalLotDetailsDialogProps {
  lot: PureMetalLot | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formSchema = z.object({
  type: z.nativeEnum(PureMetalLotMovementType, { message: "Tipo de movimentação é obrigatório." }),
  grams: z.coerce.number().min(0.01, { message: "Gramas devem ser maiores que 0." }),
  notes: z.string().optional(),
});

export function PureMetalLotDetailsDialog({ lot, isOpen, onOpenChange }: PureMetalLotDetailsDialogProps) {
  const [movements, setMovements] = useState<PureMetalLotMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: PureMetalLotMovementType.ENTRY,
      grams: 0,
      notes: "",
    },
  });

  const fetchMovements = async () => {
    if (!lot) return;
    try {
      setLoading(true);
      const data = await getPureMetalLotMovements(lot.id);
      setMovements(data);
    } catch (error) {
      toast.error('Erro ao carregar movimentações do lote.');
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lot && isOpen) {
      fetchMovements();
    }
  }, [lot, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!lot) return;
    try {
      await createPureMetalLotMovement({ ...values, pureMetalLotId: lot.id });
      toast.success('Movimentação criada com sucesso!');
      form.reset();
      setIsCreateModalOpen(false);
      fetchMovements();
    } catch (error) {
      toast.error('Erro ao salvar movimentação. Tente novamente.');
      console.error('Erro ao salvar movimentação:', error);
    }
  };

  const handleDownloadPdf = async () => {
    if (!lot) return;
    try {
      setIsDownloadingPdf(true);
      const blob = await downloadPureMetalLotPdf(lot.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lote_${lot.lotNumber || lot.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
      toast.success('Download do PDF iniciado.');
    } catch (error) {
      toast.error('Erro ao baixar o PDF.');
      console.error('Erro ao baixar PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!lot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                Lote {lot.lotNumber || lot.id}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{lot.metalType}</Badge>
                <span className="text-sm text-muted-foreground">{lot.purity.toFixed(2)}% Pureza</span>
              </div>
            </div>
            <div className="flex gap-2">
                <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                >
                <Printer className="w-4 h-4 mr-2" />
                {isDownloadingPdf ? 'Gerando...' : 'Extrato PDF'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                    <span className="sr-only">Fechar</span>
                    {/* X icon is default in DialogContent close button, adding explicit close action button if needed or rely on default X */}
                </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5" /> Peso Inicial
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">{lot.initialGrams.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">g</span></div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Entrada: {format(new Date(lot.entryDate), 'dd/MM/yyyy')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" /> Origem
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="font-medium truncate" title={lot.originDetails?.name || lot.sourceType}>
                    {lot.originDetails?.name || lot.sourceType}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {lot.originDetails?.orderNumber ? `Ref: ${lot.originDetails.orderNumber}` : (lot.notes || '-')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5" /> Saldo Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-black text-primary">{lot.remainingGrams.toFixed(2)} <span className="text-lg font-bold text-primary/70">g</span></div>
                <div className="text-xs font-medium text-primary/80 mt-1">
                    Disponível para uso
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movements Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <History className="w-4 h-4" /> Histórico de Movimentações
                </h3>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" size="sm">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Nova Movimentação
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Nova Movimentação Manual</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ENTRY">Entrada (Ajuste +)</SelectItem>
                                    <SelectItem value="EXIT">Saída (Ajuste -)</SelectItem>
                                    <SelectItem value="ADJUSTMENT">Correção</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="grams"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quantidade (g)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Motivo do ajuste..." />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full">Salvar Movimentação</Button>
                    </form>
                    </Form>
                </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="py-8 text-center text-muted-foreground">Carregando histórico...</div>
            ) : movements.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>Nenhuma movimentação registrada.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {movements.map((movement) => (
                        <div key={movement.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${movement.type === 'EXIT' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {movement.type === 'EXIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">
                                        {movement.type === 'ENTRY' ? 'Entrada / Recebimento' : 
                                         movement.type === 'EXIT' ? 'Saída / Utilização' : 'Ajuste Manual'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(movement.date), 'dd/MM/yyyy HH:mm')} • {movement.notes || 'Sem observações'}</p>
                                </div>
                            </div>
                            <div className={`text-right font-mono font-bold ${movement.type === 'EXIT' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {movement.type === 'EXIT' ? '-' : '+'}{movement.grams.toFixed(2)} g
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-4 border-t bg-muted/10">
            <Button onClick={() => onOpenChange(false)}>Fechar Detalhes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}