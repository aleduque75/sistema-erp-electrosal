"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Play, FlaskConical, CheckCircle, XCircle, ThumbsDown, RotateCw } from "lucide-react";
import { RecoveryOrder } from "@/types/recovery-order";
import { format } from 'date-fns';
import { RecoveryOrderStatus } from '@/types/recovery-order';
import { RecoveryOrderStatusBadge } from "@/components/ui/recovery-order-status-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// Componente de Legenda
const StatusLegend = () => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 bg-muted rounded-md border mb-4">
    <p className="font-semibold text-sm">Legenda:</p>
    <div className="flex items-center gap-2">
      <RecoveryOrderStatusBadge status={RecoveryOrderStatus.PENDENTE} />
      <span className="text-xs text-muted-foreground">Pendente</span>
    </div>
    <div className="flex items-center gap-2">
      <RecoveryOrderStatusBadge status={RecoveryOrderStatus.EM_ANDAMENTO} />
      <span className="text-xs text-muted-foreground">Em Andamento</span>
    </div>
    <div className="flex items-center gap-2">
      <RecoveryOrderStatusBadge status={RecoveryOrderStatus.AGUARDANDO_TEOR} />
      <span className="text-xs text-muted-foreground">Aguard. Teor</span>
    </div>
    <div className="flex items-center gap-2">
      <RecoveryOrderStatusBadge status={RecoveryOrderStatus.FINALIZADA} />
      <span className="text-xs text-muted-foreground">Finalizada</span>
    </div>
    <div className="flex items-center gap-2">
      <RecoveryOrderStatusBadge status={RecoveryOrderStatus.CANCELADA} />
      <span className="text-xs text-muted-foreground">Cancelada</span>
    </div>
  </div>
);
import {
  startRecoveryOrder,
  updateRecoveryOrderPurity,
  // finalizeRecoveryOrder, // Removed as per new workflow
} from "@/services/recoveryOrdersApi";
import { UpdateRecoveryOrderPurityModal } from "./UpdateRecoveryOrderPurityModal";
import { ProcessRecoveryFinalizationModal } from "./ProcessRecoveryFinalizationModal";
import { ViewRecoveryOrderModal } from "./ViewRecoveryOrderModal";

interface RecoveryOrdersTableProps {
  recoveryOrders: RecoveryOrder[];
  isLoading: boolean;
  onRecoveryOrderUpdated: () => void;
}

export function RecoveryOrdersTable({
  recoveryOrders,
  isLoading,
  onRecoveryOrderUpdated,
}: RecoveryOrdersTableProps) {
  const [purityModalOpen, setPurityModalOpen] = useState(false);
  const [finalizationModalOpen, setFinalizationModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RecoveryOrder | null>(null);

  const handleStartRecoveryOrder = async (recoveryOrderId: string) => {
    try {
      await startRecoveryOrder(recoveryOrderId);
      toast.success("Ordem de recuperação iniciada com sucesso!");
      onRecoveryOrderUpdated();
    } catch (error: any) {
      toast.error("Erro ao iniciar ordem de recuperação", { description: error.message });
    }
  };

  const handleOpenViewModal = (order: RecoveryOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handlePurityUpdateSuccess = () => {
    setPurityModalOpen(false);
    setSelectedOrder(null);
    onRecoveryOrderUpdated();
  };

  const handleFinalizationSuccess = () => {
    setFinalizationModalOpen(false);
    setSelectedOrder(null);
    onRecoveryOrderUpdated();
  };

  const handleOpenPurityModal = (order: RecoveryOrder) => {
    setSelectedOrder(order);
    setPurityModalOpen(true);
  };

  const handleOpenFinalizationModal = (order: RecoveryOrder) => {
    setSelectedOrder(order);
    setFinalizationModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">ID da Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Análises Químicas</TableHead>
              <TableHead>Qtd. Total (g)</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead className="w-[50px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
                <TableCell>...</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (recoveryOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <FlaskConical className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Nenhuma ordem de recuperação encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Quando novas ordens de recuperação forem criadas, elas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <StatusLegend />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">ID da Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Análises Químicas</TableHead>
              <TableHead>Qtd. Total (g)</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead className="w-[50px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recoveryOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>
                  <RecoveryOrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {order.analisesEnvolvidas && order.analisesEnvolvidas.length > 0 ? (
                    <div className="flex flex-col space-y-1">
                      {order.analisesEnvolvidas.map((analise, index) => (
                        <TooltipProvider key={analise.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs font-medium cursor-help">
                                {analise.numeroAnalise.substring(0, 6)}... ({analise.volumeOuPesoEntrada.toFixed(2)}g)
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Análise: {analise.numeroAnalise}</p>
                              <p>Cliente: {analise.clienteName}</p>
                              <p>Qtd: {analise.volumeOuPesoEntrada.toFixed(2)}g</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ) : (
                    <span>{order.chemicalAnalysisIds.length} análises</span>
                  )}
                </TableCell>
                <TableCell className="font-semibold">{(order.totalBrutoEstimadoGramas || 0).toFixed(2)}g</TableCell>
                <TableCell>{format(new Date(order.dataInicio), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{order.dataFim ? format(new Date(order.dataFim), 'dd/MM/yyyy') : 'N/A'}</TableCell>
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
                      <DropdownMenuItem
                        onClick={() => handleOpenViewModal(order)}
                      >
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      {order.status === RecoveryOrderStatus.PENDENTE && (
                        <DropdownMenuItem
                          onClick={() => handleStartRecoveryOrder(order.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Iniciar Recuperação
                        </DropdownMenuItem>
                      )}
                      {order.status === RecoveryOrderStatus.EM_ANDAMENTO && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleOpenPurityModal(order)}
                          >
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Lançar Resultado
                          </DropdownMenuItem>
                        </>
                      )}
                      {order.status === RecoveryOrderStatus.AGUARDANDO_TEOR && (
                        <DropdownMenuItem
                          onClick={() => handleOpenFinalizationModal(order)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Lançar Teor Final
                        </DropdownMenuItem>
                      )}
                      {order.status === RecoveryOrderStatus.FINALIZADA && (
                        <DropdownMenuItem disabled>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Finalizada
                        </DropdownMenuItem>
                      )}
                      {order.status === RecoveryOrderStatus.CANCELADA && (
                        <DropdownMenuItem disabled>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelada
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <UpdateRecoveryOrderPurityModal
        isOpen={purityModalOpen}
        onOpenChange={setPurityModalOpen}
        recoveryOrder={selectedOrder}
        onSuccess={handlePurityUpdateSuccess}
      />
      <ProcessRecoveryFinalizationModal
        isOpen={finalizationModalOpen}
        onOpenChange={setFinalizationModalOpen}
        recoveryOrder={selectedOrder}
        onSuccess={handleFinalizationSuccess}
      />
      <ViewRecoveryOrderModal
        isOpen={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        recoveryOrder={selectedOrder}
      />
    </>
  );
}