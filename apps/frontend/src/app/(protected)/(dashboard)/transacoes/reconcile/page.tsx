'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interfaces
interface UnlinkedTransaction {
  id: string;
  descricao: string;
  valor: number;
  dataHora: string;
  tipo: 'CREDITO' | 'DEBITO';
}

interface ContaCorrente {
  id: string;
  nome: string;
}

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("pt-BR", { timeZone: 'UTC' });

export default function ReconcileTransactionsPage() {
  const [transactions, setTransactions] = useState<UnlinkedTransaction[]>([]);
  const [contas, setContas] = useState<ContaCorrente[]>([]);
  const [loading, setIsPageLoading] = useState(true);

  const fetchUnlinked = async () => {
    setIsPageLoading(true);
    try {
      const [transRes, contasRes] = await Promise.all([
        api.get('/transacoes/unlinked/all'),
        api.get('/contas-correntes'),
      ]);
      setTransactions(transRes.data);
      setContas(contasRes.data);
    } catch (error) {
      toast.error('Falha ao buscar dados para conciliação.');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchUnlinked();
  }, []);

  const handleLinkAccount = async (transacaoId: string, contaCorrenteId: string) => {
    if (!contaCorrenteId) return;

    const promise = api.patch(`/transacoes/${transacaoId}/link-account`, { contaCorrenteId });

    toast.promise(promise, {
      loading: 'Vinculando conta...',
      success: () => {
        // Remove the transaction from the list on success
        setTransactions(prev => prev.filter(t => t.id !== transacaoId));
        return 'Transação vinculada com sucesso!';
      },
      error: 'Falha ao vincular a conta.',
    });
  };

  const columns: ColumnDef<UnlinkedTransaction>[] = [
    {
      accessorKey: 'dataHora',
      header: 'Data',
      cell: ({ row }) => formatDate(row.original.dataHora),
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => (
        <span className={row.original.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(row.original.valor)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Vincular à Conta',
      cell: ({ row }) => (
        <Select onValueChange={(value) => handleLinkAccount(row.original.id, value)}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Selecione uma conta..." />
          </SelectTrigger>
          <SelectContent>
            {contas.map(conta => (
              <SelectItem key={conta.id} value={conta.id}>
                {conta.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Conciliação Manual de Transações</h1>
      <p className="text-muted-foreground mb-6">
        A lista abaixo mostra todas as transações que não foram vinculadas a nenhuma conta corrente. Selecione a conta de destino para cada uma.
      </p>
      <DataTable columns={columns} data={transactions} isLoading={loading} />
    </div>
  );
}
