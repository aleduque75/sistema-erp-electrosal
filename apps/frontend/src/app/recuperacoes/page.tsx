import React, { useEffect, useState } from 'react';
import { RecuperacaoDto } from '@/types/recuperacao';
import { getRecuperacoes, createRecuperacao, updateRecuperacao, deleteRecuperacao } from './recuperacao.api';

import { RecuperacaoForm } from '@/components/recuperacoes/RecuperacaoForm';
import { RecuperacoesTable } from '@/components/recuperacoes/RecuperacoesTable';
import { toast } from 'sonner';

export default function RecuperacoesPage() {
  const [recuperacoes, setRecuperacoes] = useState<RecuperacaoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);


  const fetchRecuperacoes = async () => {
    try {
      setLoading(true);
      const data = await getRecuperacoes();
      setRecuperacoes(data);
    } catch (error) {
      toast.error('Erro ao carregar recuperações.');
      console.error('Erro ao carregar recuperações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecuperacoes();
  }, []);

  if (loading) return <div>Carregando...</div>;

  const handleCreate = async (values: any) => {
    try {
      setCreating(true);
      await createRecuperacao(values);
      toast.success('Recuperação criada com sucesso!');
      fetchRecuperacoes();
    } catch (error) {
      toast.error('Erro ao criar recuperação. Tente novamente.');
      console.error('Erro ao criar recuperação:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (recuperacao: RecuperacaoDto) => {
    // For now, just show a toast - in a real app you'd open a modal or navigate to edit page
    toast.info(`Editar recuperação ${recuperacao.id} - funcionalidade em desenvolvimento`);
  };

  const handleDelete = async (recuperacao: RecuperacaoDto) => {
    if (!confirm(`Tem certeza que deseja deletar a recuperação ${recuperacao.id}?`)) return;

    try {
      await deleteRecuperacao(recuperacao.id);
      toast.success('Recuperação deletada com sucesso!');
      fetchRecuperacoes();
    } catch (error) {
      toast.error('Erro ao deletar recuperação. Tente novamente.');
      console.error('Erro ao deletar recuperação:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Recuperações</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <RecuperacoesTable recuperacoes={recuperacoes} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
        <div>
          <RecuperacaoForm onSubmit={handleCreate} isLoading={creating} />
        </div>
      </div>
    </div>
  );
}
