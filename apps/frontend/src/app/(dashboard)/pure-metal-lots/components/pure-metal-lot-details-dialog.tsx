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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

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

const movementTypeMap = {
  ENTRY: { label: 'Entrada', className: 'text-green-600 font-medium' },
  EXIT: { label: 'Saída', className: 'text-red-600 font-medium' },
  ADJUSTMENT: { label: 'Ajuste', className: 'text-amber-600 font-medium' },
};

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl">
              Detalhes do Lote: {lot?.lotNumber || lot?.id}
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
            >
              <Printer className="w-4 h-4 mr-2" />
              {isDownloadingPdf ? 'Gerando PDF...' : 'Imprimir Extrato'}
            </Button>
          </div>
        </DialogHeader>

        {lot && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b">
            <div>
              <p className="text-sm font-medium text-gray-500">Tipo de Metal</p>
              <p className="text-lg">{lot.metalType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pureza</p>
              <p className="text-lg">{lot.purity.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Peso Inicial</p>
              <p className="text-lg">{lot.initialGrams.toFixed(2)} g</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Peso Restante</p>
              <p className="text-lg font-bold text-green-600">{lot.remainingGrams.toFixed(2)} g</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Data de Entrada</p>
              <p>{format(new Date(lot.entryDate), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Origem</p>
              <p>
                {lot.originDetails?.orderNumber ? `${lot.originDetails.orderNumber} ` : ''}
                {lot.originDetails?.name ? `(${lot.originDetails.name})` : ''}
                {!lot.originDetails?.orderNumber && !lot.originDetails?.name ? lot.sourceType : ''}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Observações</p>
              <p>{lot.notes || '-'}</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Histórico de Movimentações</h3>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">Adicionar Movimentação</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Movimentação</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Movimentação</FormLabel>
                          <FormControl>
                            <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                              {Object.values(PureMetalLotMovementType).map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="grams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gramas</FormLabel>
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
                          <FormLabel>Observações (Opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Salvar</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div>Carregando...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Gramas</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{format(new Date(movement.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <span className={movementTypeMap[movement.type as keyof typeof movementTypeMap]?.className}>
                          {movementTypeMap[movement.type as keyof typeof movementTypeMap]?.label || movement.type}
                        </span>
                      </TableCell>
                      <TableCell className={movement.type === 'EXIT' ? 'text-red-600' : 'text-green-600'}>
                        {movement.type === 'EXIT' ? '-' : '+'}{movement.grams.toFixed(2)} g
                      </TableCell>
                      <TableCell>{movement.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Nenhuma movimentação registrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}