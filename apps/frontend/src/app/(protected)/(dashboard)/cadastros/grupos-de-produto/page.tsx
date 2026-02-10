'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { columns, ProductGroup } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProductGroupForm, ProductGroupFormValues } from './product-group-form';
import { toast } from 'sonner';
import { DataTableRowActions } from './data-table-row-actions';

import api from '@/lib/api';

const API_URL = '/product-groups'; // O prefixo /api é adicionado pelo client

// SWR fetcher function usando o cliente API customizado
const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function ProductGroupsPage() {
  const { data, error, isLoading, mutate } = useSWR<ProductGroup[]>(
    API_URL,
    fetcher,
  );
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleNew = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  const handleEdit = (group: ProductGroup) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) {
      return;
    }

    try {
      await api.delete(`${API_URL}/${groupId}`);
      toast.success('Sucesso', { description: 'Grupo de produto excluído.' });
      mutate(); // Revalida os dados do SWR
    } catch (error: any) {
      const message = error.response?.data?.message || 'Falha ao excluir o grupo de produto.';
      toast.error('Erro', { description: message });
    }
  };

  const handleSubmit = async (values: ProductGroupFormValues) => {
    setSubmitting(true);
    const url = editingGroup ? `${API_URL}/${editingGroup.id}` : API_URL;
    const method = editingGroup ? 'patch' : 'post';

    try {
      await api[method](url, values);

      toast.success('Sucesso', {
        description: `Grupo de produto ${editingGroup ? 'atualizado' : 'criado'}.`,
      });
      setDialogOpen(false);
      mutate(); // Revalida os dados para atualizar a tabela
    } catch (error: any) {
      const message = error.response?.data?.message || 'Falha ao salvar o grupo de produto.';
      toast.error('Erro', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  // Pass action handlers to the columns definition
  const tableColumns = columns.map((col) => {
    if (col.id === 'actions') {
      return {
        ...col,
        cell: ({ row }) => (
          <DataTableRowActions 
            row={row} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        ),
      };
    }
    return col;
  });

  if (error) return <div>Falha ao carregar os dados.</div>;
  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="container mx-auto py-10">
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Grupos de Produto</h1>
          <Button onClick={handleNew}>Novo Grupo</Button>
        </div>
        <DataTable columns={tableColumns} data={data || []} />

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
          </DialogHeader>
          <ProductGroupForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            defaultValues={editingGroup || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
