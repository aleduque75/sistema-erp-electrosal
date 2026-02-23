"use client";

import React, { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { RecoveryOrderDto } from '@/types/recovery-order';
import { RecoveryOrderDetailsModal } from './RecoveryOrderDetailsModal';
import { LaunchPurityModal } from './LaunchPurityModal';
import { LaunchResultModal } from './LaunchResultModal';
import { ApplyRecoveryOrderCommissionModal } from './ApplyRecoveryOrderCommissionModal';
import { EditRecoveryOrderModal } from './EditRecoveryOrderModal';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Play,
  FlaskConical,
  Microscope,
  Paperclip
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import api from '@/lib/api';
import { startRecoveryOrder } from '@/services/recoveryOrdersApi';

interface RecoveryOrdersTableProps {
  recoveryOrders: RecoveryOrderDto[];
  isLoading: boolean;
  onRecoveryOrderUpdated: () => void;
  onCancelRecoveryOrder: (id: string) => void;
  onApplyCommission: (order: RecoveryOrderDto) => void;
}

export function RecoveryOrdersTable({
  recoveryOrders,
  isLoading,
  onRecoveryOrderUpdated,
  onCancelRecoveryOrder,
  onApplyCommission,
}: RecoveryOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<RecoveryOrderDto | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null);

  const [recoveryOrderToLaunchPurity, setRecoveryOrderToLaunchPurity] = useState<RecoveryOrderDto | null>(null);
  const [isLaunchPurityModalOpen, setIsLaunchPurityModalOpen] = useState(false);

  const [recoveryOrderToLaunchResult, setRecoveryOrderToLaunchResult] = useState<RecoveryOrderDto | null>(null);
  const [isLaunchResultModalOpen, setIsLaunchResultModalOpen] = useState(false);

  const [recoveryOrderToEdit, setRecoveryOrderToEdit] = useState<RecoveryOrderDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleViewDetails = (id: string) => {
    const order = recoveryOrders.find(o => o.id === id);
    if (order) {
      setSelectedOrder(order);
      setIsViewModalOpen(true);
    }
  };

  const handleEdit = (id: string) => {
    const order = recoveryOrders.find(o => o.id === id);
    if (order) {
      setRecoveryOrderToEdit(order);
      setIsEditModalOpen(true);
    }
  };

  const handleDownloadPdf = async (orderId: string) => {
    setIsDownloadingPdf(orderId);
    try {
      const response = await api.get(`/recovery-orders/${orderId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `recovery_order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();

      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
      toast.success("Download do PDF iniciado.");
    } catch (error) {
      console.error("Falha ao baixar o PDF:", error);
      toast.error("Falha ao baixar o PDF. Tente novamente.");
    }
  };

  const handleStartRecoveryOrder = async (id: string) => {
    try {
      await startRecoveryOrder(id);
      toast.success("Ordem de recuperação iniciada com sucesso!");
      onRecoveryOrderUpdated();
    } catch (error) {
      toast.error("Falha ao iniciar ordem de recuperação.");
      console.error("Error starting recovery order:", error);
      onRecoveryOrderUpdated(); // Refresh table to show actual status
    }
  };

  const handleLaunchResult = (id: string) => {
    const order = recoveryOrders.find(o => o.id === id);
    if (order) {
      setRecoveryOrderToLaunchResult(order);
      setIsLaunchResultModalOpen(true);
    }
  };

  const handleLaunchPurity = (id: string) => {
    const order = recoveryOrders.find(o => o.id === id);
    if (order) {
      setRecoveryOrderToLaunchPurity(order);
      setIsLaunchPurityModalOpen(true);
    }
  };

  const handleModalSuccess = () => {
    onRecoveryOrderUpdated();
    setIsLaunchPurityModalOpen(false);
    setIsLaunchResultModalOpen(false);
  };

  const columns = useMemo(
    () => getColumns(
      handleViewDetails,
      handleEdit,
      onCancelRecoveryOrder,
      handleDownloadPdf,
      (id: string) => isDownloadingPdf === id,
      handleStartRecoveryOrder,
      handleLaunchResult,
      handleLaunchPurity,
      (id: string) => {
        const order = recoveryOrders.find(o => o.id === id);
        if (order) onApplyCommission(order);
      }
    ),
    [onCancelRecoveryOrder, isDownloadingPdf, recoveryOrders, onApplyCommission]
  );

  return (
    <>
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={recoveryOrders}
          isLoading={isLoading}
          filterColumnId="orderNumber"
          filterPlaceholder="Filtrar por número da ordem..."
        />
      </div>

      <div className="lg:hidden space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground animate-pulse italic">Carregando...</div>
        ) : recoveryOrders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground italic">Nenhuma ordem de recuperação encontrada.</div>
        ) : (
          recoveryOrders.map((order) => {
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";
            if (order.status === 'FINALIZADA') variant = 'secondary';
            if (order.status === 'CANCELADA') variant = 'destructive';

            return (
              <div
                key={order.id}
                className="p-3 rounded-xl border border-border bg-card shadow-sm space-y-2 active:scale-[0.98] transition-transform"
                onClick={() => handleViewDetails(order.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">#{order.orderNumber}</span>
                    <span className="font-bold text-sm text-foreground line-clamp-1">{order.metalType}</span>
                  </div>
                  <Badge variant={variant} className="text-[10px] px-1.5 py-0 h-5">{order.status}</Badge>
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{format(new Date(order.dataInicio), "dd/MM/yyyy")}</span>
                    <span className="text-sm font-black" style={{ color: 'hsl(var(--mobile-card-quantity, var(--foreground)))' }}>
                      {order.auPuroRecuperadoGramas?.toFixed(4) ?? "0.0000"} g
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(order.id)}>Detalhes</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(order.id)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPdf(order.id)} disabled={isDownloadingPdf === order.id}>
                          <Paperclip className="mr-2 h-4 w-4" /> {isDownloadingPdf === order.id ? "Baixando..." : "Imprimir PDF"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {order.status === "PENDENTE" && (
                          <DropdownMenuItem onClick={() => handleStartRecoveryOrder(order.id)}>
                            <Play className="mr-2 h-4 w-4" /> Iniciar
                          </DropdownMenuItem>
                        )}
                        {(order.status === "EM_ANDAMENTO" || order.status === "AGUARDANDO_RESULTADO") && (
                          <DropdownMenuItem onClick={() => handleLaunchResult(order.id)}>
                            <FlaskConical className="mr-2 h-4 w-4" /> Lançar Resultado
                          </DropdownMenuItem>
                        )}
                        {order.status === "AGUARDANDO_TEOR" && (
                          <DropdownMenuItem onClick={() => handleLaunchPurity(order.id)}>
                            <Microscope className="mr-2 h-4 w-4" /> Lançar Teor
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onApplyCommission(order)}>
                          Incluir Comissão
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onCancelRecoveryOrder(order.id)}
                          disabled={order.status === "FINALIZADA"}
                          className="text-red-600"
                        >
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedOrder && (
        <RecoveryOrderDetailsModal
          isOpen={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          recoveryOrder={selectedOrder as any}
          onUpdate={onRecoveryOrderUpdated}
        />
      )}
      {recoveryOrderToLaunchResult && (
        <LaunchResultModal
          isOpen={isLaunchResultModalOpen}
          onOpenChange={setIsLaunchResultModalOpen}
          recoveryOrder={recoveryOrderToLaunchResult}
          onSuccess={handleModalSuccess}
        />
      )}
      {recoveryOrderToLaunchPurity && (
        <LaunchPurityModal
          isOpen={isLaunchPurityModalOpen}
          onOpenChange={setIsLaunchPurityModalOpen}
          recoveryOrder={recoveryOrderToLaunchPurity}
          onSuccess={handleModalSuccess}
        />
      )}
      {recoveryOrderToEdit && (
        <EditRecoveryOrderModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          recoveryOrder={recoveryOrderToEdit as any}
          onSuccess={onRecoveryOrderUpdated}
        />
      )}
    </>
  );
}