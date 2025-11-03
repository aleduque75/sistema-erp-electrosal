import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PureMetalLotMovement, PureMetalLotMovementType } from '@/types/pure-metal-lot';
import { getPureMetalLotMovements, createPureMetalLotMovement } from '../pure-metal-lot.api';
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

interface MovementsDialogProps {
  lotId: string | null;
  lotNumber?: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface MovementsDialogProps {
  lotId: string | null;
  lotNumber?: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formSchema = z.object({
  type: z.nativeEnum(PureMetalLotMovementType, { message: "Tipo de movimentação é obrigatório." }),
  grams: z.coerce.number().min(0.01, { message: "Gramas devem ser maiores que 0." }),
  notes: z.string().optional(),
});

export function MovementsDialog({ lotId, lotNumber, isOpen, onOpenChange }: MovementsDialogProps) {
  const [movements, setMovements] = useState<PureMetalLotMovement[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (!lotId) return;
    try {
      setLoading(true);
      const data = await getPureMetalLotMovements(lotId);
      setMovements(data);
    } catch (error) {
      toast.error('Erro ao carregar movimentações do lote.');
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lotId && isOpen) {
      fetchMovements();
    }
  }, [lotId, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!lotId) return;
    try {
      await createPureMetalLotMovement({ ...values, pureMetalLotId: lotId });
      toast.success('Movimentação criada com sucesso!');
      form.reset();
      setIsCreateModalOpen(false);
      fetchMovements();
    } catch (error) {
      toast.error('Erro ao salvar movimentação. Tente novamente.');
      console.error('Erro ao salvar movimentação:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Extrato de Movimentações do Lote: {lotNumber || lotId}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>Adicionar Movimentação</Button>
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
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Gramas</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.id}</TableCell>
                    <TableCell>{movement.type}</TableCell>
                    <TableCell>{movement.grams.toFixed(2)}</TableCell>
                    <TableCell>{new Date(movement.date).toLocaleDateString()}</TableCell>
                    <TableCell>{movement.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
