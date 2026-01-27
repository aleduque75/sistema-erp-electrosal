"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PureMetalLotMovement, PureMetalLotMovementType } from '@/types/pure-metal-lot';
import { getPureMetalLotMovements, createPureMetalLotMovement, updatePureMetalLotMovement, deletePureMetalLotMovement } from '../../pure-metal-lot.api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useParams } from 'next/navigation'; // Para obter o ID da URL
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Esquema de validação para o formulário de criação/edição de movimentação
const formSchema = z.object({
  type: z.nativeEnum(PureMetalLotMovementType, { message: "Tipo de movimentação é obrigatório." }),
  grams: z.coerce.number().min(0.01, { message: "Gramas devem ser maiores que 0." }),
  notes: z.string().optional(),
});

export default function PureMetalLotMovementsPage() {
  const params = useParams();
  const pureMetalLotId = params.id as string;

  const [movements, setMovements] = useState<PureMetalLotMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<PureMetalLotMovement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: PureMetalLotMovementType.ENTRY,
      grams: 0,
      notes: "",
    },
  });

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const data = await getPureMetalLotMovements(pureMetalLotId);
      setMovements(data);
    } catch (error) {
      toast.error('Erro ao carregar movimentações do lote de metal puro.');
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pureMetalLotId) {
      fetchMovements();
    }
  }, [pureMetalLotId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingMovement) {
        await updatePureMetalLotMovement(editingMovement.id, values);
        toast.success('Movimentação atualizada com sucesso!');
      } else {
        await createPureMetalLotMovement({ ...values, pureMetalLotId });
        toast.success('Movimentação criada com sucesso!');
      }
      form.reset();
      setIsModalOpen(false);
      setEditingMovement(null);
      fetchMovements();
    } catch (error) {
      toast.error('Erro ao salvar movimentação. Tente novamente.');
      console.error('Erro ao salvar movimentação:', error);
    }
  };

  const handleEdit = (movement: PureMetalLotMovement) => {
    setEditingMovement(movement);
    form.reset({
      type: movement.type,
      grams: movement.grams,
      notes: movement.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (movementId: string) => {
    if (!confirm(`Tem certeza que deseja deletar a movimentação ${movementId}?`)) return;

    try {
      await deletePureMetalLotMovement(movementId);
      toast.success('Movimentação deletada com sucesso!');
      fetchMovements();
    } catch (error) {
      toast.error('Erro ao deletar movimentação. Tente novamente.');
      console.error('Erro ao deletar movimentação:', error);
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Extrato de Movimentações do Lote: {pureMetalLotId}</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingMovement(null); form.reset(); }}>Adicionar Movimentação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMovement ? "Editar Movimentação" : "Nova Movimentação"}</DialogTitle>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Gramas</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(movement)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(movement.id)}>
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
