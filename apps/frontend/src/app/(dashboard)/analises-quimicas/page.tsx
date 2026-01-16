"use client";

import { useEffect, useState, useCallback } from "react";
import { NovaAnaliseModal } from "@/components/analises-quimicas/NovaAnaliseModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalisesQuimicasTable } from "@/components/analises-quimicas/AnalisesQuimicasTable";
import { getAnalisesQuimicas, getClients, revertAnaliseQuimicaToPendingApproval, type Pessoa } from "@/services/analisesApi";
import { AnaliseQuimica } from '@/types/analise-quimica';
import { StatusLegend } from "@/components/analises-quimicas/StatusLegend";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TipoMetal } from "@/types/tipo-metal";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { StatusAnaliseQuimica } from "@sistema-erp-electrosal/core/domain/enums/status-analise-quimica";

export default function AnalisesQuimicasPage() {
  const [analises, setAnalises] = useState<AnaliseQuimica[]>([]);
  const [clients, setClients] = useState<Pessoa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metalTypeFilter, setMetalTypeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);
  const [analiseToRevert, setAnaliseToRevert] = useState<string | null>(null);

  const fetchAnalises = useCallback(async (metalType: string, clientId: string, status: string, dateRange?: DateRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (metalType && metalType !== 'all') {
        params.append('metalType', metalType);
      }
      if (clientId && clientId !== 'all') {
        params.append('clienteId', clientId);
      }
      if (status && status !== 'all') {
        params.append('status', status);
      }
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }
      const data = await getAnalisesQuimicas(params.toString());
      setAnalises(data);
    } catch (err) {
      setError("Falha ao carregar as análises. Tente novamente mais tarde.");
      setAnalises([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const clientData = await getClients();
      setClients(clientData);
    } catch (error) {
      toast.error("Falha ao carregar a lista de clientes.");
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    fetchAnalises(metalTypeFilter, clientFilter, statusFilter, dateRange);
  }, [fetchAnalises, metalTypeFilter, clientFilter, statusFilter, dateRange]);

  const handleRevertToPendingApproval = (analiseId: string) => {
    setAnaliseToRevert(analiseId);
    setIsRevertConfirmOpen(true);
  };

  const confirmRevertToPendingApproval = async () => {
    if (!analiseToRevert) return;
    try {
      await revertAnaliseQuimicaToPendingApproval(analiseToRevert);
      toast.success("Análise revertida para 'Aguardando Aprovação' com sucesso!");
      fetchAnalises(metalTypeFilter, clientFilter, statusFilter, dateRange);
    } catch (error: any) {
      toast.error("Falha ao reverter a Análise.");
      console.error("Error reverting analysis:", error);
    } finally {
      setAnaliseToRevert(null);
      setIsRevertConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análises Químicas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label>Filtrar por Metal</Label>
            <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um metal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value={TipoMetal.AU}>Ouro (AU)</SelectItem>
                <SelectItem value={TipoMetal.AG}>Prata (AG)</SelectItem>
                <SelectItem value={TipoMetal.RH}>Ródio (RH)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label>Filtrar por Cliente</Label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label>Filtrar por Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.values(StatusAnaliseQuimica).map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label>Filtrar por Período</Label>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <StatusLegend className="mb-6" />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de Análises</CardTitle>
              <CardDescription>
                Gerencie as análises químicas pendentes e concluídas.
              </CardDescription>
            </div>
            <NovaAnaliseModal onAnaliseCreated={() => fetchAnalises(metalTypeFilter, clientFilter, statusFilter, dateRange)} />
          </CardHeader>
          <CardContent>
            <AnalisesQuimicasTable
              analises={analises}
              isLoading={isLoading}
              onAnaliseUpdated={() => fetchAnalises(metalTypeFilter, clientFilter, statusFilter, dateRange)}
              onRevertToPendingApproval={handleRevertToPendingApproval}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isRevertConfirmOpen} onOpenChange={setIsRevertConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reversão de Análise</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja reverter esta Análise Química para o status "Aguardando Aprovação"? Isso removerá o crédito de metal associado e as entradas da conta de metal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevertToPendingApproval}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
