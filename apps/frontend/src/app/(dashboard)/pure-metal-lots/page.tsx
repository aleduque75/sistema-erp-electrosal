"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PureMetalLot } from '@/types/pure-metal-lot';
import { getPureMetalLots, createPureMetalLot, updatePureMetalLot, deletePureMetalLot } from './pure-metal-lot.api';
import { Button } from '@/components/ui/button';
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
import { MoreHorizontal, Eye, Package, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { PureMetalLotDetailsDialog } from './components/pure-metal-lot-details-dialog';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

// Esquema de validação para o formulário de criação/edição de lote
const formSchema = z.object({
  entryDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data de entrada inválida." }),
  sourceType: z.string().min(1, { message: "Tipo de origem é obrigatório." }),
  sourceId: z.string().optional(),
  clientId: z.string().optional(),
  metalType: z.enum(["AU", "AG", "RH"], { message: "Tipo de metal é obrigatório." }),
  initialGrams: z.coerce.number().min(0.01, { message: "Gramas iniciais devem ser maiores que 0." }),
  purity: z.coerce.number().min(0.01, { message: "Pureza é obrigatória." }),
  notes: z.string().optional(),
});

// Status Configuration
const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  AVAILABLE: { label: 'Disponível', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_USED: { label: 'Parcialmente Usado', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  DEPLETED: { label: 'Esgotado', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  RESERVED: { label: 'Reservado', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
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
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entryDate: new Date().toISOString().split('T')[0],
      sourceType: "OUTROS",
      metalType: "AU",
      initialGrams: 0,
      purity: 0,
      notes: "",
    },
  });

  const sourceType = form.watch("sourceType");

  const fetchClients = async () => {
    try {
      const response = await api.get('/pessoas?role=CLIENT');
      setClients(response.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

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
    fetchClients();
  }, [hideZeroedLots, metalTypeFilter]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        ...values,
        sourceId: values.sourceType === 'ADIANTAMENTO_CLIENTE' ? values.clientId : values.sourceId
      };

      if (editingLot) {
        await updatePureMetalLot(editingLot.id, payload);
        toast.success('Lote de metal puro atualizado com sucesso!');
      } else {
        await createPureMetalLot(payload);
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
      clientId: lot.sourceType === 'ADIANTAMENTO_CLIENTE' ? lot.sourceId : undefined,
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

  const columns: ColumnDef<PureMetalLot>[] = [
    {
      accessorKey: "entryDate",
      header: "Data",
      cell: ({ row }) => new Date(row.original.entryDate).toLocaleDateString(),
    },
    {
      accessorKey: "origin",
      header: "Origem",
      cell: ({ row }) => {
        const lot = row.original;
        return (
          <span className="text-sm font-medium">
            {lot.notes || (
              <>
                {lot.originDetails?.orderNumber ? `${lot.originDetails.orderNumber} ` : ''}
                {lot.originDetails?.name ? `(${lot.originDetails.name})` : ''}
                {!lot.originDetails?.orderNumber && !lot.originDetails?.name ? lot.sourceType.replace('_', ' ') : ''}
              </>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "metalType",
      header: "Metal",
      cell: ({ row }) => <Badge variant="outline">{row.original.metalType}</Badge>,
    },
    {
      accessorKey: "initialGrams",
      header: "Inicial (g)",
      cell: ({ row }) => row.original.initialGrams.toFixed(2),
    },
    {
      accessorKey: "remainingGrams",
      header: "Restante (g)",
      cell: ({ row }) => <span className="font-bold">{row.original.remainingGrams.toFixed(2)}</span>,
    },
    {
      accessorKey: "purity",
      header: "Pureza",
      cell: ({ row }) => `${row.original.purity}%`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusInfo = statusConfig[row.original.status as string] || { label: row.original.status, color: 'bg-gray-100', dot: 'bg-gray-400' };
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} border`}>
             <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dot}`} />
             {statusInfo.label}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lot = row.original;
        return (
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
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(lot.id)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lotes de Metal Puro</h1>
          <p className="text-muted-foreground">Gerencie o estoque de metais puros e adiantamentos.</p>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Filters */}
           <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg">
            <Checkbox
              id="hide-zeroed"
              checked={hideZeroedLots}
              onCheckedChange={(checked) => setHideZeroedLots(checked as boolean)}
            />
            <Label htmlFor="hide-zeroed" className="text-sm whitespace-nowrap cursor-pointer">Ocultar zerados</Label>
          </div>
          
          <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por metal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Metais</SelectItem>
              <SelectItem value="AU">Ouro (AU)</SelectItem>
              <SelectItem value="AG">Prata (AG)</SelectItem>
              <SelectItem value="RH">Ródio (RH)</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingLot(null); form.reset(); }} className="gap-2">
                <Package className="w-4 h-4" /> Novo Lote
              </Button>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADIANTAMENTO_CLIENTE">Adiantamento Cliente</SelectItem>
                          <SelectItem value="COMPRA">Compra</SelectItem>
                          <SelectItem value="RECUPERACAO">Recuperação</SelectItem>
                          <SelectItem value="OUTROS">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {sourceType === 'ADIANTAMENTO_CLIENTE' ? (
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
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
                )}

                <FormField
                  control={form.control}
                  name="metalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Metal</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o metal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AU">Ouro (AU)</SelectItem>
                            <SelectItem value="AG">Prata (AG)</SelectItem>
                            <SelectItem value="RH">Ródio (RH)</SelectItem>
                          </SelectContent>
                        </Select>
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
      </div>

      <div className="rounded-md border">
        <DataTable columns={columns} data={pureMetalLots} />
      </div>

      <PureMetalLotDetailsDialog
        lot={selectedLotForDetails}
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
  );
}
