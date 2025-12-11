"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}

export default function BulkEditTransacoesPage() {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = useState({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [newContaContabilId, setNewContaContabilId] = useState("");

  const { data: transacoes, isLoading: isLoadingTransacoes } = useQuery({
    queryKey: ["transacoes", dateRange],
    queryFn: () =>
      api.get("/transacoes", {
        params: {
          startDate: dateRange.from?.toISOString(),
          endDate: dateRange.to?.toISOString(),
        },
      }).then((res) => res.data),
  });

  const { data: contasContabeis, isLoading: isLoadingContas } = useQuery<ContaContabil[]>({
    queryKey: ["contasContabeis"],
    queryFn: () => api.get("/contas-contabeis").then((res) => res.data),
  });

  // Reset selection when filters change
  useEffect(() => {
    setRowSelection({});
  }, [dateRange, descriptionFilter]);

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { transactionIds: string[]; contaContabilId: string }) =>
      api.post("/transacoes/bulk-update-conta-contabil", data),
    onSuccess: () => {
      toast.success("Transações atualizadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      setRowSelection({});
      setNewContaContabilId("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Falha ao atualizar transações.");
    },
  });

  const filteredTransacoes = useMemo(() => {
    if (!transacoes) return [];
    return transacoes.filter(t => 
      t.descricao?.toLowerCase().includes(descriptionFilter.toLowerCase())
    );
  }, [transacoes, descriptionFilter]);

  const selectedTransactionIds = useMemo(() => {
    if (!filteredTransacoes) return [];
    return Object.keys(rowSelection).map(
      (index) => filteredTransacoes[parseInt(index, 10)].id
    );
  }, [rowSelection, filteredTransacoes]);

  const handleBulkUpdate = () => {
    if (selectedTransactionIds.length === 0 || !newContaContabilId) {
      toast.error("Selecione as transações e a nova conta contábil.");
      return;
    }
    bulkUpdateMutation.mutate({
      transactionIds: selectedTransactionIds,
      contaContabilId: newContaContabilId,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edição em Massa de Transações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <DatePicker date={dateRange.from} setDate={(date) => setDateRange(prev => ({...prev, from: date}))} placeholder="Data Inicial" />
              <DatePicker date={dateRange.to} setDate={(date) => setDateRange(prev => ({...prev, to: date}))} placeholder="Data Final" />
            </div>
             <Input
                placeholder="Filtrar por descrição..."
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                className="max-w-sm"
              />
          </div>

          {selectedTransactionIds.length > 0 && (
            <div className="p-4 bg-muted rounded-lg flex items-center justify-between gap-4">
              <span className="text-sm font-medium">
                {selectedTransactionIds.length} transações selecionadas
              </span>
              <div className="flex items-center gap-2">
                <Combobox
                  options={contasContabeis?.map(c => ({ value: c.id, label: `${c.codigo} - ${c.nome}`})) || []}
                  value={newContaContabilId}
                  onChange={setNewContaContabilId}
                  placeholder="Selecione a nova conta"
                  searchPlaceholder="Buscar conta..."
                  emptyText="Nenhuma conta encontrada."
                  className="w-[300px]"
                />
                <Button
                  onClick={handleBulkUpdate}
                  disabled={bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? "Aplicando..." : "Aplicar"}
                </Button>
              </div>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredTransacoes}
            isLoading={isLoadingTransacoes}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </CardContent>
      </Card>
    </div>
  );
}
