"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PureMetalLot } from '@/types/pure-metal-lot';
import { getPureMetalLots, createPureMetalLot, updatePureMetalLot, deletePureMetalLot } from './pure-metal-lot.api';
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
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye } from 'lucide-react';
import { PureMetalLotDetailsDialog } from './components/pure-metal-lot-details-dialog';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

// Esquema de validação para o formulário de criação/edição de lote
const formSchema = z.object({
  entryDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data de entrada inválida." }),
  sourceType: z.string().min(1, { message: "Tipo de origem é obrigatório." }),
  sourceId: z.string().optional(),
  metalType: z.enum(["AU", "AG", "RH"], { message: "Tipo de metal é obrigatório." }),
  initialGrams: z.coerce.number().min(0.01, { message: "Gramas iniciais devem ser maiores que 0." }),
  purity: z.coerce.number().min(0.01, { message: "Pureza é obrigatória." }),
  notes: z.string().optional(),
});

const statusMapping = {
  AVAILABLE: 'Disponível',
  DEPLETED: 'Esgotado',
  RESERVED: 'Reservado',
};

export default function PureMetalLotsPage() {
  const [pureMetalLots, setPureMetalLots] = useState<PureMetalLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<PureMetalLot | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLotForDetails, setSelectedLotForDetails] = useState<PureMetalLot | null>(null);
  const [hideZeroedLots, setHideZeroedLots] = useState(true);
  const [metalTypeFilter, setMetalTypeFilter] = useState<string | 'all'>('all');
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entryDate: new Date().toISOString().split('T')[0],
      sourceType: "",
      metalType: "AU",
      initialGrams: 0,
      purity: 0,
      notes: "",
    },
  });

  const fetchPureMetalLots = async () => {
    try {
      setLoading(true);
      const data = await getPureMetalLots({
        hideZeroed: hideZeroedLots,
        metalType: metalTypeFilter,
      });
      setPureMetalLots(data);
    } catch (error) {
      toast.error('Erro ao carregar lotes de metal puro.');
      console.error('Erro ao carregar lotes de metal puro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPureMetalLots();
  }, [hideZeroedLots, metalTypeFilter]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingLot) {
        await updatePureMetalLot(editingLot.id, values);
        toast.success('Lote de metal puro atualizado com sucesso!');
      } else {
        await createPureMetalLot(values);
        toast.success('Lote de metal puro criado com sucesso!');
      }
      form.reset();
      setIsModalOpen(false);
      setEditingLot(null);
      fetchPureMetalLots();
    } catch (error) {
      toast.error('Erro ao salvar lote de metal puro. Tente novamente.');
      console.error('Erro ao salvar lote de metal puro:', error);
    }
  };

  const handleEdit = (lot: PureMetalLot) => {
    setEditingLot(lot);
    form.reset({
      entryDate: new Date(lot.entryDate).toISOString().split('T')[0],
      sourceType: lot.sourceType,
      sourceId: lot.sourceId,
      metalType: lot.metalType,
      initialGrams: lot.initialGrams,
      purity: lot.purity,
      notes: lot.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (lotId: string) => {
    if (!confirm(`Tem certeza que deseja deletar o lote ${lotId}?`)) return;

    try {
      await deletePureMetalLot(lotId);
      toast.success('Lote de metal puro deletado com sucesso!');
      fetchPureMetalLots();
    } catch (error) {
      toast.error('Erro ao deletar lote de metal puro. Tente novamente.');
      console.error('Erro ao deletar lote de metal puro:', error);
    }
  };

  const handleViewDetails = (lot: PureMetalLot) => {
    setSelectedLotForDetails(lot);
    setIsDetailsModalOpen(true);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lotes de Metal Puro</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLot(null); form.reset(); }}>Novo Lote</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLot ? "Editar Lote de Metal Puro" : "Novo Lote de Metal Puro"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Entrada</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Origem</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID de Origem (Opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Metal</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option value="AU">Ouro (AU)</option>
                          <option value="AG">Prata (AG)</option>
                          <option value="RH">Ródio (RH)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialGrams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gramas Iniciais</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pureza (%)</FormLabel>
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

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hide-zeroed"
            checked={hideZeroedLots}
            onCheckedChange={(checked) => setHideZeroedLots(checked as boolean)}
          />
          <Label htmlFor="hide-zeroed">Esconder lotes zerados</Label>
        </div>
        <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por metal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Metais</SelectItem>
            <SelectItem value="AU">Ouro (AU)</SelectItem>
            <SelectItem value="AG">Prata (AG)</SelectItem>
            <SelectItem value="RH">Ródio (RH)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data de Entrada</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Tipo Metal</TableHead>
              <TableHead>Gramas Iniciais</TableHead>
              <TableHead>Gramas Restantes</TableHead>
              <TableHead>Pureza</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pureMetalLots.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell>{new Date(lot.entryDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {lot.originDetails?.orderNumber ? `${lot.originDetails.orderNumber} ` : ''}
                  {lot.originDetails?.name ? `(${lot.originDetails.name})` : ''}
                  {!lot.originDetails?.orderNumber && !lot.originDetails?.name ? lot.sourceType : ''}
                </TableCell>
                <TableCell>{lot.metalType}</TableCell>
                <TableCell>{lot.initialGrams.toFixed(2)}</TableCell>
                <TableCell>{lot.remainingGrams.toFixed(2)}</TableCell>
                <TableCell>{lot.purity.toFixed(2)}%</TableCell>
                <TableCell>{statusMapping[lot.status as keyof typeof statusMapping] || lot.status}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleViewDetails(lot)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(lot)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(lot.id)}>
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

      <PureMetalLotDetailsDialog
        lot={selectedLotForDetails}
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
  );
}
